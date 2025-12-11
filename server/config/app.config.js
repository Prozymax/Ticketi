const { dbManager } = require('./db.config');
const { logger } = require('../utils/logger');
const models = require('../models/index.model');
const config = require('./environment.config');
const corsConfig = require('./cors.config');
// const { securityHeaders, apiRateLimit } = require('../middleware/security.middleware');
// const { sanitizeInput, validateFileUpload } = require('../middleware/sanitization.middleware');
const cacheService = require('../services/cache.service');
const s3Service = require('../services/s3.service');

class App {
    constructor() {
        this.port = process.env.PORT || 3000;
        this.express = require('express');
        this.app = this.express();
        this.jwt = require('jsonwebtoken');
        this.bodyParser = this.express.json();
        this.encoder = this.express.urlencoded({ extended: true });
        this.cors = require('cors');
        this.morgan = require('morgan');
        this.bcrypt = require('bcrypt');
        this.cookieParser = require('cookie-parser');
        this.server = require('http').createServer(this.app);
        this.environment = process.env.NODE_ENV || 'development';
        this.path = require('path');
        this.initialized = false;
        this.status = [];
        this.healthCheckInterval = null;
    }

    // use socket.io for real-time communication for notifications and all
    startServer = () => {
        this.server.listen(this.port, () => {
            this.status.push('Server is running at ' + this.port + ' in ' + this.environment + ' mode');
            this.initialized = true;
            logger.info(`Server is running on port ${this.port}`);
        });
        this.server.on('error', (error) => {
            logger.error(`Error starting server: ${error}`);
        });
    }

