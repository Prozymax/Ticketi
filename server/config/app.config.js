const { dbManager } = require('./db.config');
const { logger } = require('../utils/logger');
const models = require('../models/index.model');
const config = require('./environment.config');
const corsConfig = require('./cors.config');
// const { securityHeaders, apiRateLimit } = require('../middleware/security.middleware');
// const { sanitizeInput, validateFileUpload } = require('../middleware/sanitization.middleware');
// const cacheService = require('../services/cache.service');

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
            // await this.initializeCache();
            logger.info('Initializing cache service...');

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

    getStatus = () => {
        return {
            initialized: this.initialized,
            result: this.status
        };
    }
}
const app = new App();

module.exports = app;