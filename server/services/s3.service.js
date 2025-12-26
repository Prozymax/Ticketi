const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { logger } = require('../utils/logger');

/**
 * S3 Service for Railway S3 Storage
 * Replaces Filestack with Railway's S3-compatible storage
 */
class S3Service {
    constructor() {
        // Railway S3 configuration
        this.bucketName = process.env.S3_BUCKET_NAME || 'ticketi-uploads';
        this.region = process.env.S3_REGION || 'us-east-1';
        this.endpoint = process.env.S3_ENDPOINT; // Railway S3 endpoint
        this.accessKeyId = process.env.S3_ACCESS_KEY_ID;
        this.secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
        this.publicUrl = process.env.S3_PUBLIC_URL; // Public URL for accessing files

        // Validate configuration
        if (!this.accessKeyId || !this.secretAccessKey) {
            logger.warn('S3 credentials not found in environment variables');
            this.client = null;
            return;
        }

        // Initialize S3 client
        try {
            const config = {
                region: this.region,
                credentials: {
                    accessKeyId: this.accessKeyId,
                    secretAccessKey: this.secretAccessKey
                }
            };

            // Add endpoint if provided (for Railway S3)
            if (this.endpoint) {
                config.endpoint = this.endpoint;
          turn  credentials: {
       
    async initialize() {
                }
            logger.info('🔧 Initializing S3 service...', {
                bucket: this.bucketName,
            if (this.endpoint) {
                config.endpoint = this.endpoint;
            });
            }

            this.client = new S3Client(config);
                logger.warn('⚠️  S3 credentials not found in environment variables');
                logger.warn('   Application will continue without S3 storage');
                this.isInitializeon,
                endpoint: this.endpoint
            }

            if (!this.endpoint) {
                .client = null;
                logger.warn('   Set S3_ENDPOINT in .env for Railway S3');
                this.isInitialized = true;
                return false;
      nerateFilename(originalFilename,

            // Initialize S3 clientath.random() * 1E9);
            const config = {
                region: this.region,me
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9]/g, '-')
            .toLowerCase();
        
            };

            : `${timestamp}-${random}-${sanitizedName}.${extension}`;
    }

                config.forcePathStyle = true; // Required for custom S3 endpoints
            }

                throw new Error('S3 client not initialized. Check S3 credentials.');
            }

            const key = this.generateFilename(filename, folder);

            this.isConnected = trutObjectCommand({
            this.isIni: this.bucketName,
                Key:
                Body: fileBuffer,
                ContentType: mimetype,
                endpoint: this.endpoint,
                status: ' {
                    'original-filename': filename,
                    'upload-times
            return true;
        } cat);

            await this.client.send(command);

