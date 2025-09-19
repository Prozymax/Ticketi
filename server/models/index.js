const fs = require('fs');
const path = require('path');
const databaseConnection = require('../config/sequelize');
const logger = require('../utils/logger');

class ModelManager {
  constructor() {
    this.sequelize = null;
    this.models = {};
    this.associations = [];
  }

  async initialize() {
    try {
      // Initialize database connection
      this.sequelize = await databaseConnection.initialize();
      
      // Load all model files
      await this.loadModels();
      
      // Set up associations
      this.setupAssociations();
      
      logger.info(`Loaded ${Object.keys(this.models).length} models successfully`);
      return this.models;
    } catch (error) {
      logger.error('Failed to initialize models:', error);
      throw error;
    }
  }

  async loadModels() {
    const modelsPath = __dirname;
    const modelFiles = fs.readdirSync(modelsPath)
      .filter(file => {
        return (
          file.indexOf('.') !== 0 &&
          file !== 'index.js' &&
          file.slice(-3) === '.js'
        );
      });

    for (const file of modelFiles) {
      try {
        const modelPath = path.join(modelsPath, file);
        const model = require(modelPath)(this.sequelize);
        
        if (model && model.name) {
          this.models[model.name] = model;
          logger.debug(`Loaded model: ${model.name}`);
        }
      } catch (error) {
        logger.error(`Failed to load model from ${file}:`, error);
      }
    }
  }

  setupAssociations() {
    // Set up model associations
    Object.keys(this.models).forEach(modelName => {
      const model = this.models[modelName];
      if (model.associate) {
        try {
          model.associate(this.models);
          logger.debug(`Set up associations for: ${modelName}`);
        } catch (error) {
          logger.error(`Failed to set up associations for ${modelName}:`, error);
        }
      }
    });
  }

  async syncModels(options = {}) {
    try {
      await databaseConnection.syncDatabase(options);
      logger.info('All models synchronized successfully');
    } catch (error) {
      logger.error('Model synchronization failed:', error);
      throw error;
    }
  }

  getModel(modelName) {
    const model = this.models[modelName];
    if (!model) {
      throw new Error(`Model '${modelName}' not found`);
    }
    return model;
  }

  getAllModels() {
    return this.models;
  }

  getSequelize() {
    return this.sequelize;
  }

  async closeConnection() {
    try {
      await databaseConnection.closeConnection();
      logger.info('Database connection closed from ModelManager');
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  // Health check method
  async healthCheck() {
    try {
      await this.sequelize.authenticate();
      return {
        status: 'healthy',
        models: Object.keys(this.models).length,
        connection: 'active'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connection: 'failed'
      };
    }
  }

  // Get model statistics
  async getModelStats() {
    const stats = {};
    
    for (const [modelName, model] of Object.entries(this.models)) {
      try {
        const count = await model.count();
        stats[modelName] = {
          count,
          tableName: model.tableName
        };
      } catch (error) {
        stats[modelName] = {
          error: error.message
        };
      }
    }
    
    return stats;
  }
}

// Create singleton instance
const modelManager = new ModelManager();

module.exports = modelManager;