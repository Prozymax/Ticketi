# Pi Network Events Server

A robust Node.js/Express server with Sequelize ORM designed for high-traffic Pi Network event management platform.

## Features

### 🚀 Production-Ready Architecture
- **Environment-specific configurations** (DEV, TEST, PROD)
- **Connection pooling** with automatic retry logic
- **Rate limiting** with Redis support
- **Comprehensive logging** with Winston
- **Security middleware** with Helmet, CORS, compression
- **Graceful shutdown** handling
- **Health monitoring** and connection statistics

### 🔒 Security & Performance
- **Multi-layer rate limiting** (Global, Auth, Events, Pi Network)
- **Request size limiting** and validation
- **IP whitelisting** for admin endpoints
- **SQL injection protection** via Sequelize
- **Memory leak prevention** with connection monitoring
- **DDoS protection** with global rate limiting

### 📊 Monitoring & Observability
- **Real-time connection monitoring**
- **Query performance tracking**
- **Health check endpoints**
- **Detailed logging** with different levels
- **Error tracking** and reporting
- **Database statistics** and metrics

## Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit your environment variables
nano .env
```

### 2. Database Setup
```bash
# Install dependencies
npm install

# Create database (MySQL)
mysql -u root -p -e "CREATE DATABASE pinetwork_events_dev;"
mysql -u root -p -e "CREATE DATABASE pinetwork_events_test;"

# Run migrations (if using Sequelize CLI)
npm run db:migrate
```

### 3. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start

# Test mode
npm test
```

## Environment Variables

### Database Configuration
```env
# Development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=pinetwork_events_dev
DB_USER=root
DB_PASSWORD=your_password

# Production
PROD_DB_HOST=your_production_host
PROD_DB_NAME=pinetwork_events_prod
PROD_DB_USER=your_prod_user
PROD_DB_PASSWORD=your_prod_password
DB_SSL=true
```

### Security & Performance
```env
# Rate Limiting
REDIS_URL=redis://localhost:6379
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
JWT_SECRET=your_super_secret_jwt_key
MAX_REQUEST_SIZE=10mb
ADMIN_IPS=127.0.0.1,::1
```

## API Endpoints

### Health & Monitoring
- `GET /health` - System health check
- `GET /api/admin/stats` - Admin statistics (IP restricted)

### Authentication
- `POST /api/auth/pi-login` - Pi Network authentication
- `POST /api/auth/logout` - User logout

### Events
- `GET /api/events` - List events (paginated)
- `GET /api/events/:id` - Get single event
- `POST /api/events/create` - Create new event

### Pi Network Integration
- `POST /api/pi/payment` - Initiate Pi payment
- `POST /api/pi/verify-payment` - Verify payment status

## Database Models

### User Model
- Pi Network integration
- User types (basic, verified, premium, admin)
- Preferences and privacy settings
- Login tracking and statistics

### Event Model
- Comprehensive event management
- Category and status tracking
- Attendance and capacity management
- Rating and review system

### EventAttendance Model
- Registration and payment tracking
- Check-in functionality
- Status management

## Rate Limiting Strategy

### Global Protection
- **1000 requests/minute** globally
- **100 requests/15min** per IP (general API)
- **5 requests/15min** per IP (authentication)
- **10 events/hour** per IP (event creation)
- **20 requests/5min** per IP (Pi Network operations)

### Dynamic Limiting
- **Basic users**: 100 requests/15min
- **Verified users**: 200 requests/15min
- **Premium users**: 500 requests/15min
- **Admin users**: 1000 requests/15min

## Connection Management

### Pool Configuration
```javascript
// Development
pool: {
  max: 10,
  min: 0,
  acquire: 30000,
  idle: 10000
}

// Production
pool: {
  max: 50,
  min: 10,
  acquire: 60000,
  idle: 30000
}
```

### Monitoring Features
- **Real-time pool statistics**
- **Connection health checks** (30s intervals)
- **Slow query detection** (>1s warning, >5s logging)
- **Automatic reconnection** on connection loss
- **Graceful degradation** under high load

## Error Handling

### Graceful Shutdown
- **SIGTERM/SIGINT** signal handling
- **30-second timeout** for forced shutdown
- **Connection cleanup** (DB, Redis, HTTP)
- **In-flight request completion**

### Error Recovery
- **Automatic retry** on connection errors
- **Circuit breaker** pattern for external services
- **Fallback mechanisms** for non-critical features
- **Detailed error logging** with context

## Performance Optimizations

### Database
- **Connection pooling** with optimal sizing
- **Query optimization** with proper indexing
- **Prepared statements** via Sequelize
- **Soft deletes** for data integrity

### Caching Strategy
- **Redis integration** for rate limiting
- **In-memory caching** for frequently accessed data
- **CDN integration** ready for static assets

### Request Processing
- **Compression middleware** (gzip)
- **Request size limiting**
- **JSON parsing optimization**
- **Static file serving** in production

## Monitoring & Alerts

### Health Checks
```bash
# Basic health check
curl http://localhost:5000/health

# Admin statistics (requires IP whitelist)
curl http://localhost:5000/api/admin/stats
```

### Log Levels
- **ERROR**: Critical errors requiring immediate attention
- **WARN**: Warning conditions (slow queries, high pool usage)
- **INFO**: General information (startup, shutdown, connections)
- **HTTP**: Request/response logging
- **DEBUG**: Detailed debugging information

## Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up Redis for rate limiting
- [ ] Configure SSL/TLS certificates
- [ ] Set up reverse proxy (nginx)
- [ ] Configure log rotation
- [ ] Set up monitoring (PM2, Docker)
- [ ] Configure backup strategy

### Docker Support
```dockerfile
# Example Dockerfile structure
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Follow the existing code structure
2. Add proper error handling and logging
3. Include tests for new features
4. Update documentation
5. Ensure security best practices

## License

MIT License - see LICENSE file for details