            const url = this.bucketName
            });
            metrics.uploads++;
            this.metrics.totalBytesUploaded += fileBuffer.length;

            logger.info('File uploaded to S3', {
                key,
                url,
                size: fileBuffer.length,
                mimetype
            });

            return {
                success: true,
                url,
                key,
                filename,
                size: fileBuffer.length,
                mimetype
            };
        } catch (error) {
            this.metrics.errors++;
            logger.error('Error uploading to S3:', {
                error: error.message,
                filename,
                folder
            });
            return {nfo('✅ S3 connection test successful');
            return true;
        } catch (error) {
            logger.error('❌ S3 connection test failed:', {
                error: error.message,
                code: error.code
            });
    async deleteFile(key) {
        }
    }if (!this.client

    /**
     * Start periodic health checks
            const objectKey = l - Check interval Url(illiseconds (default: 60000)
     */
    startHeak(intervaland 0000) DeleteObjectCommand({
                Bucket: this.ntervtName,
            clearInterval(this
            });

        this.healthCheckInteresend(command);
            await this.checkHealth();
        }, interval);;

            logger.info('File deleted from S3', { key: objectKey });

       Generate a unique filename with timestamp
     success: true,
         age: 'File deleted success
    /**
     * Stop health checks
     * @param {string} originalFilename - Original filename
     * @p   logger.error('Error deleting from S3:', {
                error: error.message,
                key
            });
            return {
                success: false,
                error: error.message
            };
        }
    }

    extractKeyFromUrl(urlOrKey) {
        if (!urlOrKey.startsWith('http')) {
            return urlOrKey;
        }

        try {
            const url = new URL(urlOrKey);
            return url.pathname.substring(1);
        } catch (error) {
            return urlOrKey;
        }
    }

    getPublicUrl(key) {
        if (this.publicUrl) {
            return `${this.publicUrl}/${key}`;
        }

        if (this.endpoint) {
            return `${this.endpoint}/${this.
        ilable = true;
            this.isConnected = true;
//${this.bucket`;
    }

    async getPresignedUrl(key, expiresIn = 360
        return presConnected = false;
            this.metrics.errors++;
        throw new Error('S3 client not initialized. Check S3 credentials.');
            }

                code: error.code
          })    Bucket: this.bucketName,
                Key: key
            });

            const url = await getSignedUrl(this.client, command, { expiresIn });
    }
} catch (error) {
            logger.error('Error generating presigned URL:', {
                error: error.message,
                key
            });
            throw error;
        }
    }

    isAvailable() {
        return this.client !== null;
    }

    getConfigInfo() {
        return {
            available: this.isAvailable(),
            bucket: this.bucketName,
            region: this.region,
            endpoint: this.endpoint || 'default',
            hasCredentials: !!(this.accessKeyId && this.secretAccessKey)
        };
    }

    getMetrics() {
        const uptimeMinutes = (Date.now() - this.metrics.startTime) / 60000;
        return {
            uploads: this.metrics.uploads,
            deletions: this.metrics.deletions,
            errors: this.metrics.errors,
            totalBytesUploaded: this.metrics.totalBytesUploaded,
            totalMBUploaded: (this.metrics.totalBytesUploaded / 1024 / 1024).toFixed(2),
            uptimeMinutes: uptimeMinutes.toFixed(2),
            uploadsPerMinute: uptimeMinutes > 0 ? (this.metrics.uploads / uptimeMinutes).toFixed(2) : 0
        };
    }
}

module.exports = new S3Service();
            });++;
            logger.error('Error deleting from S3:'
                success: false,
                error: error.message
            };
        }
    }
                error: er

    /**
     * Extract S3 key from full URL
     * @param {string} urlOrKey - Full URL or S3 key
     * @returns {string} S3 key
     */
    extractKeyFromUrl(urlOrKey) {
        // If it's already a key (no http/https), return as is
        if (!urlOrKey.startsWith('http')) {
            return urlOrKey;
        }

        try {
            const url = new URL(urlOrKey);
            // Remove leading slash
            return url.pathname.substring(1);
        } catch (error) {
            // If URL parsing fails, assume it's already a key
            return urlOrKey;
        }
    }

    /**
     * Get public URL for an S3 object
     * @param {string} key - S3 object key
     * @returns {string} Public URL
     */
    getPublicUrl(key) {
        // Use custom public URL if provided (Railway S3)
        if (this.publicUrl) {
            return `${this.publicUrl}/${key}`;
        }

        // Use endpoint if provided
        if (this.endpoint) {
            return `${this.endpoint}/${this.bucketName}/${key}`;
        }

        // Default AWS S3 URL format
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }

    /**
     * Generate a presigned URL for temporary access
     * @param {string} key - S3 object key
     * @param {number} expiresIn - Expiration time in seconds (default: 3600)
     * @returns {Promise<string>} Presigned URL
     */
    async getPresignedUrl(key, expiresIn = 3600) {
        try {
            if (!this.client) {
                throw new Error('S3 client not initialized. Check S3 credentials.');
            }

            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            const url = await getSignedUrl(this.client, command, { expiresIn });
            return url;
        } catch (error) {
            logger.error('Error generating presigned URL:', {
                error: error.message,
                key
            });
            throw error;
        }
    }

    /**
     * Check if S3 service is available
     * @returns {boolean} Availability status
     */
    isAvailable() {
        return this.client !== null;
    }

    /**
     * Get service configuration info (for debugging)
     * @returns {Object} Configuration info
     */
    getConfigInfo() {
        return {
            available: this.isAvailable(),
            bucket: this.bucketName,
            region: this.region,
            endpoint: this.endpoint || 'default',
            hasCredentials: !!(this.accessKeyId && this.secretAccessKey)
        };
    }
}

// Export singleton instance
module.exports = new S3Service();
