# Redis Integration Design Document

## Overview

This document outlines the design for implementing a comprehensive Redis caching and optimization system for the Ticketi event platform server. The system will provide intelligent caching, session management, rate limiting, and real-time data handling to improve performance and scalability.

### Goals

- Reduce database query load by 60-80% through intelligent caching
- Improve API response times by 40-70% for frequently accessed data
- Implement distributed rate limiting to protect against abuse
- Enable horizontal scaling through Redis-based session storage
- Provide graceful degradation when Redis is unavailable
- Maintain zero data loss during Redis failures

### Non-Goals

- Real-time pub/sub messaging (future enhancement)
- Redis Cluster setup (single instance with replication)
- Cache warming strategies (implement on-demand caching only)
- Redis Streams for event sourcing

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Express Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │  │  Middleware  │  │   Services   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  Cache Service  │                        │
│                   │  (Singleton)    │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Redis Client   │
                    │  (ioredis)      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Redis Server   │
                    │  (Cloud/Local)  │
                    └─────────────────┘
```

### Component Interaction Flow

1. **Request Flow with Cache**:
   ```
   Client Request → Controller → Cache Service (check) → 
   Cache Hit? → Return Cached Data
   Cache Miss? → Service Layer → Database → Cache Service (set) → Return Data
   ```

2. **Cache Invalidation Flow**:
   ```
   Update/Delete Request → Controller → Service Layer → Database → 
   Cache Service (invalidate) → Success Response
   ```

3. **Rate Limiting Flow**:
   ```
   Client Request → Rate Limit Middleware → Redis (increment counter) → 
   Limit Exceeded? → 429 Response
   Within Limit? → Continue to Controller
   ```

## Components and Interfaces

### 1. Cache Service (`server/services/cache.service.js`)

The core service that manages all Redis operations with a singleton pattern.

#### Interface

```javascript
class CacheService {
    // Initialization
    async initialize()
    async disconnect()
    isConnected()
    
    // Basic Operations
    async get(key)
    async set(key, value, ttl = 3600)
    async del(key)
    async exists(key)
    
    // Batch Operations
    async mget(keys)
    async mset(keyValuePairs, ttl = 3600)
    async mdel(keys)
    
    // Pattern Operations
    async keys(pattern)
    async deletePattern(pattern)
    
    // TTL Management
    async ttl(key)
    async expire(key, seconds)
    
    // Cache Strategies
    async getOrSet(key, fetchFunction, ttl = 3600)
    async invalidateByPattern(pattern)
    
    // Health & Metrics
    getMetrics()
    getHealthStatus()
}
```

#### Key Features

- **Connection Management**: Automatic reconnection with exponential backoff
- **Fallback Mode**: Graceful degradation when Redis is unavailable
- **Key Prefixing**: Environment-based key prefixes (dev_, prod_, test_)
- **Serialization**: Automatic JSON serialization/deserialization
- **Error Handling**: All operations wrapped in try-catch with logging
- **Metrics Tracking**: Hit rate, miss rate, operation counts

#### Configuration

```javascript
{
    host: process.env.REDIS_URL || 'localhost',
    port: process.env.DEV_REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME || 'default',
    db: process.env.DEV_REDIS_DB || 0,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    lazyConnect: false,
    connectTimeout: 10000,
    keepAlive: 30000,
    family: 4
}
```

### 2. Redis Configuration (`server/config/redis.config.js`)

Centralized configuration management for Redis connections.

#### Interface

```javascript
class RedisConfig {
    getConnectionConfig(environment)
    getPoolConfig()
    getRetryStrategy()
    validateConfig()
}
```

#### Environment-Specific Configuration

- **Development**: Local Redis or cloud instance with debug logging
- **Production**: Cloud Redis with TLS, connection pooling, and monitoring
- **Test**: Separate Redis DB or mock Redis for testing

### 3. Rate Limiting Middleware (`server/middleware/rate-limit.middleware.js`)

Redis-based distributed rate limiting with fallback to memory.

#### Interface

```javascript
class RateLimiter {
    // Middleware factories
    createApiLimiter(options)
    createAuthLimiter(options)
    createPaymentLimiter(options)
    
