const jwt = require('jsonwebtoken');
const { User } = require('../models/index.model');
const { logger } = require('../utils/logger');
const cookieService = require('../utils/cookieService');
const bufferGen = require('../utils/buffer_gen.utils');

/**
 * Authentication middleware to verify Pi access tokens from cookies or Authorization header
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Try to get Pi access token from cookie first, then from Authorization header
        let userToken = cookieService.getAuthToken(req);
        console.log(userToken)

        if (!userToken) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        const userDataObject = bufferGen.decodeBase64(userToken);
        console.log(typeof(userDataObject))

        const userData = typeof(userData) == 'string' ? JSON.parse(userData) : userData;
       
        // Check if token is expired
        if (new Date() > new Date(authRecord.expires_at)) {
            return res.status(401).json({
                success: false,
                message: 'Access token expired'
            });
        }

        // Get user from the auth record
        const user = await User.findByPk(userData.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Add user and access token to request object
        req.user = user;
        req.accessToken = accessToken;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);

        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        // Try to get token from cookie first, then from Authorization header
        let token = cookieService.getAuthToken(req);
        
        if (!token) {
            const authHeader = req.headers['authorization'];
            token = authHeader && authHeader.split(' ')[1];
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await User.findByPk(decoded.userId, {
                attributes: { exclude: ['password'] }
            });

            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication for optional auth
        logger.warn('Optional auth failed:', error.message);
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth
};