const filestack = require('filestack-js');

class FilestackService {
    constructor() {
        this.apiKey = process.env.FILESTACK_API_KEY;
        if (!this.apiKey) {
            console.warn('FILESTACK_API_KEY not found in environment variables');
        }
        this.client = this.apiKey ? filestack.init(this.apiKey) : null;
    }

    /**
     * Upload file buffer to Filestack
     * @param {Buffer} fileBuffer - File buffer from multer
     * @param {string} filename - Original filename
     * @param {string} mimetype - File mimetype
     * @returns {Promise<Object>} Upload result with URL
     */
    async uploadFile(fileBuffer, filename, mimetype) {
        try {
            if (!this.client) {
                throw new Error('Filestack client not initialized. Check FILESTACK_API_KEY.');
            }

            // Upload buffer to Filestack
            const result = await this.client.upload(fileBuffer, {}, {
                filename: filename
            });

            console.log('File uploaded to Filestack:', result.url);

            return {
                success: true,
                url: result.url,
                handle: result.handle,
                filename: result.filename,
                size: result.size,
                mimetype: result.mimetype
            };
        } catch (error) {
            console.error('Error uploading to Filestack:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete file from Filestack
     * @param {string} handle - Filestack file handle
     * @returns {Promise<Object>} Deletion result
     */
    async deleteFile(handle) {
        try {
            if (!this.client) {
                throw new Error('Filestack client not initialized. Check FILESTACK_API_KEY.');
            }

            await this.client.remove(handle);
            console.log('File deleted from Filestack:', handle);

            return {
                success: true,
                message: 'File deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting from Filestack:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get transformed image URL
     * @param {string} handle - Filestack file handle
     * @param {Object} transformations - Transformation options
     * @returns {string} Transformed image URL
     */
    getTransformedUrl(handle, transformations = {}) {
        const baseUrl = `https://cdn.filestackcontent.com`;

        // Build transformation string
        const transforms = [];
        if (transformations.resize) {
            transforms.push(`resize=width:${transformations.resize.width},height:${transformations.resize.height},fit:${transformations.resize.fit || 'crop'}`);
        }
        if (transformations.quality) {
            transforms.push(`quality=value:${transformations.quality}`);
        }

        const transformString = transforms.length > 0 ? `/${transforms.join('/')}` : '';

        return `${baseUrl}${transformString}/${handle}`;
    }
}

module.exports = new FilestackService();
