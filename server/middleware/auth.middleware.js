const jwt = require('jsonwebtoken');
const { User } = require('../models/index.model');
const { logger } = require('../utils/logger');
const bufferGen = require('../utils/buffer_gen.utils');
const tokenService = require('../utils/token.utils');
const { serverUrl, frontendUrl } = require('../config/url.config');

/**
 * Authentication middleware to verify Pi access tokens from cookies or Authorization header
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Try to get Pi access token from cookie first, then from Authorization header
        let { token: userToken, error, expired, message } = tokenService.getAuthToken(req)

        if (!userToken) {
            return res.status(401).json({
                success: false,
                message: 'User Token missing'
            });
        }

        if (error) {
            return res.status(401).json({
                success: false,
                message: message
            });
        }

        if (expired) {
            return Response.redirect(`${frontendUrl}/login`)
        }

        const userDataObject = bufferGen.decodeBase64(userToken);

        const userData = typeof(userDataObject) == 'string' ? JSON.parse(userDataObject) : userDataObject;

        // Get user from the auth record
        const user = await User.findByPk(userData.userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log(user)

        // Add user to request object
        req.user = user;
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