# Ticketi Server

Backend server for the Ticketi event platform built with Node.js, Express, and Sequelize.

## Prerequisites

- Node.js (v14 or higher)
- MySQL database
- Redis server (optional but recommended for caching and session management)

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables in `.env`

### Database Configuration

Configure your MySQL database connection:

```env
# Development
DEV_HOST=localhost
DEV_DB=ticketi_db
DEV_USER=root
DEV_DIALECT=mysql
DEV_PORT=3306
DEV_PASSWORD=your_password

# Production
PROD_HOST=your_production_host
PROD_DB=your_production_db
PROD_USER=your_production_user
PROD_DIALECT=mysql
PROD_PORT=3306
PROD_PASSWORD=your_production_password
```

### Redis Configuration

Redis is used for caching, session management, and rate limiting. The application will work without Redis (fallback mode), but performance will be significantly reduced.

#### Why Redis?

- **Caching**: Reduces database queries by 60-80% for frequently accessed data
- **Session Management**: Distributed session storage for horizontal scaling
- **Rate Limiting**: Protects API endpoints from abuse
- **Performance**: Improves API response times by 40-70%

#### Development Setup

For local development, you can use:
- Local Redis installation (recommended)
- Redis Cloud free tier
- Docker Redis container

**Configuration:**
```env
DEV_REDIS_HOST=localhost
DEV_REDIS_PORT=6379
DEV_REDIS_PASSWORD=
DEV_REDIS_DB=0
```

#### Test Environment Setup

For testing, use a separate Redis database to avoid conflicts:

```env
TEST_REDIS_HOST=localhost
TEST_REDIS_PORT=6379
TEST_REDIS_PASSWORD=
TEST_REDIS_DB=1
```

#### Production Setup

For production, use a managed Redis service with TLS support:

**Option 1: Using REDIS_URL (recommended for cloud services)**
```env
REDIS_URL=your-redis-host.cloud.redislabs.com
REDIS_USERNAME=default
REDIS_PASSWORD=your_secure_password
REDIS_TLS=true
```

**Option 2: Using individual parameters**
```env
PROD_REDIS_HOST=your-redis-host.com
PROD_REDIS_PORT=6379
PROD_REDIS_PASSWORD=your_secure_password
PROD_REDIS_DB=0
REDIS_TLS=true
```

#### Installing Redis Locally

**Windows:**
- Download Redis from [Redis Windows](https://github.com/microsoftarchive/redis/releases)
- Or use WSL2 with Redis (recommended):
  ```bash
  wsl --install
  sudo apt-get update
  sudo apt-get install redis-server
  sudo service redis-server start
  ```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name ticketi-redis redis:latest
```

#### Redis Cloud Setup (Recommended for Production)

1. Sign up at [Redis Cloud](https://redis.com/try-free/)
2. Create a free database (30MB free tier available)
3. Copy the connection details:
   - Endpoint (REDIS_URL)
   - Username (usually "default")
   - Password
4. Update your `.env` file with the credentials
5. Set `REDIS_TLS=true` for secure connections

#### Verifying Redis Connection

After starting the server, check the logs for:
```
✓ Redis connected successfully
✓ Cache service initialized
```

Or visit the health check endpoint:
```bash
curl http://localhost:6001/api/health/cache
```

#### Troubleshooting Redis

**Connection Failed:**
- Verify Redis is running: `redis-cli ping` (should return "PONG")
- Check firewall settings
- Verify credentials in `.env`

**Fallback Mode:**
- Application continues without Redis
- Check logs for connection errors
- Performance will be reduced but functionality maintained

**Memory Issues:**
- Monitor Redis memory usage
- Configure maxmemory policy in Redis
- Consider upgrading Redis instance size

## Installation

```bash
npm install
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Features

- **Caching**: Redis-based caching for improved performance
- **Session Management**: Distributed session storage with Redis
- **Rate Limiting**: Redis-backed rate limiting to prevent abuse
- **Graceful Degradation**: Application continues to work if Redis is unavailable
- **Health Checks**: Built-in health check endpoints for monitoring

## Redis Features

The server includes comprehensive Redis integration:

- **Automatic Reconnection**: Exponential backoff retry strategy
- **Fallback Mode**: Application continues without Redis if unavailable
- **Health Monitoring**: Periodic connection health checks
- **Environment-Specific Config**: Different settings for dev/test/prod
- **Connection Pooling**: Optimized connection management
- **TLS Support**: Secure connections for production

## API Documentation

API endpoints are available at `/api/*`

## License

MIT