    stopServer = async () => {
        this.server.close(async (error) => {
            if (error) {
                logger.error(`Error stopping server: ${error}`);
                return;
            }

            // Clear health check interval
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
                this.healthCheckInterval = null;
                logger.info('Health check interval cleared');
            }

            // Disconnect cache service
            try {
                await cacheService.disconnect();
                this.status.push('Cache service disconnected');
                logger.info('Cache service disconnected');
            } catch (error) {
                logger.error('Error disconnecting cache service:', error);
            }

            // Close database connection
            await dbManager.close();
            this.status.push('Server closed and DB connection closed');
            this.initialized = false;
            logger.info('Database connection closed');
            logger.info('Server closed');
        });
    }

    routes = () => {
        const indexRouter = require('../routes/index.route');
        this.app.use('/', indexRouter);
        logger.info('Routes are set up successfully...');
    }

    init = async () => {
        try {
            // Initialize database first
            await this.startDb();
            logger.info('Initializing database connection...');

            // Initialize cache service
            await this.initializeCache();
            logger.info('Initializing cache service...');

            // Initialize S3 service
            await this.initializeS3();
            logger.info('Initializing S3 storage service...');

            // Start health check for Redis connection
            this.startHealthCheck();

            // Configure security middleware first
            // this.app.use(securityHeaders);

            // Configure CORS with proper cookie support
            corsConfig.logConfiguration();
            this.app.use(corsConfig.handlePreflight.bind(corsConfig));
            this.app.use(this.cors(corsConfig.getMainCorsOptions()));

            // Rate limiting
            // this.app.use('/api/');
            this.app.set('trust proxy', process.env.NODE_ENV === 'development' ? false : 1)

            // Body parsing middleware
            this.app.use(this.morgan('combined'));
            this.app.use(this.bodyParser);
            this.app.use(this.encoder);
            this.app.use(this.cookieParser()); // Add cookie parser middleware

            // Debug middleware for development
            if (this.environment === 'development') {
                this.app.use((req, res, next) => {
                    if (req.path.includes('/auth') || req.path.includes('/login')) {
                        logger.info(`🔍 ${req.method} ${req.path}`);
                        logger.info(`Origin: ${req.headers.origin}`);
                        logger.info(`Cookies: ${JSON.stringify(req.cookies)}`);
                        logger.info(`User-Agent: ${req.headers['user-agent']?.substring(0, 50)}...`);
                    }
                    next();
                });
            }

            // Static file serving with proper CORS and headers
            this.app.use('/public', this.cors(corsConfig.getStaticCorsOptions()),
                this.express.static('public', {
                    maxAge: '1d',
                    etag: false
                })
            );

            this.app.use('/uploads', this.cors(corsConfig.getStaticCorsOptions()),
                this.express.static('uploads', {
                    maxAge: '1d',
                    etag: false,
                    setHeaders: (res, path) => {
                        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
                    }
                })
            );

            this.app.use('/assets', this.cors(corsConfig.getPublicAssetsCorsOptions()),
                this.express.static('constants/images', {
                    maxAge: '1d',
                    etag: false
                })
            );

            logger.info('Configuring middleware...');

            // Initialize routes
            this.routes();
            logger.info('Initializing routes...');

            // Initialize event scheduler
            const EventScheduler = require('../services/event.scheduler');
            EventScheduler.init();
            logger.info('Event scheduler initialized...');

            // Start server
            this.startServer();
            logger.info('Starting server...');

            this.initialized = true;
            this.status.push('Routes initialized and mapped succesffully')
            return true;
        } catch (error) {
            logger.error('Application initialization failed:', error);
            throw error;
        }
    }

    startDb = async () => {
        try {
            const db = await dbManager.initialize(models);
            await db.authenticate();
            this.status.push('Database connection has been established successfully.');
            logger.info('Database connection has been established successfully.');
        } catch (error) {
            this.status.push('Unable to connect to the database: ' + error);
            logger.error('Unable to connect to the database:', error);
            throw error; // Optionally re-throw to fail fast
        }
    }

    initializeCache = async () => {
        try {
            await cacheService.initialize();
            this.status.push('Cache service initialized successfully.');
            logger.info('Cache service initialized successfully.');
        } catch (error) {
            this.status.push('Cache service initialization failed, running without cache: ' + error.message);
            logger.warn('Cache service initialization failed, running without cache:', error);
            // Don't throw error - app can run without cache
        }
    }

    initializeS3 = async () => {
        try {
            logger.info('🔧 Initializing S3 storage service...');
            
            const initialized = await s3Service.initialize();
            
            if (initialized) {
                this.status.push('✅ S3 storage service initialized successfully.');
                
                // Start S3 health checks
                s3Service.startHealthCheck(60000); // Check every 60 seconds
                
                const config = s3Service.getConfigInfo();
                logger.info('✅ S3 storage service ready', {
                    bucket: config.bucket,
                    region: config.region,
                    endpoint: config.endpoint,
                    status: 'connected'
                });
            } else {
                this.status.push('⚠️  S3 storage service not available - file uploads will fail.');
                logger.warn('⚠️  S3 storage service not available');
                logger.warn('   File uploads will fail until S3 is configured');
                logger.warn('   Configure: S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT');
            }
        } catch (error) {
            this.status.push('❌ S3 storage service initialization failed: ' + error.message);
            logger.error('❌ S3 storage service initialization failed:', {
                error: error.message,
                stack: error.stack
            });
            logger.warn('⚠️  Application will continue without S3 storage');
            // Don't throw error - app can run without S3 (but uploads will fail)
        }
    }

    startHealthCheck = () => {
        // Validate Redis and S3 connections every 30 seconds
        this.healthCheckInterval = setInterval(async () => {
            // Redis health check
            const redisHealth = cacheService.getHealthStatus();
            
            if (!redisHealth.connected && !redisHealth.fallbackMode) {
                logger.warn('Redis health check: Connection lost, attempting reconnection...');
            } else if (redisHealth.fallbackMode) {
                logger.warn(`Redis health check: Running in fallback mode (reconnect attempts: ${redisHealth.reconnectAttempts})`);
            } else {
                logger.debug('Redis health check: Connection healthy');
            }

            // S3 health check
            const s3Health = s3Service.getHealthStatus();
            
            if (s3Health.initialized && !s3Health.connected) {
                logger.warn('S3 health check: Connection lost', {
                    bucket: s3Health.bucket,
                    lastCheck: s3Health.lastHealthCheck?.timestamp
                });
            } else if (s3Health.connected) {
                logger.debug('S3 health check: Connection healthy', {
                    uploads: s3Health.metrics.uploads,
                    errors: s3Health.metrics.errors
                });
            }

            // Log metrics periodically
            const cacheMetrics = cacheService.getMetrics();
            logger.debug('Cache metrics:', cacheMetrics);
        }, 30000); // 30 seconds

        logger.info('🏥 Health check started for Redis and S3 (interval: 30 seconds)');
    }

    getStatus = () => {
        return {
            initialized: this.initialized,
            result: this.status
        };
    }
}
const app = new App();

module.exports = app;