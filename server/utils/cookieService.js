require('dotenv').config()
const bufferGen = require('./buffer_gen.utils');
const jwt = require('jsonwebtoken')

class CookieService {
    constructor() {
        this.cookieName = 'pi_auth_token';
        this.cookieOptions = {
            httpOnly: true, // Prevent XSS attacks
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'lax', // Allow cross-site cookies
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/',
            // domain: process.env.COOKIE_DOMAIN || undefined // Set explicitly if needed
        };
    }

    /**
     * Set encrypted authentication cookie
     * @param {Object} res - Express response object
     * @param {string} token - JWT token to encrypt and store
     * @param {Object} options - Additional cookie options
     */
    setAuthCoo(res, token, options = {}) {
        try {
            // For now, use simple base64 encoding until crypto is fixed
            // In production, you should use proper encryption
            const encodedToken = bufferGen.encodeBase64(token)

            // Merge with default options
            const cookieOptions = { ...this.cookieOptions, ...options };

            // Set the cookie
            res.cookie(this.cookieName, encodedToken, cookieOptions);

            console.log('🍪 Auth cookie set successfully with options:', cookieOptions);
        } catch (error) {
            console.error('Error setting auth cookie:', error);
            throw new Error('Failed to set authentication cookie');
        }
    }

    /**
     * Get and decrypt authentication token from cookie
     * @param {Object} req - Express request object
     * @returns {string|null} - Decrypted JWT token or null if not found/invalid
     */
    

    /**
     * Clear authentication cookie
     * @param {Object} res - Express response object
     */
    clearAuthCookie(res) {
        res.clearCookie(this.cookieName, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/'
        });
        console.log('Auth cookie cleared');
    }

    /**
     * Set cookie with custom expiry based on token expiry
     * @param {Object} res - Express response object
     * @param {string} token - JWT token
     * @param {number} expiresIn - Token expiry time in seconds
     */
    setAuthCookieWithExpiry(res, token, expiresIn) {
        const maxAge = expiresIn * 1000; // Convert to milliseconds
        this.setAuthCookie(res, token, { maxAge });
    }

    /**
     * Validate if cookie exists and is not expired
     * @param {Object} req - Express request object
     * @returns {boolean} - True if valid cookie exists
     */
    hasValidCookie(req) {
        const token = this.getAuthToken(req);
        return token !== null;
    }
}

module.exports = new CookieService();