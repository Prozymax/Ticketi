const express = require('express');
const router = express.Router();
const s3Service = require('../services/s3.service');
const { logger } = require('../utils/logger');
const { GetObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Image Proxy Route
 * Proxies images from S3 through your backend
 * This eliminates the need to add S3 domains to Next.js config
 */

// Proxy image from S3
// GET /api/media/:folder/:filename
router.get('/:folder/:filename', async (req, res) => {
    try {
        const { folder, filename } = req.params;
        const key = `${folder}/${filename}`;

        logger.debug('Proxying image from S3', { key });

        // Check if S3 is initialized
        if (!s3Service.isReady()) {
            logger.error('S3 service not ready for image proxy');
            return res.status(503).json({
                error: 'Storage service unavailable'
            });
        }

        // Get file from S3
        const command = new GetObjectCommand({
            Bucket: s3Service.bucketName,
            Key: key
        });

        const response = await s3Service.client.send(command);

        // Set appropriate headers
        res.setHeader('Content-Type', response.ContentType || 'image/jpeg');
        res.setHeader('Content-Length', response.ContentLength);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.setHeader('ETag', response.ETag);

        // Stream the image to response
        response.Body.pipe(res);

        logger.info('✅ Image proxied successfully', { key });

    } catch (error) {
        logger.error('❌ Failed to proxy image', {
            error: error.message,
            folder: req.params.folder,
            filename: req.params.filename
        });

        // Return 404 for not found, 500 for other errors
        const statusCode = error.name === 'NoSuchKey' ? 404 : 500;
        res.status(statusCode).json({
            error: 'Failed to load image',
            message: error.message
        });
    }
});

// Alternative route for direct key access
// GET /api/media/proxy?key=profiles/image.jpg
router.get('/proxy', async (req, res) => {
    try {
        const key = req.query.key;

        if (!key) {
            return res.status(400).json({
                error: 'Missing key parameter'
            });
        }

        logger.debug('Proxying image from S3 (direct key)', { key });

        if (!s3Service.isReady()) {
            return res.status(503).json({
                error: 'Storage service unavailable'
            });
        }

        const command = new GetObjectCommand({
            Bucket: s3Service.bucketName,
            Key: key
        });

        const response = await s3Service.client.send(command);

        res.setHeader('Content-Type', response.ContentType || 'image/jpeg');
        res.setHeader('Content-Length', response.ContentLength);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('ETag', response.ETag);

        response.Body.pipe(res);

        logger.info('✅ Image proxied successfully (direct key)', { key });

    } catch (error) {
        logger.error('❌ Failed to proxy image (direct key)', {
            error: error.message,
            key: req.query.key
        });

        const statusCode = error.name === 'NoSuchKey' ? 404 : 500;
        res.status(statusCode).json({
            error: 'Failed to load image',
            message: error.message
        });
    }
});

module.exports = { mediaRouter: router };
