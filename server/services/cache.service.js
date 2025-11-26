require('dotenv').config();
const Redis = require('ioredis');
const { logger } = require('../utils/logger');

/**
 * Cache Service - Singleton class for Redis caching operations
 * Provides centralized caching with graceful fallback when Redis is unavailable
 */
class CacheService {
    constructor() {
        if (CacheService.instance) {
            return CacheService.instance;
        }

        this.client = null;
        this.fallbackMode = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectInterval = 60000; // 60 seconds
        this.reconnectTimer = null;
        this.isInitialized = false;

        // Metrics tracking
        this.metrics = {
            hits: 0,
            misses: 0,
            operations: 0,
            errors: 0,
            patternMetrics: {}, // Track metrics per key pattern
            operationTimes: [], // Track operation durations for average calculation
            startTime: Date.now()
        };

        CacheService.instance = this;
    }

    /**
     * Get environment-specific Redis configuration
     * @returns {Object} Redis configuration object
     */
    getRedisConfig() {
        const env = process.env.NODE_ENV || 'development';

        let config = {
            retryStrategy: (times) => {
                const delay = Math.min(times * 100, 3000);
                logger.info(`Redis retry attempt ${times}, waiting ${delay}ms`);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            enableOfflineQueue: true,
            lazyConnect: false,
            connectTimeout: 10000,
            keepAlive: 30000,
            family: 4
        };

        if (env === 'production') {
            // Production configuration
            config = {
                ...config,
                host: process.env.PROD_REDIS_HOST || process.env.REDIS_URL,
                port: parseInt(process.env.PROD_REDIS_PORT) || 6379,
                password: process.env.REDIS_PASSWORD || process.env.PROD_REDIS_PASSWORD,
                username: process.env.REDIS_USERNAME || 'default',
                db: parseInt(process.env.PROD_REDIS_DB) || 0,
                tls: process.env.REDIS_TLS === 'true' ? {} : undefined
            };
        } else if (env === 'test') {
            // Test configuration
            config = {
                ...config,
                host: process.env.TEST_REDIS_HOST || 'localhost',
                port: parseInt(process.env.TEST_REDIS_PORT) || 6379,
                password: process.env.TEST_REDIS_PASSWORD,
                db: parseInt(process.env.TEST_REDIS_DB) || 1
            };
        } else {
            // Development configuration
            config = {
                ...config,
                host: process.env.DEV_REDIS_HOST || 'localhost',
                port: parseInt(process.env.DEV_REDIS_PORT) || 6379,
                password: process.env.DEV_REDIS_PASSWORD,
                db: parseInt(process.env.DEV_REDIS_DB) || 0
            };
        }

        return config;
    }

    /**
     * Initialize Redis connection with event handlers
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            if (this.isInitialized && this.client && this.client.status === 'ready') {
                logger.info('Cache service already initialized and connected');
                return true;
            }

            const config = this.getRedisConfig();
            logger.info('Initializing Redis connection with config:', {
                host: config.host,
                port: config.port,
                db: config.db,
                environment: process.env.NODE_ENV || 'development'
            });

            this.client = new Redis(config);

            // Set up event handlers
            this.setupEventHandlers();

            // Wait for connection to be ready
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Redis connection timeout'));
                }, config.connectTimeout);

                this.client.once('ready', () => {
                    clearTimeout(timeout);
                    resolve();
                });

                this.client.once('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });

            this.isInitialized = true;
            this.fallbackMode = false;
            this.reconnectAttempts = 0;

            logger.info('✅ Cache service initialized successfully');
            return true;

        } catch (error) {
            logger.error('Failed to initialize Redis connection:', error);
            this.enableFallbackMode();
            return false;
        }
    }

    /**
     * Set up Redis connection event handlers
     */
    setupEventHandlers() {
        if (!this.client) return;

        // Connection established
        this.client.on('connect', () => {
            logger.info('📡 Redis connection established', {
                timestamp: new Date().toISOString(),
                event: 'connect',
                host: this.client.options.host,
                port: this.client.options.port
            });
        });

        // Connection ready for commands
        this.client.on('ready', () => {
            logger.info('✅ Redis connection ready', {
                timestamp: new Date().toISOString(),
                event: 'ready',
                fallbackMode: this.fallbackMode
            });
            if (this.fallbackMode) {
                this.exitFallbackMode();
            }
        });

        // Connection error
        this.client.on('error', (error) => {
            this.metrics.errors++;
            logger.error('❌ Redis connection error', {
                timestamp: new Date().toISOString(),
                event: 'error',
                message: error.message,
                code: error.code,
                stack: error.stack
            });

            // Don't enable fallback mode for every error, only for connection failures
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                this.enableFallbackMode();
            }
        });

        // Reconnecting
        this.client.on('reconnecting', (delay) => {
            logger.info('🔄 Redis reconnecting', {
                timestamp: new Date().toISOString(),
                event: 'reconnecting',
                delayMs: delay,
                attempt: this.reconnectAttempts
            });
        });

        // Connection closed
        this.client.on('close', () => {
            logger.warn('🔌 Redis connection closed', {
                timestamp: new Date().toISOString(),
                event: 'close'
            });
            if (!this.fallbackMode) {
                this.enableFallbackMode();
            }
        });

        // Connection ended
        this.client.on('end', () => {
            logger.warn('🛑 Redis connection ended', {
                timestamp: new Date().toISOString(),
                event: 'end'
            });
            this.enableFallbackMode();
        });
    }

