const cacheService = require('../services/cache.service');
const { logger } = require('../utils/logger');

/**
 * In-memory fallback store for rate limiting when Redis is unavailable
 */
class MemoryStore {
    constructor() {
        this.store = new Map();
        this.cleanupInterval = 60000; // Clean up every 60 seconds
        this.startCleanup();
    }

    /**
     * Start periodic cleanup of expired entries
     */
    startCleanup() {
        this.cleanupTimer = setInterval(() => {
            const now = Date.now();
            for (const [key, data] of this.store.entries()) {
                if (data.resetTime < now) {
                    this.store.delete(key);
                }
            }
        }, this.cleanupInterval);
    }

    /**
     * Stop cleanup timer
     */
    stopCleanup() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
    }

    /**
     * Increment counter for a key
     * @param {string} key - Rate limit key
     * @param {number} windowMs - Time window in milliseconds
     * @returns {Object} Current count and reset time
     */
    increment(key, windowMs) {
        const now = Date.now();
        const data = this.store.get(key);

        if (!data || data.resetTime < now) {
            // Create new entry or reset expired entry
            const resetTime = now + windowMs;
            this.store.set(key, { count: 1, resetTime });
            return { count: 1, resetTime };
        }

        // Increment existing entry
        data.count++;
        this.store.set(key, data);
        return { count: data.count, resetTime: data.resetTime };
    }

    /**
     * Reset counter for a key
     * @param {string} key - Rate limit key
     */
    reset(key) {
        this.store.delete(key);
    }
}

/**
 * Rate Limiter class using Redis with memory fallback
 */
class RateLimiter {
    constructor() {
        this.memoryStore = new MemoryStore();
    }

    /**
     * Check and increment rate limit for an identifier
     * @param {string} identifier - Unique identifier (IP, user ID, etc.)
     * @param {number} limit - Maximum requests allowed
     * @param {number} windowMs - Time window in milliseconds
     * @returns {Promise<Object>} Rate limit status
     */
    async checkLimit(identifier, limit, windowMs) {
        const key = `ratelimit:${identifier}`;
        const windowSeconds = Math.ceil(windowMs / 1000);

        try {
            // Try Redis first if connected
            if (cacheService.isConnected()) {
                return await this.checkLimitRedis(key, limit, windowSeconds);
            } else {
                // Fallback to memory store
                logger.debug(`Rate limiter using memory fallback for ${identifier}`);
                return this.checkLimitMemory(key, limit, windowMs);
            }
        } catch (error) {
            logger.error('Rate limit check failed, using memory fallback:', error);
            return this.checkLimitMemory(key, limit, windowMs);
        }
    }

    /**
     * Check rate limit using Redis (sliding window algorithm)
     * @param {string} key - Rate limit key
     * @param {number} limit - Maximum requests allowed
     * @param {number} windowSeconds - Time window in seconds
     * @returns {Promise<Object>} Rate limit status
     */
    async checkLimitRedis(key, limit, windowSeconds) {
        try {
            const client = cacheService.client;
            const now = Date.now();
            const windowStart = now - (windowSeconds * 1000);

            // Use Redis sorted set for sliding window
            const multi = client.multi();
            
            // Remove old entries outside the window
            multi.zremrangebyscore(key, 0, windowStart);
            
            // Count current entries in window
            multi.zcard(key);
            
            // Add current request
            multi.zadd(key, now, `${now}-${Math.random()}`);
            
            // Set expiration
            multi.expire(key, windowSeconds);

            const results = await multi.exec();
            
            // Get count before adding current request
            const currentCount = results[1][1];
            const newCount = currentCount + 1;

            const allowed = newCount <= limit;
            const remaining = Math.max(0, limit - newCount);
            const resetTime = now + (windowSeconds * 1000);

            return {
                allowed,
                limit,
                remaining,
                resetTime,
                current: newCount
            };

        } catch (error) {
            logger.error('Redis rate limit check failed:', error);
            throw error;
        }
    }

    /**
     * Check rate limit using memory store (fallback)
     * @param {string} key - Rate limit key
     * @param {number} limit - Maximum requests allowed
     * @param {number} windowMs - Time window in milliseconds
     * @returns {Object} Rate limit status
     */
    checkLimitMemory(key, limit, windowMs) {
        const { count, resetTime } = this.memoryStore.increment(key, windowMs);
        const allowed = count <= limit;
        const remaining = Math.max(0, limit - count);

        return {
            allowed,
            limit,
            remaining,
            resetTime,
            current: count
        };
    }

