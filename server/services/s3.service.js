const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { logger } = require('../utils/logger');
const { serverUrl } = require('../config/url.config')

/**
 * S3 Service for Railway S3-compatible storage
 * Handles file uploads, deletions, and health monitoring
 */
class S3Service {
    constructor() {
        this.client = null;
        this.bucketName = null;
        this.region = null;
        this.endpoint = null;
        this.publicUrl = null;
        this.initialized = false;
        this.connected = false;
        this.healthCheckInterval = null;
        this.lastHealthCheck = null;
        this.metrics = {
            uploads: 0,
            deletions: 0,
            errors: 0,
            lastUpload: null,
            lastError: null
        };
    }

    /**
     * Initialize S3 client with Railway credentials
     */
    async initialize() {
        try {
            // Get configuration from environment
            this.bucketName = process.env.S3_BUCKET_NAME;
            this.region = process.env.S3_REGION || 'us-east-1';
            this.endpoint = process.env.S3_ENDPOINT;
            this.publicUrl = process.env.S3_PUBLIC_URL;
            const accessKeyId = process.env.S3_ACCESS_KEY_ID;
            const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

            // Validate required configuration
            if (!this.bucketName || !accessKeyId || !secretAccessKey || !this.endpoint) {
                logger.warn('⚠️  S3 configuration incomplete. Required: S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT');
                return false;
            }

            // Create S3 client
            this.client = new S3Client({
                region: this.region,
                endpoint: this.endpoint,
                credentials: {
                    accessKeyId,
                    secretAccessKey
                },
                forcePathStyle: true, // Required for Railway S3
                maxAttempts: 3
            });

            // Test connection
            await this.testConnection();

            this.initialized = true;
            this.connected = true;

            logger.info('✅ S3 Service initialized successfully', {
                bucket: this.bucketName,
                region: this.region,
                endpoint: this.endpoint
            });

            return true;
        } catch (error) {
            logger.error('❌ S3 Service initialization failed:', {
                error: error.message,
                stack: error.stack
            });
            this.initialized = false;
            this.connected = false;
            return false;
        }
    }