    // Core functionality
    async checkLimit(identifier, limit, window)
    async resetLimit(identifier)
    async getRemainingRequests(identifier)
}
```

#### Rate Limit Tiers

```javascript
{
    api: {
        windowMs: 60000,        // 1 minute
        max: 100,               // 100 requests
        message: 'Too many requests'
    },
    auth: {
        windowMs: 60000,
        max: 10,
        message: 'Too many authentication attempts'
    },
    payment: {
        windowMs: 60000,
        max: 5,
        message: 'Too many payment requests'
    }
}
```

### 4. Session Store (`server/middleware/session.middleware.js`)

Redis-backed session storage for distributed authentication.

#### Interface

```javascript
class RedisSessionStore {
    async get(sessionId)
    async set(sessionId, session, ttl = 86400)
    async destroy(sessionId)
    async touch(sessionId)
    async destroyByUserId(userId)
    async getAllSessions(userId)
}
```

#### Session Data Structure

```javascript
{
    userId: 'string',
    username: 'string',
    isVerified: boolean,
    createdAt: timestamp,
    lastActivity: timestamp,
    ipAddress: 'string',
    userAgent: 'string'
}
```

### 5. Cache Decorators (`server/utils/cache.decorators.js`)

Utility decorators for easy cache integration in services.

#### Interface

```javascript
// Method decorator for automatic caching
function Cacheable(options) {
    // options: { key, ttl, condition }
}

// Method decorator for cache invalidation
function CacheEvict(options) {
    // options: { key, pattern, allEntries }
}

// Usage example:
class EventService {
    @Cacheable({ key: 'event:{id}', ttl: 1800 })
    async getEventById(id) { }
    
    @CacheEvict({ pattern: 'event:*' })
    async updateEvent(id, data) { }
}
```

## Data Models

### Cache Key Patterns

```
# Events
event:{eventId}                    # Single event details
events:published:page:{page}       # Paginated published events
events:trending:page:{page}        # Trending events
events:location:{location}:page:{page}  # Events by location
events:organizer:{userId}:page:{page}   # Events by organizer

# Users
user:profile:{userId}              # User profile data
user:followers:{userId}            # Follower count
user:events:{userId}:page:{page}   # User's events

# Sessions
session:{sessionId}                # User session data
sessions:user:{userId}             # All sessions for a user

# Payments
payment:transaction:{txId}         # Payment transaction
payment:verification:{reference}   # Payment verification result
payment:token:{userId}             # Payment gateway token

# Rate Limiting
ratelimit:api:{ip}                 # API rate limit counter
ratelimit:auth:{ip}                # Auth rate limit counter
ratelimit:payment:{userId}         # Payment rate limit counter

# Metrics
metrics:cache:hits                 # Cache hit counter
metrics:cache:misses               # Cache miss counter
metrics:cache:operations           # Total operations counter
```

### TTL Strategy

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Event Details | 1800s (30min) | Events change infrequently |
| Event Lists | 300s (5min) | Lists need fresher data |
| User Profiles | 1800s (30min) | Profiles change infrequently |
| User Sessions | 86400s (24h) | Standard session duration |
| Payment Transactions | 1800s (30min) | Temporary transaction state |
| Payment Verifications | 300s (5min) | Short-lived verification |
| Rate Limit Counters | 60s (1min) | Sliding window duration |
| Follower Counts | 300s (5min) | Social metrics update frequently |

## Error Handling

### Error Categories

1. **Connection Errors**
   - Redis server unavailable
   - Network timeout
   - Authentication failure
   - **Handling**: Enable fallback mode, log error, continue without cache

2. **Operation Errors**
   - Serialization failure
   - Invalid key format
   - Memory limit exceeded
   - **Handling**: Log error, return null, don't throw exception

3. **Data Errors**
   - Corrupted cache data
   - Deserialization failure
   - Type mismatch
   - **Handling**: Delete corrupted key, log error, fetch from database

### Fallback Strategy

```javascript
class CacheService {
    constructor() {
        this.fallbackMode = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
    }
    
