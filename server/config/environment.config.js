require('dotenv').config();
const { logger } = require('../utils/logger');
const { serverUrl, allowedOrigin, capacitorUrl, androidUrl } = require('./url.config');


class EnvironmentConfig {
    constructor() {
        this.environment = process.env.NODE_ENV || 'development';
        this.validateRequiredEnvVars();
    }

    validateRequiredEnvVars() {
        const required = [
            'ENCRYPTION_SECRET',
            'DEV_DB',
            'DEV_USER',
            'DEV_PASSWORD',
            'DEV_HOST'
        ];

        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            logger.error('Missing required environment variables:', missing);
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    get database() {
        const configs = {
            development: {
                database: process.env.DEV_DB,
                username: process.env.DEV_USER,
                password: process.env.DEV_PASSWORD,
                host: process.env.DEV_HOST,
                port: process.env.DEV_PORT || 3306,
                dialect: process.env.DEV_DIALECT || 'mysql'
            },
            test: {
                database: process.env.TEST_DB,
                username: process.env.TEST_USER,
                password: process.env.TEST_PASSWORD,
                host: process.env.TEST_HOST,
                port: process.env.TEST_PORT || 3306,
                dialect: process.env.TEST_DIALECT || 'mysql'
            },
            production: {
                database: process.env.PROD_DB,
                username: process.env.PROD_USER,
                password: process.env.PROD_PASSWORD,
                host: process.env.PROD_HOST,
                port: process.env.PROD_PORT || 3306,
                dialect: process.env.PROD_DIALECT || 'mysql'
            }
        };

        return configs[this.environment];
    }

    get server() {
        return {
            port: process.env.PORT || 3240,
            environment: this.environment,
            corsOrigins: this.getCorsOrigins()
        };
    }

    get jwt() {
        return {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        };
    }

    get mail() {
        return {
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT || 587,
            user: process.env.MAIL_USER,
            password: process.env.MAIL_PASSWORD,
            secure: process.env.MAIL_SECURE === 'true'
        };
    }

    // Redis configuration removed - using memory-based rate limiting
    get rateLimiting() {
        return {
            enabled: true,
            type: 'memory', // memory-based instead of Redis
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxRequests: 100
        };
    }

    get payment() {
        return {
            monnify: {
                apiKey: process.env.API_KEY,
                secretKey: process.env.MONNIFY_SECRET_KEY,
                contractCode: process.env.CONTRACT_CODE,
                baseUrl: this.environment === 'production'
                    ? process.env.MONNIFY_LIVE_URL
                    : process.env.MONNIFY_SANBOX_URL
            }
        };
    }

    getCorsOrigins() {
        const origins = {
            development: [
                allowedOrigin || 'http://localhost:3001',
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:3002',
                capacitorUrl,
                androidUrl
            ].filter(Boolean),
            test: [
                allowedOrigin,
                capacitorUrl,
                androidUrl
            ].filter(Boolean),
            production: [
                `https://${allowedOrigin}`, // secured a name dns
                `https://www.${allowedOrigin}`, // secured cname dns
            ].filter(Boolean)
        };

        return origins[this.environment] || origins.development;
    }

    get encryption() {
        return {
            key: process.env.ENCRYPTION_KEY
        };
    }

    get logging() {
        return {
            level: process.env.LOG_LEVEL || 'info',
            enableConsole: this.environment === 'development'
        };
    }
}

const config = new EnvironmentConfig();
module.exports = config;