    /**
     * Enable fallback mode when Redis is unavailable
     */
    enableFallbackMode() {
        if (this.fallbackMode) return;

        this.fallbackMode = true;
        logger.warn('⚠️  Cache service entering fallback mode - operations will continue without caching');

        // Schedule reconnection attempts
        this.scheduleReconnect();
    }

    /**
     * Exit fallback mode when Redis connection is restored
     */
    exitFallbackMode() {
        if (!this.fallbackMode) return;

        this.fallbackMode = false;
        this.reconnectAttempts = 0;

        // Clear reconnection timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        logger.info('✅ Cache service exited fallback mode - caching restored');
    }

    /**
     * Schedule automatic reconnection attempts with exponential backoff
     */
    scheduleReconnect() {
        // Clear existing timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        // Check if max attempts reached
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached. Manual intervention required.`);
            return;
        }

        // Calculate delay with exponential backoff
        // Start at 100ms, double each time, cap at 60 seconds
        const baseDelay = 100; // 100ms starting delay
        const maxDelay = 60000; // 60 seconds max delay
        const exponentialDelay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts), maxDelay);
        
        logger.info(`⏱️  Scheduling reconnection attempt in ${exponentialDelay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

        this.reconnectTimer = setTimeout(async () => {
            this.reconnectAttempts++;
            logger.info(`🔄 Attempting to reconnect to Redis (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            try {
                // Try to reinitialize
                const success = await this.initialize();
                
                if (success) {
                    logger.info('✅ Successfully reconnected to Redis - exiting fallback mode');
                    // exitFallbackMode is called in the 'ready' event handler
                } else {
                    // Schedule next attempt if initialization failed
                    logger.warn('Reconnection attempt failed - scheduling next attempt');
                    this.scheduleReconnect();
                }
            } catch (error) {
                logger.error('Reconnection attempt failed with error:', {
                    message: error.message,
                    attempt: this.reconnectAttempts,
                    maxAttempts: this.maxReconnectAttempts
                });
                // Schedule next attempt
                this.scheduleReconnect();
            }
        }, exponentialDelay);
    }

    /**
     * Check if cache service is connected and ready
     * @returns {boolean} Connection status
     */
    isConnected() {
        return this.client && this.client.status === 'ready' && !this.fallbackMode;
    }

    /**
     * Get connection health status
     * @returns {Object} Health status information
     */
    getHealthStatus() {
        return {
            connected: this.isConnected(),
            fallbackMode: this.fallbackMode,
            reconnectAttempts: this.reconnectAttempts,
            status: this.client ? this.client.status : 'not_initialized',
            metrics: this.metrics
        };
    }

    /**
     * Disconnect from Redis gracefully
     * @returns {Promise<void>}
     */
    async disconnect() {
        try {
            // Clear reconnection timer
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }

            if (this.client) {
                await this.client.quit();
                this.client = null;
                this.isInitialized = false;
                logger.info('Cache service disconnected successfully');
            }
        } catch (error) {
            logger.error('Error disconnecting cache service:', error);
            // Force disconnect if graceful quit fails
            if (this.client) {
                this.client.disconnect();
                this.client = null;
            }
        }
    }

    /**
     * Get cache metrics
     * @returns {Object} Cache metrics
     */
    getMetrics() {
        const total = this.metrics.hits + this.metrics.misses;
        const hitRate = total > 0 ? (this.metrics.hits / total * 100).toFixed(2) : 0;
        const missRate = total > 0 ? (this.metrics.misses / total * 100).toFixed(2) : 0;
        
        // Calculate average response time
        const avgResponseTime = this.metrics.operationTimes.length > 0
            ? (this.metrics.operationTimes.reduce((sum, time) => sum + time, 0) / this.metrics.operationTimes.length).toFixed(2)
            : 0;
        
        // Calculate operations per minute
        const uptimeMinutes = (Date.now() - this.metrics.startTime) / 60000;
        const operationsPerMinute = uptimeMinutes > 0 
            ? (this.metrics.operations / uptimeMinutes).toFixed(2)
            : 0;
        
        // Calculate per-pattern metrics
        const patternMetrics = {};
        for (const [pattern, metrics] of Object.entries(this.metrics.patternMetrics)) {
            const patternTotal = metrics.hits + metrics.misses;
            const patternHitRate = patternTotal > 0 
                ? (metrics.hits / patternTotal * 100).toFixed(2)
                : 0;
            const patternAvgTime = metrics.operations > 0
                ? (metrics.totalDuration / metrics.operations).toFixed(2)
                : 0;
            
            patternMetrics[pattern] = {
                hits: metrics.hits,
                misses: metrics.misses,
                operations: metrics.operations,
                hitRate: `${patternHitRate}%`,
                avgResponseTimeMs: parseFloat(patternAvgTime)
            };
        }

        return {
            overall: {
                hits: this.metrics.hits,
                misses: this.metrics.misses,
                operations: this.metrics.operations,
                errors: this.metrics.errors,
                hitRate: `${hitRate}%`,
                missRate: `${missRate}%`,
                totalRequests: total,
                avgResponseTimeMs: parseFloat(avgResponseTime),
                operationsPerMinute: parseFloat(operationsPerMinute),
                uptimeMinutes: parseFloat(uptimeMinutes.toFixed(2))
            },
            byPattern: patternMetrics
        };
    }

    /**
     * Get Redis server info including memory usage
     * @returns {Promise<Object>} Redis server information
     */
    async getRedisInfo() {
        try {
            if (this.fallbackMode || !this.isConnected()) {
                return {
                    available: false,
                    fallbackMode: true
                };
            }

            // Get Redis INFO command output
            const info = await this.client.info('memory');
            const stats = await this.client.info('stats');
            
            // Parse memory info
            const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
            const peakMemoryMatch = info.match(/used_memory_peak_human:([^\r\n]+)/);
            const fragmentationMatch = info.match(/mem_fragmentation_ratio:([^\r\n]+)/);
            
            // Parse stats
            const totalConnectionsMatch = stats.match(/total_connections_received:([^\r\n]+)/);
            const totalCommandsMatch = stats.match(/total_commands_processed:([^\r\n]+)/);
            
            return {
                available: true,
                memory: {
                    used: memoryMatch ? memoryMatch[1].trim() : 'N/A',
                    peak: peakMemoryMatch ? peakMemoryMatch[1].trim() : 'N/A',
                    fragmentationRatio: fragmentationMatch ? parseFloat(fragmentationMatch[1]) : 0
                },
                stats: {
                    totalConnections: totalConnectionsMatch ? parseInt(totalConnectionsMatch[1]) : 0,
                    totalCommands: totalCommandsMatch ? parseInt(totalCommandsMatch[1]) : 0
                },
                connectionPool: {
                    status: this.client.status,
                    host: this.client.options.host,
                    port: this.client.options.port,
                    db: this.client.options.db
                }
            };
        } catch (error) {
            logger.error('Failed to get Redis info', {
                error: error.message
            });
            return {
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Reset cache metrics
     */
    resetMetrics() {
        this.metrics = {
            hits: 0,
            misses: 0,
            operations: 0,
            errors: 0,
            patternMetrics: {},
            operationTimes: [],
            startTime: Date.now()
        };
        logger.info('Cache metrics reset');
    }

    /**
     * Extract key pattern from cache key for metrics tracking
     * @param {string} key - Cache key
     * @returns {string} Key pattern (e.g., 'event:*', 'user:profile:*')
     */
    getKeyPattern(key) {
        // Extract pattern by replacing IDs with wildcards
        // Examples: 'event:123' -> 'event:*', 'user:profile:456' -> 'user:profile:*'
        const parts = key.split(':');
        if (parts.length === 1) return key;
        
        // Replace numeric or UUID-like parts with *
        return parts.map((part, index) => {
            // Keep first part (entity type), replace IDs
            if (index === 0) return part;
            // Check if part looks like an ID (numeric, UUID, or contains numbers)
            if (/^\d+$/.test(part) || /^[a-f0-9-]{36}$/i.test(part) || /\d/.test(part)) {
                return '*';
            }
            return part;
        }).join(':');
    }

    /**
     * Track operation metrics by pattern
     * @param {string} key - Cache key
     * @param {string} operation - Operation type (hit, miss)
     * @param {number} duration - Operation duration in ms
     */
    trackPatternMetrics(key, operation, duration) {
        const pattern = this.getKeyPattern(key);
        
        if (!this.metrics.patternMetrics[pattern]) {
            this.metrics.patternMetrics[pattern] = {
                hits: 0,
                misses: 0,
                operations: 0,
                totalDuration: 0
            };
        }
        
        const patternMetrics = this.metrics.patternMetrics[pattern];
        patternMetrics.operations++;
        patternMetrics.totalDuration += duration;
        
        if (operation === 'hit') {
            patternMetrics.hits++;
        } else if (operation === 'miss') {
            patternMetrics.misses++;
        }
        
        // Track operation time for overall average (keep last 1000 operations)
        this.metrics.operationTimes.push(duration);
        if (this.metrics.operationTimes.length > 1000) {
            this.metrics.operationTimes.shift();
        }
    }

    /**
     * Get environment-based key prefix
     * @returns {string} Key prefix based on environment
     */
    getKeyPrefix() {
        const env = process.env.NODE_ENV || 'development';
        
        switch (env) {
            case 'production':
                return 'prod_';
            case 'test':
                return 'test_';
            case 'development':
            default:
                return 'dev_';
        }
    }

    /**
     * Get prefixed key with environment namespace
     * @param {string} key - Original key
     * @returns {string} Prefixed key
     */
    getPrefixedKey(key) {
        const prefix = this.getKeyPrefix();
        return `${prefix}${key}`;
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {Promise<any|null>} Cached value or null
     */
    async get(key) {
        const startTime = Date.now();
        
        try {
            // Return null in fallback mode
            if (this.fallbackMode || !this.isConnected()) {
                this.metrics.misses++;
                return null;
            }

            this.metrics.operations++;
            const prefixedKey = this.getPrefixedKey(key);
            const value = await this.client.get(prefixedKey);
            const duration = Date.now() - startTime;

            if (value === null) {
                this.metrics.misses++;
                this.trackPatternMetrics(key, 'miss', duration);
                
                logger.debug('Cache miss', {
                    operation: 'get',
                    key,
                    durationMs: duration
                });
                
                // Log slow operations
                if (duration > 100) {
                    logger.warn('Slow cache operation detected', {
                        operation: 'get',
                        key,
                        durationMs: duration,
                        threshold: 100
                    });
                }
                
                return null;
            }

            // Deserialize JSON
            try {
                const deserialized = JSON.parse(value);
                this.metrics.hits++;
                this.trackPatternMetrics(key, 'hit', duration);
                
                logger.debug('Cache hit', {
                    operation: 'get',
                    key,
                    durationMs: duration
                });
                
                // Log slow operations
                if (duration > 100) {
                    logger.warn('Slow cache operation detected', {
                        operation: 'get',
                        key,
                        durationMs: duration,
                        threshold: 100
                    });
                }
                
                return deserialized;
            } catch (parseError) {
                logger.error('Failed to parse cached value', {
                    operation: 'get',
                    key,
                    error: parseError.message,
                    durationMs: duration
                });
                // Delete corrupted data
                await this.del(key);
                this.metrics.misses++;
                return null;
            }

        } catch (error) {
            const duration = Date.now() - startTime;
            this.metrics.errors++;
            logger.error('Cache get operation failed', {
                operation: 'get',
                key,
                message: error.message,
                code: error.code,
                durationMs: duration
            });
            return null;
        }
    }

    /**
     * Set value in cache with TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache (will be JSON serialized)
     * @param {number} ttl - Time to live in seconds (default: 3600)
     * @returns {Promise<boolean>} Success status
     */
    async set(key, value, ttl = 3600) {
        const startTime = Date.now();
        
        try {
            // No-op in fallback mode
            if (this.fallbackMode || !this.isConnected()) {
                return false;
            }

            this.metrics.operations++;
            const prefixedKey = this.getPrefixedKey(key);

            // Serialize value to JSON
            let serialized;
            try {
                serialized = JSON.stringify(value);
            } catch (serializeError) {
                logger.error('Failed to serialize value', {
                    operation: 'set',
                    key,
                    error: serializeError.message
                });
                this.metrics.errors++;
                return false;
            }

            // Set with TTL
            await this.client.setex(prefixedKey, ttl, serialized);
            const duration = Date.now() - startTime;
            
            logger.debug('Cache set', {
                operation: 'set',
                key,
                ttl,
                durationMs: duration
            });
            
            // Log slow operations
            if (duration > 100) {
                logger.warn('Slow cache operation detected', {
                    operation: 'set',
                    key,
                    ttl,
                    durationMs: duration,
                    threshold: 100
                });
            }
            
            return true;

        } catch (error) {
            const duration = Date.now() - startTime;
            this.metrics.errors++;
            logger.error('Cache set operation failed', {
                operation: 'set',
                key,
                message: error.message,
                code: error.code,
                durationMs: duration
            });
            return false;
        }
    }

    /**
     * Delete value from cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} Success status
     */
    async del(key) {
        const startTime = Date.now();
        
        try {
            // No-op in fallback mode
            if (this.fallbackMode || !this.isConnected()) {
                return false;
            }

            this.metrics.operations++;
            const prefixedKey = this.getPrefixedKey(key);
            const result = await this.client.del(prefixedKey);
            const duration = Date.now() - startTime;
            
            logger.debug('Cache delete', {
                operation: 'delete',
                key,
                deleted: result > 0,
                durationMs: duration
            });
            
            // Log slow operations
            if (duration > 100) {
                logger.warn('Slow cache operation detected', {
                    operation: 'delete',
                    key,
                    durationMs: duration,
                    threshold: 100
                });
            }
            
            return result > 0;

        } catch (error) {
            const duration = Date.now() - startTime;
            this.metrics.errors++;
            logger.error('Cache delete operation failed', {
                operation: 'delete',
                key,
                message: error.message,
                code: error.code,
                durationMs: duration
            });
            return false;
        }
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} True if key exists
     */
    async exists(key) {
        try {
            // Return false in fallback mode
            if (this.fallbackMode || !this.isConnected()) {
                return false;
            }

            this.metrics.operations++;
            const prefixedKey = this.getPrefixedKey(key);
            const result = await this.client.exists(prefixedKey);
            
            logger.debug(`Cache exists check: ${key} (exists: ${result === 1})`);
            return result === 1;

        } catch (error) {
            this.metrics.errors++;
            logger.error(`Cache exists operation failed for key ${key}:`, {
                message: error.message,
                code: error.code
            });
            return false;
        }
    }

    /**
     * Get multiple values from cache using pipelining
     * @param {string[]} keys - Array of cache keys
     * @returns {Promise<Object>} Object with keys and their values (null for missing keys)
     */
    async mget(keys) {
        try {
            // Return empty object in fallback mode
            if (this.fallbackMode || !this.isConnected()) {
                this.metrics.misses += keys.length;
                return keys.reduce((acc, key) => {
                    acc[key] = null;
                    return acc;
                }, {});
            }

            if (!Array.isArray(keys) || keys.length === 0) {
                return {};
            }

            this.metrics.operations += keys.length;

            // Use pipeline for better performance
            const pipeline = this.client.pipeline();
            const prefixedKeys = keys.map(key => this.getPrefixedKey(key));
            
            prefixedKeys.forEach(prefixedKey => {
                pipeline.get(prefixedKey);
            });

            const results = await pipeline.exec();
            const output = {};

            keys.forEach((key, index) => {
                const [error, value] = results[index];
                
                if (error) {
                    logger.error(`Cache mget operation failed for key ${key}:`, error);
                    this.metrics.errors++;
                    this.metrics.misses++;
                    output[key] = null;
                    return;
                }

                if (value === null) {
                    this.metrics.misses++;
                    output[key] = null;
                    return;
                }

                // Deserialize JSON
                try {
                    output[key] = JSON.parse(value);
                    this.metrics.hits++;
                } catch (parseError) {
                    logger.error(`Failed to parse cached value for key ${key}:`, parseError);
                    this.metrics.misses++;
                    output[key] = null;
                    // Delete corrupted data
                    this.del(key).catch(err => logger.error('Failed to delete corrupted key:', err));
                }
            });

            logger.debug(`Cache mget: ${keys.length} keys (hits: ${Object.values(output).filter(v => v !== null).length})`);
            return output;

        } catch (error) {
            this.metrics.errors += keys.length;
            logger.error('Cache mget operation failed:', {
                message: error.message,
                code: error.code
            });
            // Return null for all keys on error
            return keys.reduce((acc, key) => {
                acc[key] = null;
                return acc;
            }, {});
        }
    }

    /**
     * Set multiple values in cache using pipelining
     * @param {Object} keyValuePairs - Object with key-value pairs to cache
     * @param {number} ttl - Time to live in seconds (default: 3600)
     * @returns {Promise<boolean>} Success status
     */
    async mset(keyValuePairs, ttl = 3600) {
        try {
            // No-op in fallback mode
            if (this.fallbackMode || !this.isConnected()) {
                return false;
            }

            if (!keyValuePairs || typeof keyValuePairs !== 'object' || Object.keys(keyValuePairs).length === 0) {
                return false;
            }

            const keys = Object.keys(keyValuePairs);
            this.metrics.operations += keys.length;

            // Use pipeline for better performance
            const pipeline = this.client.pipeline();

            for (const [key, value] of Object.entries(keyValuePairs)) {
                const prefixedKey = this.getPrefixedKey(key);
                
                // Serialize value to JSON
                try {
                    const serialized = JSON.stringify(value);
                    pipeline.setex(prefixedKey, ttl, serialized);
                } catch (serializeError) {
                    logger.error(`Failed to serialize value for key ${key}:`, serializeError);
                    this.metrics.errors++;
                }
            }

            await pipeline.exec();
            logger.debug(`Cache mset: ${keys.length} keys (TTL: ${ttl}s)`);
            return true;

        } catch (error) {
            this.metrics.errors += Object.keys(keyValuePairs).length;
            logger.error('Cache mset operation failed:', {
                message: error.message,
                code: error.code
            });
            return false;
        }
    }

    /**
     * Delete multiple values from cache using pipelining
     * @param {string[]} keys - Array of cache keys to delete
     * @returns {Promise<number>} Number of keys deleted
     */
    async mdel(keys) {
        try {
            // No-op in fallback mode
            if (this.fallbackMode || !this.isConnected()) {
                return 0;
            }

            if (!Array.isArray(keys) || keys.length === 0) {
                return 0;
            }

            this.metrics.operations += keys.length;

            // Use pipeline for better performance
            const pipeline = this.client.pipeline();
            const prefixedKeys = keys.map(key => this.getPrefixedKey(key));
            
            prefixedKeys.forEach(prefixedKey => {
                pipeline.del(prefixedKey);
            });

            const results = await pipeline.exec();
            let deletedCount = 0;

            results.forEach(([error, result], index) => {
                if (error) {
                    logger.error(`Cache mdel operation failed for key ${keys[index]}:`, error);
                    this.metrics.errors++;
                } else {
                    deletedCount += result;
                }
            });

            logger.debug(`Cache mdel: ${keys.length} keys (deleted: ${deletedCount})`);
            return deletedCount;

        } catch (error) {
            this.metrics.errors += keys.length;
            logger.error('Cache mdel operation failed:', {
                message: error.message,
                code: error.code
            });
            return 0;
        }
    }

    /**
     * Get keys matching a pattern
     * @param {string} pattern - Pattern to match (e.g., 'user:*', 'event:*')
     * @returns {Promise<string[]>} Array of matching keys (without prefix)
     */
    async keys(pattern) {
        try {
            // Return empty array in fallback mode
            if (this.fallbackMode || !this.isConnected()) {
                return [];
            }

            this.metrics.operations++;
            const prefixedPattern = this.getPrefixedKey(pattern);
            const keys = await this.client.keys(prefixedPattern);
            
            // Remove prefix from keys
            const prefix = this.getKeyPrefix();
            const unprefixedKeys = keys.map(key => key.substring(prefix.length));

            logger.debug(`Cache keys: pattern '${pattern}' matched ${unprefixedKeys.length} keys`);
            return unprefixedKeys;

        } catch (error) {
            this.metrics.errors++;
            logger.error(`Cache keys operation failed for pattern ${pattern}:`, {
                message: error.message,
                code: error.code
            });
            return [];
        }
    }

    /**
     * Delete all keys matching a pattern
     * @param {string} pattern - Pattern to match (e.g., 'user:*', 'event:*')
     * @returns {Promise<number>} Number of keys deleted
     */
    async deletePattern(pattern) {
        const startTime = Date.now();
        
        try {
            // No-op in fallback mode
            if (this.fallbackMode || !this.isConnected()) {
                return 0;
            }

            this.metrics.operations++;
            
            // Get all keys matching the pattern
            const matchingKeys = await this.keys(pattern);
            
            if (matchingKeys.length === 0) {
                logger.debug('Cache invalidation - no keys matched', {
                    operation: 'deletePattern',
                    pattern,
                    affectedKeys: 0
                });
                return 0;
            }

            // Delete all matching keys using mdel
            const deletedCount = await this.mdel(matchingKeys);
            const duration = Date.now() - startTime;
            
            logger.info('Cache invalidation completed', {
                operation: 'deletePattern',
                pattern,
                affectedKeys: deletedCount,
                matchedKeys: matchingKeys.length,
                durationMs: duration
            });
            
            // Log slow operations
            if (duration > 100) {
                logger.warn('Slow cache operation detected', {
                    operation: 'deletePattern',
                    pattern,
                    affectedKeys: deletedCount,
                    durationMs: duration,
                    threshold: 100
                });
            }
            
            return deletedCount;

        } catch (error) {
            const duration = Date.now() - startTime;
            this.metrics.errors++;
            logger.error('Cache deletePattern operation failed', {
                operation: 'deletePattern',
                pattern,
                message: error.message,
                code: error.code,
                durationMs: duration
            });
            return 0;
        }
    }

    /**
     * Get TTL (time to live) for a key
     * @param {string} key - Cache key
     * @returns {Promise<number>} TTL in seconds (-1 if no expiry, -2 if key doesn't exist)
     */
    async ttl(key) {
  
      try {
            // Return -2 in fallback mode (key doesn't exist)
            if (this.fallbackMode || !this.isConnected()) {
                return -2;
            }

            this.metrics.operations++;
            const prefixedKey = this.getPrefixedKey(key);
            const ttl = await this.client.ttl(prefixedKey);
            
            logger.debug(`Cache ttl: ${key} (TTL: ${ttl}s)`);
            return ttl;

        } catch (error) {
            this.metrics.errors++;
            logger.error(`Cache ttl operation failed for key ${key}:`, {
                message: error.message,
                code: error.code
            });
            return -2;
        }
    }

    /**
     * Set expiration time for a key
     * @param {string} key - Cache key
     * @param {number} seconds - Expiration time in seconds
     * @returns {Promise<boolean>} Success status (true if expiry was set)
     */
    async expire(key, seconds) {
        try {
            // No-op in fallback mode
            if (this.fallbackMode || !this.isConnected()) {
                return false;
            }

            this.metrics.operations++;
            const prefixedKey = this.getPrefixedKey(key);
            const result = await this.client.expire(prefixedKey, seconds);
            
            logger.debug(`Cache expire: ${key} (TTL: ${seconds}s, success: ${result === 1})`);
            return result === 1;

        } catch (error) {
            this.metrics.errors++;
            logger.error(`Cache expire operation failed for key ${key}:`, {
                message: error.message,
                code: error.code
            });
            return false;
        }
    }
}

// Export singleton instance
module.exports = new CacheService();
