const Redis = require('ioredis');
const { logger } = require('../utils/logger')

class RedisManager {
    constructor() {
        require('dotenv').config();
        this.environment = process.env.NODE_ENV || 'development';
        this.client = null;
        this.isConnected = false;
        this.fallbackMode = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectTimer = null;
    }

    /**
     * Get environment-specific Redis configuration
     * @returns {Object} Redis connection configuration
     */
    getConnectionConfig() {
        const baseConfig = {
            retryStrategy: this.getRetryStrategy(),
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            enableOfflineQueue: true,
            lazyConnect: false,
            connectTimeout: 10000,
            keepAlive: 30000,
            family: 4,
            showFriendlyErrorStack: this.environment === 'development'
        };

        // Environment-specific configuration
        if (this.environment === 'production') {
            return {
                ...baseConfig,
                host: process.env.PROD_REDIS_HOST || process.env.REDIS_URL,
                port: parseInt(process.env.PROD_REDIS_PORT) || 6379,
                password: process.env.REDIS_PASSWORD || process.env.PROD_REDIS_PASSWORD,
                username: process.env.REDIS_USERNAME || 'default',
                db: parseInt(process.env.PROD_REDIS_DB) || 0,
                tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
                connectionName: 'ticketi-prod'
            };
        } else if (this.environment === 'test') {
            return {
                ...baseConfig,
                host: process.env.TEST_REDIS_HOST || 'localhost',
                port: parseInt(process.env.TEST_REDIS_PORT) || 6379,
                password: process.env.TEST_REDIS_PASSWORD,
                db: parseInt(process.env.TEST_REDIS_DB) || 1,
                connectionName: 'ticketi-test'
            };
        } else {
            // Development
            return {
                ...baseConfig,
                host: process.env.DEV_REDIS_HOST || 'localhost',
                port: parseInt(process.env.DEV_REDIS_PORT) || 6379,
                password: process.env.DEV_REDIS_PASSWORD || process.env.REDIS_PASSWORD,
                username: process.env.REDIS_USERNAME || 'default',
                db: parseInt(process.env.DEV_REDIS_DB) || 0,
                connectionName: 'ticketi-dev'
            };
        }
    }

    /**
     * Get connection pool configuration
     * @returns {Object} Pool configuration
     */
    getPoolConfig() {
        return {
            min: 5,
            max: this.environment === 'production' ? 50 : 20,
            idleTimeoutMillis: 300000, // 5 minutes
            acquireTimeoutMillis: 30000 // 30 seconds
        };
    }

    /**
     * Retry strategy with exponential backoff
     * @param {number} times - Number of retry attempts
     * @returns {number|null} Delay in milliseconds or null to stop retrying
     */
    getRetryStrategy() {
        return (times) => {
            if (times > this.maxReconnectAttempts) {
                logger.error('Redis: Max retry attempts reached, entering fallback mode');
                this.enableFallbackMode();
                return null;
            }
            
            const delay = Math.min(times * 100, 3000);
            logger.warn(`Redis: Retry attempt ${times}, waiting ${delay}ms`);
            return delay;
        };
    }

    /**
     * Initialize Redis connection
     * @returns {Promise<Redis>} Redis client instance
     */
    async initialize() {
        try {
            const config = this.getConnectionConfig();
            
            logger.info(`Initializing Redis connection for ${this.environment} environment`);
            logger.info(`Redis host: ${config.host}:${config.port}`);

            this.client = new Redis(config);

            // Set up event handlers
            this.setupEventHandlers();

            // Wait for connection to be ready
            await this.waitForConnection();

            this.isConnected = true;
            this.fallbackMode = false;
            this.reconnectAttempts = 0;

            logger.info('Redis connection established successfully');
            
            return this.client;
        } catch (error) {
            logger.error('Failed to initialize Redis connection:', error);
            this.enableFallbackMode();
            // Don't throw - allow application to continue without Redis
            return null;
        }
    }