    /**
     * Test S3 connection by checking bucket access
     */
    async testConnection() {
        try {
            const command = new HeadBucketCommand({
                Bucket: this.bucketName
            });

            await this.client.send(command);

            logger.info('✅ S3 bucket connection test successful', {
                bucket: this.bucketName
            });

            return true;
        } catch (error) {
            logger.error('❌ S3 bucket connection test failed:', {
                bucket: this.bucketName,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Upload file to S3
     * @param {Buffer} fileBuffer - File buffer
     * @param {string} filename - Original filename
     * @param {string} mimetype - File MIME type
     * @param {string} folder - Folder/prefix in bucket (e.g., 'profiles', 'events')
     * @returns {Object} Upload result with URL and key
     */
    async uploadFile(fileBuffer, filename, mimetype, folder = 'uploads') {
        try {
            if (!this.initialized || !this.client) {
                throw new Error('S3 client not initialized. Please configure S3 environment variables.');
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 8);
            const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
            const key = `${folder}/${timestamp}-${randomString}-${sanitizedFilename}`;

            // Upload to S3
            // Note: Railway S3 doesn't support ACL parameter, files are public by default
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: fileBuffer,
                ContentType: mimetype,
                CacheControl: 'max-age=31536000', // Cache for 1 year
                // Metadata to help with debugging
                Metadata: {
                    'uploaded-at': new Date().toISOString(),
                    'original-filename': filename
                }
            });

            await this.client.send(command);

            // Generate proxied URL through backend
            // Instead of: https://storage.railway.app/bucket/key
            // Return: https://your-backend.com/api/media/folder/filename
            const url = `${serverUrl}/api/media/${key}`;
            
            // Also store direct S3 URL for reference
            const directUrl = `${this.publicUrl}/${key}`;

            // Update metrics
            this.metrics.uploads++;
            this.metrics.lastUpload = new Date().toISOString();

            logger.info('✅ File uploaded to S3', {
                key,
                size: fileBuffer.length,
                mimetype,
                proxiedUrl: url,
                directUrl
            });

            return {
                success: true,
                url, // Proxied URL through backend
                directUrl, // Direct S3 URL (for reference)
                key,
                size: fileBuffer.length,
                mimetype
            };
        } catch (error) {
            this.metrics.errors++;
            this.metrics.lastError = {
                timestamp: new Date().toISOString(),
                message: error.message
            };

            logger.error('❌ S3 upload failed:', {
                filename,
                folder,
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete file from S3
     * @param {string} fileKey - S3 object key or full URL
     * @returns {Object} Deletion result
     */
    async deleteFile(fileKey) {
        try {
            if (!this.initialized || !this.client) {
                throw new Error('S3 client not initialized');
            }

            // Extract key from URL if full URL is provided
            let key = fileKey;
            if (fileKey.includes('http')) {
                const url = new URL(fileKey);
                key = url.pathname.substring(1); // Remove leading slash

                // Remove bucket name if it's in the path
                if (key.startsWith(this.bucketName + '/')) {
                    key = key.substring(this.bucketName.length + 1);
                }
            }

            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            await this.client.send(command);

            // Update metrics
            this.metrics.deletions++;

            logger.info('✅ File deleted from S3', { key });

            return {
                success: true,
                key
            };
        } catch (error) {
            this.metrics.errors++;
            this.metrics.lastError = {
                timestamp: new Date().toISOString(),
                message: error.message
            };

            logger.error('❌ S3 deletion failed:', {
                fileKey,
                error: error.message
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Start periodic health checks
     * @param {number} interval - Check interval in milliseconds
     */
    startHealthCheck(interval = 60000) {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthCheck();
        }, interval);

        logger.info('🏥 S3 health check started', {
            interval: `${interval / 1000}s`
        });
    }

    /**
     * Perform health check
     */
    async performHealthCheck() {
        try {
            if (!this.initialized) {
                return;
            }

            const startTime = Date.now();
            await this.testConnection();
            const responseTime = Date.now() - startTime;

            this.connected = true;
            this.lastHealthCheck = {
                timestamp: new Date().toISOString(),
                status: 'healthy',
                responseTime
            };

            logger.debug('S3 health check passed', {
                responseTime: `${responseTime}ms`
            });
        } catch (error) {
            this.connected = false;
            this.lastHealthCheck = {
                timestamp: new Date().toISOString(),
                status: 'unhealthy',
                error: error.message
            };

            logger.warn('S3 health check failed', {
                error: error.message
            });
        }
    }

    /**
     * Stop health checks
     */
    stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            logger.info('S3 health check stopped');
        }
    }

    /**
     * Get configuration info
     * @returns {Object} Configuration details
     */
    getConfigInfo() {
        return {
            bucket: this.bucketName || 'not-configured',
            region: this.region || 'not-configured',
            endpoint: this.endpoint || 'not-configured',
            publicUrl: this.publicUrl || 'not-configured',
            hasCredentials: !!(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY),
            available: this.initialized && this.connected
        };
    }

    /**
     * Get health status
     * @returns {Object} Health status details
     */
    getHealthStatus() {
        return {
            initialized: this.initialized,
            connected: this.connected,
            bucket: this.bucketName,
            endpoint: this.endpoint,
            lastHealthCheck: this.lastHealthCheck,
            metrics: {
                uploads: this.metrics.uploads,
                deletions: this.metrics.deletions,
                errors: this.metrics.errors,
                lastUpload: this.metrics.lastUpload,
                lastError: this.metrics.lastError
            }
        };
    }

    /**
     * Get metrics
     * @returns {Object} Service metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            uptime: this.initialized ? 'active' : 'inactive',
            status: this.connected ? 'connected' : 'disconnected'
        };
    }

    /**
     * Check if service is ready
     * @returns {boolean} Ready status
     */
    isReady() {
        return this.initialized && this.connected;
    }

    /**
     * List files in S3 bucket
     * @param {string} prefix - Optional prefix/folder to filter (e.g., 'profiles/')
     * @param {number} maxKeys - Maximum number of files to return (default: 100)
     * @returns {Object} List of files with URLs
     */
    async listFiles(prefix = '', maxKeys = 100) {
        try {
            if (!this.initialized || !this.client) {
                throw new Error('S3 client not initialized');
            }

            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
                MaxKeys: maxKeys
            });

            const response = await this.client.send(command);

            const files = (response.Contents || []).map(file => ({
                key: file.Key,
                size: file.Size,
                lastModified: file.LastModified,
                url: `${this.publicUrl}/${file.Key}`
            }));

            logger.info('✅ Listed S3 files', {
                prefix,
                count: files.length,
                truncated: response.IsTruncated
            });

            return {
                success: true,
                files,
                count: files.length,
                truncated: response.IsTruncated,
                prefix
            };
        } catch (error) {
            logger.error('❌ Failed to list S3 files:', {
                prefix,
                error: error.message
            });

            return {
                success: false,
                error: error.message,
                files: []
            };
        }
    }
}

// Export singleton instance
const s3Service = new S3Service();
module.exports = s3Service;
