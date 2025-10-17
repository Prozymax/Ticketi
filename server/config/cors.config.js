const config = require('./environment.config');
const { logger } = require('../utils/logger');

/**
 * CORS Configuration for handling cross-origin requests with cookies
 * This is especially important for authentication cookies in development
 */
class CorsConfig {
    constructor() {
        this.environment = process.env.NODE_ENV || 'development';
    }

    /**
     * Get CORS options for the main application
     */
    getMainCorsOptions() {
        const corsOptions = {
            origin: (origin, callback) => {
                const allowedOrigins = config.server.corsOrigins;
                console.log(allowedOrigins);

                // Allow requests with no origin (mobile apps, Postman, etc.)
                if (!origin) {
                    return callback(null, true);
                }

                // Check if origin is in allowed list
                if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    logger.warn(`CORS blocked origin: ${origin}`);
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true, // Essential for cookies
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'Accept',
                'Origin',
                'Cache-Control',
                'X-File-Name'
            ],
            exposedHeaders: [
                'Set-Cookie'
            ],
            optionsSuccessStatus: 200, // For legacy browser support
            preflightContinue: false
        };

        // In development, be more permissive for easier debugging
        if (this.environment === 'development') {
            corsOptions.origin = (origin, callback) => {
                // Allow localhost on any port in development
                if (!origin ||
                    origin.startsWith('http://localhost:') ||
                    origin.startsWith('http://127.0.0.1:') ||
                    config.server.corsOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    logger.warn(`CORS blocked origin in dev: ${origin}`);
                    callback(null, true); // Still allow in dev for debugging
                }
            };
        }

        return corsOptions;
    }

    /**
     * Get CORS options for static file serving
     */
    getStaticCorsOptions() {
        return {
            origin: config.server.corsOrigins,
            credentials: true,
            methods: ['GET', 'HEAD', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            maxAge: 86400 // 24 hours
        };
    }

    /**
     * Get CORS options for public assets (more permissive)
     */
    getPublicAssetsCorsOptions() {
        return {
            origin: '*', // Public assets can be accessed from anywhere
            credentials: false,
            methods: ['GET', 'HEAD'],
            allowedHeaders: ['Content-Type'],
            maxAge: 86400 // 24 hours
        };
    }

    /**
     * Middleware to handle preflight requests manually if needed
     */
    handlePreflight(req, res, next) {
        if (req.method === 'OPTIONS') {
            const origin = req.headers.origin;
            const allowedOrigins = config.server.corsOrigins;

            if (!origin || allowedOrigins.includes(origin) ||
                (this.environment === 'development' && origin.startsWith('http://localhost:'))) {

                res.header('Access-Control-Allow-Origin', origin || '*');
                res.header('Access-Control-Allow-Credentials', 'true');
                res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin,Cache-Control,X-File-Name');
                res.header('Access-Control-Max-Age', '86400');

                return res.status(200).end();
            }
        }
        next();
    }

    /**
     * Log CORS configuration for debugging
     */
    logConfiguration() {
        logger.info('CORS Configuration:');
        logger.info(`Environment: ${this.environment}`);
        logger.info(`Allowed Origins: ${JSON.stringify(config.server.corsOrigins)}`);
        logger.info(`Credentials Enabled: true`);
    }
}

const corsConfig = new CorsConfig();
module.exports = corsConfig;