    /**
     * Reset rate limit for an identifier
     * @param {string} identifier - Unique identifier
     * @returns {Promise<void>}
     */
    async resetLimit(identifier) {
        const key = `ratelimit:${identifier}`;

        try {
            if (cacheService.isConnected()) {
                await cacheService.del(key);
            }
            this.memoryStore.reset(key);
        } catch (error) {
            logger.error('Failed to reset rate limit:', error);
        }
    }

    /**
     * Get remaining requests for an identifier
     * @param {string} identifier - Unique identifier
     * @param {number} limit - Maximum requests allowed
     * @param {number} windowMs - Time window in milliseconds
     * @returns {Promise<number>} Remaining requests
     */
    async getRemainingRequests(identifier, limit, windowMs) {
        const key = `ratelimit:${identifier}`;
        const windowSeconds = Math.ceil(windowMs / 1000);

        try {
            if (cacheService.isConnected()) {
                const client = cacheService.client;
                const now = Date.now();
                const windowStart = now - (windowSeconds * 1000);

                // Count entries in current window
                const count = await client.zcount(key, windowStart, now);
                return Math.max(0, limit - count);
            } else {
                // Memory fallback
                const data = this.memoryStore.store.get(key);
                if (!data || data.resetTime < Date.now()) {
                    return limit;
                }
                return Math.max(0, limit - data.count);
            }
        } catch (error) {
            logger.error('Failed to get remaining requests:', error);
            return limit; // Return full limit on error
        }
    }

    /**
     * Create rate limiting middleware
     * @param {Object} options - Rate limit options
     * @returns {Function} Express middleware
     */
    createMiddleware(options) {
        const {
            windowMs = 60000,
            max = 100,
            message = 'Too many requests, please try again later',
            keyGenerator = (req) => req.ip,
            skip = () => false,
            handler = null
        } = options;

        return async (req, res, next) => {
            try {
                // Skip rate limiting if skip function returns true
                if (skip(req)) {
                    return next();
                }

                // Generate unique key for this request
                const identifier = keyGenerator(req);

                if (!identifier) {
                    logger.warn('Rate limiter: No identifier generated, skipping');
                    return next();
                }

                // Check rate limit
                const result = await this.checkLimit(identifier, max, windowMs);

                // Set rate limit headers
                res.setHeader('X-RateLimit-Limit', result.limit);
                res.setHeader('X-RateLimit-Remaining', result.remaining);
                res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

                if (!result.allowed) {
                    // Calculate retry after in seconds
                    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
                    res.setHeader('Retry-After', retryAfter);

                    logger.warn(`Rate limit exceeded for ${identifier}`, {
                        limit: result.limit,
                        current: result.current,
                        resetTime: new Date(result.resetTime).toISOString()
                    });

                    // Use custom handler if provided
                    if (handler) {
                        return handler(req, res, next);
                    }

                    return res.status(429).json({
                        success: false,
                        message,
                        retryAfter,
                        limit: result.limit,
                        resetTime: new Date(result.resetTime).toISOString()
                    });
                }

                // Request allowed, continue
                next();

            } catch (error) {
                logger.error('Rate limiter middleware error:', error);
                // On error, allow the request to continue
                next();
            }
        };
    }

    /**
     * Create API rate limiter (100 requests per minute per IP)
     * @returns {Function} Express middleware
     */
    createApiLimiter() {
        return this.createMiddleware({
            windowMs: 60000, // 60 seconds
            max: 100,
            message: 'Too many requests from this IP, please try again later',
            keyGenerator: (req) => `api:${req.ip}`,
            skip: (req) => {
                // Skip rate limiting for health check endpoints
                return req.path.startsWith('/health') || req.path.startsWith('/api/health');
            }
        });
    }

    /**
     * Create authentication rate limiter (10 requests per minute per IP)
     * @returns {Function} Express middleware
     */
    createAuthLimiter() {
        return this.createMiddleware({
            windowMs: 60000, // 60 seconds
            max: 10,
            message: 'Too many authentication attempts, please try again later',
            keyGenerator: (req) => `auth:${req.ip}`
        });
    }

    /**
     * Create payment rate limiter (5 requests per minute per user)
     * @returns {Function} Express middleware
     */
    createPaymentLimiter() {
        return this.createMiddleware({
            windowMs: 60000, // 60 seconds
            max: 5,
            message: 'Too many payment requests, please try again later',
            keyGenerator: (req) => {
                // Use user ID if authenticated, otherwise use IP
                const userId = req.user?.userId || req.user?.id;
                return userId ? `payment:user:${userId}` : `payment:ip:${req.ip}`;
            }
        });
    }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

// Export factory methods and instance
module.exports = {
    rateLimiter,
    createApiLimiter: () => rateLimiter.createApiLimiter(),
    createAuthLimiter: () => rateLimiter.createAuthLimiter(),
    createPaymentLimiter: () => rateLimiter.createPaymentLimiter()
};