    /**
     * Wait for Redis connection to be ready
     * @returns {Promise<void>}
     */
    waitForConnection() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Redis connection timeout'));
            }, 10000);

            if (this.client.status === 'ready') {
                clearTimeout(timeout);
                resolve();
            } else {
                this.client.once('ready', () => {
                    clearTimeout(timeout);
                    resolve();
                });

                this.client.once('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            }
        });
    }

    /**
     * Set up Redis event handlers
     */
    setupEventHandlers() {
        this.client.on('connect', () => {
            logger.info(`Redis: Connection established at ${new Date().toISOString()}`);
        });

        this.client.on('ready', () => {
            logger.info('Redis: Client ready to accept commands');
            this.isConnected = true;
            this.fallbackMode = false;
            this.reconnectAttempts = 0;
        });

        this.client.on('error', (error) => {
            logger.error('Redis: Connection error', error);
            this.isConnected = false;
        });

        this.client.on('close', () => {
            logger.warn(`Redis: Connection closed at ${new Date().toISOString()}`);
            this.isConnected = false;
        });

        this.client.on('reconnecting', (delay) => {
            this.reconnectAttempts++;
            logger.info(`Redis: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        });

        this.client.on('end', () => {
            logger.warn('Redis: Connection ended');
            this.isConnected = false;
        });
    }

    /**
     * Enable fallback mode when Redis is unavailable
     */
    enableFallbackMode() {
        this.fallbackMode = true;
        this.isConnected = false;
        logger.warn('Redis: Entering fallback mode - application will continue without caching');
        
        // Schedule reconnection attempts
        this.scheduleReconnect();
    }

    /**
     * Schedule automatic reconnection attempts
     */
    scheduleReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('Redis: Max reconnection attempts reached, manual intervention required');
            return;
        }

        this.reconnectTimer = setTimeout(async () => {
            logger.info('Redis: Attempting scheduled reconnection');
            try {
                await this.initialize();
                logger.info('Redis: Reconnection successful, exiting fallback mode');
            } catch (error) {
                logger.error('Redis: Reconnection failed', error);
                this.scheduleReconnect();
            }
        }, 60000); // Retry every 60 seconds
    }

    /**
     * Validate Redis connection health
     * @returns {Promise<boolean>} Connection health status
     */
    async validateConnection() {
        if (!this.client || this.fallbackMode) {
            return false;
        }

        try {
            const result = await this.client.ping();
            const isHealthy = result === 'PONG';
            
            if (!isHealthy) {
                logger.warn('Redis: Health check failed - unexpected ping response');
            }
            
            return isHealthy;
        } catch (error) {
            logger.error('Redis: Health check failed', error);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Get detailed health status
     * @returns {Promise<Object>} Health status information
     */
    async getHealthStatus() {
        const status = {
            connected: this.isConnected,
            fallbackMode: this.fallbackMode,
            environment: this.environment,
            reconnectAttempts: this.reconnectAttempts,
            timestamp: new Date().toISOString()
        };

        if (!this.client || this.fallbackMode) {
            return {
                ...status,
                status: 'unavailable',
                message: 'Redis is in fallback mode'
            };
        }

        try {
            const pingResult = await this.client.ping();
            const info = await this.client.info('server');
            
            // Parse Redis version from info
            const versionMatch = info.match(/redis_version:([^\r\n]+)/);
            const uptimeMatch = info.match(/uptime_in_seconds:([^\r\n]+)/);

            return {
                ...status,
                status: 'healthy',
                ping: pingResult,
                version: versionMatch ? versionMatch[1] : 'unknown',
                uptime: uptimeMatch ? parseInt(uptimeMatch[1]) : 0,
                message: 'Redis is operational'
            };
        } catch (error) {
            logger.error('Redis: Failed to get health status', error);
            return {
                ...status,
                status: 'unhealthy',
                error: error.message,
                message: 'Redis health check failed'
            };
        }
    }

    /**
     * Start periodic health checks
     * @param {number} interval - Check interval in milliseconds (default: 30000)
     */
    startHealthCheck(interval = 30000) {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }

        this.healthCheckTimer = setInterval(async () => {
            const isHealthy = await this.validateConnection();
            
            if (!isHealthy && this.isConnected) {
                logger.warn('Redis: Health check detected connection issue');
                this.isConnected = false;
                this.enableFallbackMode();
            }
        }, interval);

        logger.info(`Redis: Health check started (interval: ${interval}ms)`);
    }

    /**
     * Stop health checks
     */
    stopHealthCheck() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
            logger.info('Redis: Health check stopped');
        }
    }

    /**
     * Get Redis client instance
     * @returns {Redis|null} Redis client or null if unavailable
     */
    getClient() {
        if (this.fallbackMode || !this.isConnected) {
            return null;
        }
        return this.client;
    }

    /**
     * Check if Redis is connected
     * @returns {boolean} Connection status
     */
    isRedisConnected() {
        return this.isConnected && !this.fallbackMode;
    }

    /**
     * Gracefully disconnect from Redis
     * @returns {Promise<void>}
     */
    async disconnect() {
        // Clear timers
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        this.stopHealthCheck();

        if (!this.client) {
            logger.info('Redis: No active connection to disconnect');
            return;
        }

        try {
            await this.client.quit();
            logger.info('Redis: Connection closed gracefully');
        } catch (error) {
            logger.error('Redis: Error during graceful disconnect', error);
            // Force disconnect if graceful quit fails
            try {
                this.client.disconnect();
            } catch (disconnectError) {
                logger.error('Redis: Error during force disconnect', disconnectError);
            }
        } finally {
            this.client = null;
            this.isConnected = false;
        }
    }

    /**
     * Get connection configuration (for debugging)
     * @returns {Object} Sanitized configuration
     */
    getConfigInfo() {
        const config = this.getConnectionConfig();
        return {
            host: config.host,
            port: config.port,
            db: config.db,
            environment: this.environment,
            connectionName: config.connectionName,
            tls: !!config.tls
        };
    }
}

// Singleton export
const redisManager = new RedisManager();

module.exports = { redisManager, RedisManager };
