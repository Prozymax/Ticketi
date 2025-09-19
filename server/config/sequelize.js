const { Sequelize } = require('sequelize');
const config = require('./database');
const logger = require('../utils/logger');
const ConnectionMonitor = require('../utils/connectionMonitor');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

class DatabaseConnection {
  constructor() {
    this.sequelize = null;
    this.connectionMonitor = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
  }

  async initialize() {
    try {
      // Create Sequelize instance
      this.sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        {
          ...dbConfig,
          define: {
            timestamps: true,
            underscored: true,
            paranoid: true, // Soft deletes
            freezeTableName: true
          },
          hooks: {
            beforeConnect: () => {
              logger.info('Attempting to connect to database...');
            },
            afterConnect: () => {
              logger.info('Successfully connected to database');
              this.isConnected = true;
              this.connectionAttempts = 0;
            },
            beforeDisconnect: () => {
              logger.info('Disconnecting from database...');
              this.isConnected = false;
            }
          }
        }
      );

      // Test the connection
      await this.testConnection();

      // Initialize connection monitoring
      this.connectionMonitor = new ConnectionMonitor(this.sequelize);
      this.connectionMonitor.start();

      // Set up graceful shutdown
      this.setupGracefulShutdown();

      return this.sequelize;
    } catch (error) {
      logger.error('Failed to initialize database connection:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.sequelize.authenticate();
      logger.info(`Database connection established successfully (${env} environment)`);
      return true;
    } catch (error) {
      this.connectionAttempts++;
      logger.error(`Database connection failed (attempt ${this.connectionAttempts}/${this.maxRetries}):`, error.message);
      
      if (this.connectionAttempts < this.maxRetries) {
        logger.info(`Retrying connection in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.testConnection();
      }
      
      throw new Error(`Failed to connect to database after ${this.maxRetries} attempts`);
    }
  }

  async syncDatabase(options = {}) {
    try {
      const defaultOptions = {
        force: env === 'test', // Only force sync in test environment
        alter: env === 'development', // Auto-alter tables in development
        logging: env !== 'production'
      };

      const syncOptions = { ...defaultOptions, ...options };
      
      logger.info('Synchronizing database models...');
      await this.sequelize.sync(syncOptions);
      logger.info('Database models synchronized successfully');
    } catch (error) {
      logger.error('Database synchronization failed:', error);
      throw error;
    }
  }

  async closeConnection() {
    try {
      if (this.connectionMonitor) {
        this.connectionMonitor.stop();
      }
      
      if (this.sequelize) {
        await this.sequelize.close();
        logger.info('Database connection closed successfully');
      }
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      try {
        await this.closeConnection();
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon
  }

  getSequelize() {
    if (!this.sequelize) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.sequelize;
  }

  isHealthy() {
    return this.isConnected && this.sequelize !== null;
  }

  async getConnectionStats() {
    if (!this.sequelize) return null;

    try {
      const pool = this.sequelize.connectionManager.pool;
      return {
        total: pool.size,
        active: pool.used,
        idle: pool.available,
        pending: pool.pending,
        max: pool.options.max,
        min: pool.options.min
      };
    } catch (error) {
      logger.error('Error getting connection stats:', error);
      return null;
    }
  }
}

// Singleton instance
const databaseConnection = new DatabaseConnection();

module.exports = databaseConnection;