require('dotenv').config();

const express = require('express');
const path = require('path');
const logger = require('./utils/logger');
const modelManager = require('./models');
const securityMiddleware = require('./middleware/security');
const rateLimiter = require('./utils/rateLimiter');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;
    this.isShuttingDown = false;
  }

  async initialize() {
    try {
      // Initialize database and models
      await this.initializeDatabase();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Start server
      await this.startServer();
      
      logger.info('Server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize server:', error);
      process.exit(1);
    }
  }

  async initializeDatabase() {
    try {
      logger.info('Initializing database connection...');
      await modelManager.initialize();
      
      // Sync database in development
      if (process.env.NODE_ENV === 'development') {
        await modelManager.syncModels({ alter: true });
      }
      
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  setupMiddleware() {
    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);

    // Security middleware
    this.app.use(securityMiddleware.helmet);
    this.app.use(securityMiddleware.cors);
    this.app.use(securityMiddleware.compression);
    
    // Rate limiting
    this.app.use('/api/', rateLimiter.createGlobalLimiter());
    this.app.use('/api/auth/', rateLimiter.createAuthLimiter());
    this.app.use('/api/events/create', rateLimiter.createEventLimiter());
    this.app.use('/api/upload/', rateLimiter.createUploadLimiter());
    this.app.use('/api/pi/', rateLimiter.createPiNetworkLimiter());

    // Body parsing
    this.app.use(express.json({ 
      limit: process.env.MAX_REQUEST_SIZE || '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: process.env.MAX_REQUEST_SIZE || '10mb' 
    }));

    // Request logging
    this.app.use(securityMiddleware.requestLogger);
    
    // Request size limiting
    this.app.use(securityMiddleware.requestSizeLimit);

    logger.info('Middleware setup completed');
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const dbHealth = await modelManager.healthCheck();
        const connectionStats = await modelManager.databaseConnection?.getConnectionStats();
        
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          database: dbHealth,
          connections: connectionStats,
          environment: process.env.NODE_ENV
        });
      } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // API routes
    this.app.use('/api/auth', require('./routes/auth'));
    this.app.use('/api/users', require('./routes/users'));
    this.app.use('/api/events', require('./routes/events'));
    this.app.use('/api/pi', require('./routes/piNetwork'));
    this.app.use('/api/admin', require('./routes/admin'));

    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      this.app.use(express.static(path.join(__dirname, '../client/build')));
      
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build/index.html'));
      });
    }

    // 404 handler
    this.app.use(securityMiddleware.notFoundHandler);

    logger.info('Routes setup completed');
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use(securityMiddleware.errorHandler);

    // Graceful shutdown handling
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => this.gracefulShutdown('SIGUSR2')); // nodemon

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('unhandledRejection');
    });

    logger.info('Error handling setup completed');
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (error) => {
        if (error) {
          reject(error);
        } else {
          logger.info(`Server running on port ${this.port} in ${process.env.NODE_ENV || 'development'} mode`);
          resolve();
        }
      });

      // Handle server errors
      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${this.port} is already in use`);
        } else {
          logger.error('Server error:', error);
        }
        reject(error);
      });
    });
  }

  async gracefulShutdown(signal) {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Set a timeout for forced shutdown
    const forceShutdownTimeout = setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 30000); // 30 seconds

    try {
      // Stop accepting new connections
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }

      // Close database connections
      await modelManager.closeConnection();
      
      // Close Redis connection
      await rateLimiter.closeRedisConnection();

      clearTimeout(forceShutdownTimeout);
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      clearTimeout(forceShutdownTimeout);
      process.exit(1);
    }
  }

  getApp() {
    return this.app;
  }
}

// Initialize and start server
const server = new Server();

if (require.main === module) {
  server.initialize().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = server;