    enableFallbackMode() {
        this.fallbackMode = true;
        logger.warn('Cache service entering fallback mode');
        this.scheduleReconnect();
    }
    
    async scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('Max reconnect attempts reached');
            return;
        }
        
        setTimeout(async () => {
            try {
                await this.initialize();
                this.fallbackMode = false;
                this.reconnectAttempts = 0;
                logger.info('Cache service reconnected successfully');
            } catch (error) {
                this.reconnectAttempts++;
                this.scheduleReconnect();
            }
        }, 60000); // Retry every 60 seconds
    }
}
```

## Testing Strategy

### Unit Tests

1. **Cache Service Tests**
   - Connection initialization and failure handling
   - Basic CRUD operations (get, set, del, exists)
   - Batch operations (mget, mset, mdel)
   - TTL management and expiration
   - Fallback mode behavior
   - Metrics tracking accuracy

2. **Rate Limiter Tests**
   - Request counting accuracy
   - Window sliding behavior
   - Limit enforcement
   - Fallback to memory-based limiting
   - Reset functionality

3. **Session Store Tests**
   - Session creation and retrieval
   - Session expiration
   - Session invalidation
   - Multi-session management per user

### Integration Tests

1. **Cache Integration**
   - Event caching and retrieval flow
   - Cache invalidation on updates
   - Concurrent access handling
   - Cache miss and database fallback

2. **Rate Limiting Integration**
   - API endpoint protection
   - Auth endpoint stricter limits
   - Payment endpoint limits
   - Distributed rate limiting across instances

3. **Session Integration**
   - Login and session creation
   - Session validation on requests
   - Logout and session cleanup
   - Session extension on activity

### Performance Tests

1. **Load Testing**
   - 1000 concurrent cache operations
   - Cache hit rate under load
   - Response time with/without cache
   - Memory usage monitoring

2. **Stress Testing**
   - Redis connection pool exhaustion
   - High rate limit scenarios
   - Rapid cache invalidation
   - Network latency simulation

### Test Environment Setup

```javascript
// test/setup/redis.setup.js
const Redis = require('ioredis-mock');

beforeAll(async () => {
    // Use redis-mock for testing
    global.redisClient = new Redis();
});

