// require('dotenv').config();
// const redis = require('redis');
// const { logger } = require('../utils/logger');

// let re = { env: process.env.NODE_ENV, host: process.env.DEV_REDIS_HOST }

// console.log(re)
// class RedisConfig {
//     constructor() {
//         this.client = null;
//         this.isConnected = false;
//         this.retryAttempts = 0;
//         this.maxRetries = 5;
//     }

//     async connect() {
//         try {
//             // Check if we have a Redis URL (for cloud services like Redis Cloud)
//             const redisUrl = process.env.REDIS_URL;

//             let redisOptions = {
//                 username: process.env.REDIS_USERNAME,
//                 password: process.env.REDIS_PASSWORD,
//                 socket: {
//                     host: redisUrl,
//                     port: 17630
//                 }
//             }

//             // if (redisUrl) {
//             //   // Use Redis URL for cloud services
//             //   logger.info('Connecting to Redis using URL:', redisUrl.replace(/:[^:@]*@/, ':****@'));
//             //   redisOptions = {
//             //     url: redisUrl,
//             //     retryDelayOnFailover: 100,
//             //     enableReadyCheck: true,
//             //     maxRetriesPerRequest: 3,
//             //     lazyConnect: true,
//             //     keepAlive: 30000,
//             //     connectTimeout: 10000,
//             //     commandTimeout: 5000
//             //   };
//             // } else {
//             //   // Use individual host/port/password for local or custom setup
//             //   const host = process.env.NODE_ENV === 'production' 
//             //     ? process.env.PROD_REDIS_HOST 
//             //     : (process.env.DEV_REDIS_HOST || process.env.REDIS_HOST || 'localhost');

//             //   const port = process.env.NODE_ENV === 'production' 
//             //     ? process.env.PROD_REDIS_PORT 
//             //     : (process.env.DEV_REDIS_PORT || process.env.REDIS_PORT || 6379);

//             //   const password = process.env.NODE_ENV === 'production' 
//             //     ? process.env.PROD_REDIS_PASSWORD 
//             //     : (process.env.DEV_REDIS_PASSWORD || process.env.REDIS_PASSWORD);

//             //   const database = process.env.NODE_ENV === 'production' 
//             //     ? process.env.PROD_REDIS_DB 
//             //     : (process.env.DEV_REDIS_DB || process.env.REDIS_DB || 0);

//             //   logger.info('Connecting to Redis:', { host, port: parseInt(port), database: parseInt(database) });

//             //   redisOptions = {
//             //     socket: {
//             //       host: host,
//             //       port: parseInt(port),
//             //       connectTimeout: 10000,
//             //       commandTimeout: 5000,
//             //       keepAlive: 30000
//             //     },
//             //     // password: password,
//             //     // database: parseInt(database),
//             //     retryDelayOnFailover: 100,
//             //     enableReadyCheck: true,
//             //     maxRetriesPerRequest: 3,
//             //     lazyConnect: true
//             //   };
//             // }

//             // Create Redis client
//             this.client = redis.createClient(redisOptions);

//             // Event handlers
//             this.client.on('connect', () => {
//                 logger.info('Redis client connected');
//                 this.isConnected = true;
//                 this.retryAttempts = 0;
//             });

//             this.client.on('ready', () => {
//                 logger.info('Redis client ready');
//             });

//             this.client.on('error', (err) => {
//                 logger.error('Redis client error:', err);
//                 this.isConnected = false;
//                 this.handleConnectionError(err);
//             });

//             this.client.on('end', () => {
//                 logger.warn('Redis client connection ended');
//                 this.isConnected = false;
//             });

//             this.client.on('reconnecting', () => {
//                 logger.info('Redis client reconnecting...');
//             });

//             // Connect to Redis
//             await this.client.connect();

//             // Test connection
//             await this.client.ping();
//             logger.info('Redis connection established successfully');

//             return this.client;

//         } catch (error) {
//             logger.error('Failed to connect to Redis:', error);
//             this.handleConnectionError(error);
//             throw error;
//         }
//     }

//     handleConnectionError(error) {
//         this.retryAttempts++;

//         if (this.retryAttempts >= this.maxRetries) {
//             logger.warn(`Redis connection failed after ${this.maxRetries} attempts. Application will continue without cache.`);
//             this.isConnected = false;
//             return;
//         }

//         const retryDelay = Math.min(1000 * Math.pow(2, this.retryAttempts), 30000);
//         logger.info(`Retrying Redis connection in ${retryDelay / 1000} seconds...`);

//         setTimeout(() => {
//             this.connect().catch(() => {
//                 // Error already handled in connect method
//             });
//         }, retryDelay);
//     }

//     getClient() {
//         return this.client;
//     }

//     isReady() {
//         return this.isConnected && this.client && this.client.isReady;
//     }

//     async disconnect() {
//         if (this.client) {
//             try {
//                 await this.client.quit();
//                 logger.info('Redis client disconnected gracefully');
//             } catch (error) {
//                 logger.error('Error disconnecting Redis client:', error);
//                 await this.client.disconnect();
//             }
//         }
//     }

//     // Health check method
//     async healthCheck() {
//         try {
//             if (!this.isReady()) {
//                 return { status: 'disconnected', message: 'Redis client not ready' };
//             }

//             const start = Date.now();
//             await this.client.ping();
//             const responseTime = Date.now() - start;

//             return {
//                 status: 'connected',
//                 responseTime: `${responseTime}ms`,
//                 message: 'Redis is healthy'
//             };
//         } catch (error) {
//             return {
//                 status: 'error',
//                 message: error.message
//             };
//         }
//     }
// }

// const redisConfig = new RedisConfig();
// module.exports = redisConfig;