const express = require('express');
const router = express.Router();
const cacheService = require('../services/cache.service');
const { logger } = require('../utils/logger');

router.get('/cache', async (req, res) => {
    try {
        const healthStatus = cacheService.getHealthStatus();
        const metrics = cacheService.getMetrics();
        const redisInfo = await cacheService.getRedisInfo();
        
        let status = 'healthy';
        if (healthStatus.fallbackMode) {
            status = 'degraded';
        } else if (!healthStatus.connected) {
            status = 'down';
        }
        
        const response = {
            status,
            timestamp: new Date().toISOString(),
            cache: {
                connected: healthStatus.connected,
                fallbackMode: healthStatus.fallbackMode,
                reconnectAttempts: healthStatus.reconnectAttempts,
                clientStatus: healthStatus.status
            },
            metrics: {
                hitRate: metrics.overall.hitRate,
                missRate: metrics.overall.missRate,
                totalOperations: metrics.overall.operations,
                totalRequests: metrics.overall.totalRequests,
                errors: metrics.overall.errors,
                avgResponseTimeMs: metrics.overall.avgResponseTimeMs,
                operationsPerMinute: metrics.overall.operationsPerMinute,
                uptimeMinutes: metrics.overall.uptimeMinutes
            },
            redis: redisInfo.available ? {
                memory: redisInfo.memory,
                stats: redisInfo.stats,
                connectionPool: redisInfo.connectionPool
            } : {
                available: false,
                reason: redisInfo.error || 'Redis not available'
            },
            patternMetrics: metrics.byPattern
        };
        
        const httpStatus = status === 'healthy' ? 200 : 503;
        res.status(httpStatus).json(response);
        
    } catch (error) {
        logger.error('Health check endpoint error', {
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Failed to retrieve health status',
            message: error.message
        });
    }
});

router.get('/cache/metrics', (req, res) => {
    try {
        const metrics = cacheService.getMetrics();
        
        res.status(200).json({
            timestamp: new Date().toISOString(),
            metrics
        });
        
    } catch (error) {
        logger.error('Cache metrics endpoint error', {
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Failed to retrieve cache metrics',
            message: error.message
        });
    }
});

router.post('/cache/reset-metrics', (req, res) => {
    try {
        cacheService.resetMetrics();
        
        logger.info('Cache metrics reset via API');
        
        res.status(200).json({
            status: 'success',
            timestamp: new Date().toISOString(),
            message: 'Cache metrics reset successfully'
        });
        
    } catch (error) {
        logger.error('Reset metrics endpoint error', {
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Failed to reset cache metrics',
            message: error.message
        });
    }
});

module.exports = { healthRouter: router };