afterAll(async () => {
    await global.redisClient.flushall();
    await global.redisClient.quit();
});
```

## Performance Optimization

### 1. Connection Pooling

```javascript
const poolConfig = {
    min: 5,              // Minimum connections
    max: 50,             // Maximum connections
    idleTimeoutMillis: 300000,  // 5 minutes
    acquireTimeoutMillis: 30000  // 30 seconds
}
```

### 2. Pipelining for Batch Operations

```javascript
async mset(keyValuePairs, ttl = 3600) {
    const pipeline = this.client.pipeline();
    
    for (const [key, value] of Object.entries(keyValuePairs)) {
        const prefixedKey = this.getPrefixedKey(key);
        const serialized = JSON.stringify(value);
        pipeline.setex(prefixedKey, ttl, serialized);
    }
    
    await pipeline.exec();
}
```

### 3. Lazy Loading Strategy

- Cache data only when first accessed (no cache warming)
- Use `getOrSet` pattern for automatic cache population
- Implement cache-aside pattern for all read operations

### 4. Memory Management

```javascript
// Set maxmemory policy in Redis
maxmemory-policy: allkeys-lru  // Evict least recently used keys
maxmemory: 256mb               // Set appropriate memory limit
```

### 5. Compression for Large Values

```javascript
async set(key, value, ttl = 3600) {
    const serialized = JSON.stringify(value);
    
    // Compress if value is large (> 1KB)
    if (serialized.length > 1024) {
        const compressed = await compress(serialized);
        await this.client.setex(key, ttl, compressed);
    } else {
        await this.client.setex(key, ttl, serialized);
    }
}
```

## Monitoring and Observability

### Metrics to Track

1. **Cache Performance**
   - Hit rate percentage
   - Miss rate percentage
   - Average response time
   - Total operations per minute

2. **Connection Health**
   - Active connections count
   - Failed connection attempts
   - Reconnection events
   - Connection pool utilization

3. **Memory Usage**
   - Total memory used
   - Key count
   - Eviction count
   - Fragmentation ratio

4. **Rate Limiting**
   - Requests blocked per endpoint
   - Top rate-limited IPs
   - Average requests per client

### Logging Strategy

```javascript
// Log levels and events
logger.info('Cache hit', { key, ttl });
logger.info('Cache miss', { key });
logger.warn('Cache operation slow', { key, duration });
logger.error('Cache operation failed', { key, error });
logger.info('Cache invalidated', { pattern, count });
```

### Health Check Endpoint

```javascript
// GET /api/health/cache
{
    status: 'healthy' | 'degraded' | 'down',
    redis: {
        connected: boolean,
        uptime: number,
        memory: {
            used: string,
            peak: string
        }
    },
    cache: {
        hitRate: number,
        missRate: number,
        totalOperations: number
    },
    fallbackMode: boolean
}
```

## Security Considerations

### 1. Connection Security

- Use TLS for production Redis connections
- Authenticate with username/password
- Restrict Redis access to application servers only
- Use VPC/private network for Redis instances

### 2. Data Security

- Never cache sensitive payment card data
- Encrypt session tokens before caching
- Use secure session IDs (cryptographically random)
- Implement key expiration for all cached data

### 3. Access Control

- Use Redis ACL to limit command access
- Disable dangerous commands (FLUSHALL, KEYS in production)
- Implement application-level access control for cache operations

### 4. Rate Limiting Security

- Use IP-based rate limiting for public endpoints
- Use user-based rate limiting for authenticated endpoints
- Implement progressive delays for repeated violations
- Log and alert on suspicious rate limit patterns

## Deployment Considerations

### Environment Configuration

```bash
# Development
DEV_REDIS_HOST=localhost
DEV_REDIS_PORT=6379
DEV_REDIS_PASSWORD=
DEV_REDIS_DB=0

# Production
REDIS_URL=redis-xxxxx.cloud.redislabs.com
REDIS_USERNAME=default
REDIS_PASSWORD=<secure-password>
PROD_REDIS_DB=0
REDIS_TLS=true
```

### Redis Server Setup

1. **Development**: Local Redis or Redis Cloud free tier
2. **Production**: Redis Cloud, AWS ElastiCache, or Railway Redis
3. **Scaling**: Single instance with replication (master-replica)
4. **Backup**: Enable RDB snapshots and AOF persistence

### Migration Strategy

1. **Phase 1**: Deploy cache service without enabling (testing)
2. **Phase 2**: Enable caching for read-heavy endpoints (events, profiles)
3. **Phase 3**: Enable rate limiting with generous limits
4. **Phase 4**: Enable session storage (gradual rollout)
5. **Phase 5**: Optimize TTLs based on metrics

### Rollback Plan

- Feature flags for enabling/disabling cache per endpoint
- Fallback mode automatically handles Redis failures
- Can disable Redis entirely by commenting out initialization
- No data loss as cache is supplementary to database

## Future Enhancements

1. **Redis Pub/Sub**: Real-time notifications and event broadcasting
2. **Redis Streams**: Event sourcing and audit logging
3. **Cache Warming**: Pre-populate cache for popular events
4. **Geo-Distributed Caching**: Multi-region Redis deployment
5. **Advanced Analytics**: Cache access patterns and optimization recommendations
6. **Automatic Cache Invalidation**: Database triggers for cache invalidation
