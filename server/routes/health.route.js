const express = require('express');
const router = express.Router();
const cacheService = require('../services/cache.service');
const s3Service = require('../services/s3.service');
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

// S3 Storage Health Check
router.get('/s3', (req, res) => {
    try {
        const healthStatus = s3Service.getHealthStatus();
        const config = s3Service.getConfigInfo();
        
        let status = 'healthy';
        if (!healthStatus.initialized) {
            status = 'not-configured';
        } else if (!healthStatus.connected) {
            status = 'down';
        }
        
        const response = {
            status,
            timestamp: new Date().toISOString(),
            s3: {
                initialized: healthStatus.initialized,
                connected: healthStatus.connected,
                bucket: healthStatus.bucket,
                endpoint: healthStatus.endpoint,
                lastHealthCheck: healthStatus.lastHealthCheck
            },
            metrics: {
                uploads: healthStatus.metrics.uploads,
                deletions: healthStatus.metrics.deletions,
                errors: healthStatus.metrics.errors,
                lastUpload: healthStatus.metrics.lastUpload,
                lastError: healthStatus.metrics.lastError
            },
            configuration: {
                bucket: config.bucket,
                region: config.region,
                endpoint: config.endpoint,
                hasCredentials: config.hasCredentials,
                available: config.available
            }
        };
        
        const httpStatus = status === 'healthy' ? 200 : (status === 'not-configured' ? 503 : 503);
        res.status(httpStatus).json(response);
        
    } catch (error) {
        logger.error('S3 health check endpoint error', {
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Failed to retrieve S3 health status',
            message: error.message
        });
    }
});

// S3 Metrics Only
router.get('/s3/metrics', (req, res) => {
    try {
        const metrics = s3Service.getMetrics();
        
        res.status(200).json({
            timestamp: new Date().toISOString(),
            metrics
        });
        
    } catch (error) {
        logger.error('S3 metrics endpoint error', {
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Failed to retrieve S3 metrics',
            message: error.message
        });
    }
});

// S3 Configuration Info
router.get('/s3/config', (req, res) => {
    try {
        const config = s3Service.getConfigInfo();
        
        res.status(200).json({
            timestamp: new Date().toISOString(),
            configuration: config
        });
        
    } catch (error) {
        logger.error('S3 config endpoint error', {
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Failed to retrieve S3 configuration',
            message: error.message
        });
    }
});

// Combined System Health Check (Cache + S3)
router.get('/system', async (req, res) => {
    try {
        // Get cache health
        const cacheHealth = cacheService.getHealthStatus();
        const cacheMetrics = cacheService.getMetrics();
        
        // Get S3 health
        const s3Health = s3Service.getHealthStatus();
        const s3Config = s3Service.getConfigInfo();
        
        // Determine overall system status
        let systemStatus = 'healthy';
        if (!s3Health.initialized || !s3Health.connected) {
            systemStatus = 'degraded'; // S3 down is degraded, not critical
        }
        if (!cacheHealth.connected && !cacheHealth.fallbackMode) {
            systemStatus = 'degraded';
        }
        
        const response = {
            status: systemStatus,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            services: {
                cache: {
                    status: cacheHealth.connected ? 'healthy' : (cacheHealth.fallbackMode ? 'fallback' : 'down'),
                    connected: cacheHealth.connected,
                    fallbackMode: cacheHealth.fallbackMode,
                    hitRate: cacheMetrics.overall.hitRate,
                    operations: cacheMetrics.overall.operations
                },
                s3: {
                    status: s3Health.initialized ? (s3Health.connected ? 'healthy' : 'down') : 'not-configured',
                    initialized: s3Health.initialized,
                    connected: s3Health.connected,
                    bucket: s3Config.bucket,
                    uploads: s3Health.metrics.uploads,
                    errors: s3Health.metrics.errors
                }
            }
        };
        
        const httpStatus = systemStatus === 'healthy' ? 200 : 503;
        res.status(httpStatus).json(response);
        
    } catch (error) {
        logger.error('System health check endpoint error', {
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Failed to retrieve system health status',
            message: error.message
        });
    }
});

// List S3 Files (Browse your uploads)
router.get('/s3/files', async (req, res) => {
    try {
        const prefix = req.query.folder || ''; // Optional: filter by folder (e.g., ?folder=profiles)
        const maxKeys = parseInt(req.query.limit) || 100; // Optional: limit results
        
        const result = await s3Service.listFiles(prefix, maxKeys);
        
        if (!result.success) {
            return res.status(500).json({
                status: 'error',
                timestamp: new Date().toISOString(),
                error: 'Failed to list files',
                message: result.error
            });
        }
        
        res.status(200).json({
            status: 'success',
            timestamp: new Date().toISOString(),
            folder: prefix || 'root',
            count: result.count,
            truncated: result.truncated,
            files: result.files
        });
        
    } catch (error) {
        logger.error('S3 files listing endpoint error', {
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Failed to list S3 files',
            message: error.message
        });
    }
});

module.exports = { healthRouter: router };
