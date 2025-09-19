const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const logger = require('./logger');

class RateLimiterService {
  constructor() {
    this.redisClient = null;
    this.initializeRedis();
  }

  async initializeRedis() {
    if (process.env.REDIS_URL) {
      try {
        this.redisClient = redis.createClient({
          url: process.env.REDIS_URL,
          retry_strategy: (options) => {
            if (options.error && options.error.code === 'ECONNREFUSED') {
              logger.error('Redis server connection refused');
              return new Error('Redis server connection refused');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
              logger.error('Redis retry time exhausted');
              return new Error('Retry time exhausted');
            }
            if (options.attempt > 10) {
              logger.error('Redis max retry attempts reached');
              return undefined;
            }
            return Math.min(options.attempt * 100, 3000);
          }
        });

        this.redisClient.on('error', (err) => {
          logger.error('Redis client error:', err);
        });

        this.redisClient.on('connect', () => {
          logger.info('Connected to Redis server');
        });

        await this.redisClient.connect();
      } catch (error) {
        logger.warn('Redis connection failed, falling back to memory store:', error.message);
        this.redisClient = null;
      }
    }
  }

  // General API rate limiter
  createApiLimiter(options = {}) {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json(defaultOptions.message);
      }
    };

    const config = { ...defaultOptions, ...options };

    // Use Redis store if available
    if (this.redisClient) {
      config.store = new RedisStore({
        sendCommand: (...args) => this.redisClient.sendCommand(args),
      });
    }

    return rateLimit(config);
  }

  // Strict limiter for authentication endpoints
  createAuthLimiter() {
    return this.createApiLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 auth requests per windowMs
      message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
      },
      skipSuccessfulRequests: true // Don't count successful requests
    });
  }

  // Limiter for event creation
  createEventLimiter() {
    return this.createApiLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // Limit each IP to 10 event creations per hour
      message: {
        error: 'Too many events created, please try again later.',
        retryAfter: '1 hour'
      }
    });
  }

  // Limiter for file uploads
  createUploadLimiter() {
    return this.createApiLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 50, // Limit each IP to 50 uploads per hour
      message: {
        error: 'Too many file uploads, please try again later.',
        retryAfter: '1 hour'
      }
    });
  }

  // Dynamic limiter based on user type
  createDynamicLimiter() {
    return (req, res, next) => {
      const user = req.user;
      let maxRequests = 100; // Default for anonymous users
      
      if (user) {
        // Adjust limits based on user type/subscription
        switch (user.type) {
          case 'premium':
            maxRequests = 1000;
            break;
          case 'verified':
            maxRequests = 500;
            break;
          case 'basic':
            maxRequests = 200;
            break;
          default:
            maxRequests = 100;
        }
      }

      const limiter = this.createApiLimiter({
        max: maxRequests,
        keyGenerator: (req) => {
          // Use user ID if authenticated, otherwise IP
          return user ? `user:${user.id}` : `ip:${req.ip}`;
        }
      });

      return limiter(req, res, next);
    };
  }

  // Global limiter for DDoS protection
  createGlobalLimiter() {
    return this.createApiLimiter({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 1000, // Global limit of 1000 requests per minute
      message: {
        error: 'Server is experiencing high traffic, please try again later.',
        retryAfter: '1 minute'
      },
      keyGenerator: () => 'global', // Single key for all requests
      skip: (req) => {
        // Skip for health checks and internal requests
        return req.path === '/health' || req.ip === '127.0.0.1';
      }
    });
  }

  // Custom limiter for Pi Network specific operations
  createPiNetworkLimiter() {
    return this.createApiLimiter({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 20, // Limit Pi Network API calls
      message: {
        error: 'Too many Pi Network operations, please try again later.',
        retryAfter: '5 minutes'
      },
      keyGenerator: (req) => {
        // Use Pi user ID if available
        return req.piUser ? `pi:${req.piUser.uid}` : `ip:${req.ip}`;
      }
    });
  }

  async closeRedisConnection() {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        logger.info('Redis connection closed');
      } catch (error) {
        logger.error('Error closing Redis connection:', error);
      }
    }
  }
}

module.exports = new RateLimiterService();