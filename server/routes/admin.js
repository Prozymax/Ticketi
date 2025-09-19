const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const modelManager = require('../models');
const securityMiddleware = require('../middleware/security');

// Admin IP whitelist middleware
const adminIPs = process.env.ADMIN_IPS ? process.env.ADMIN_IPS.split(',') : ['127.0.0.1'];
router.use(securityMiddleware.ipWhitelist(adminIPs));

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const dbHealth = await modelManager.healthCheck();
    const connectionStats = await modelManager.databaseConnection?.getConnectionStats();
    
    // TODO: Get model statistics
    const modelStats = await modelManager.getModelStats();
    
    res.json({
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
      },
      database: {
        health: dbHealth,
        connections: connectionStats,
        models: modelStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics'
    });
  }
});

// Database operations
router.post('/db/sync', async (req, res) => {
  try {
    const { force = false, alter = false } = req.body;
    
    logger.warn(`Admin database sync requested - force: ${force}, alter: ${alter}`);
    
    await modelManager.syncModels({ force, alter });
    
    res.json({
      success: true,
      message: 'Database synchronized successfully'
    });
  } catch (error) {
    logger.error('Database sync error:', error);
    res.status(500).json({
      error: 'Database sync failed'
    });
  }
});

module.exports = router;