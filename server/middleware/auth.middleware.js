const jwt = require('jsonwebtoken');
const { User } = require('../models/index.model');
const { logger } = require('../utils/logger');
const bufferGen = require('../utils/buffer_gen.utils');
const tokenService = require('../utils/token.utils');
const { serverUrl, frontendUrl } = require('../config/url.config');
const AuthService = require('../services/auth.service');

/**
 * Authentication middleware to verify Pi access tokens from cookies or Authorization header
 * Also validates and extends Redis session TTL on each authenticated request
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

        // Validate Redis session if sessionId is present
        if (userData.sessionId) {
            const sessionValidation = await AuthService.validateSession(userData.sessionId);
            
            if (!sessionValidation.valid) {
                logger.warn('Invalid or expired session:', userData.sessionId);
                return res.status(401).json({
                    success: false,
                    message: 'Session expired or invalid'
                });
            }

            // Session is valid and TTL has been extended by 3600 seconds
            logger.debug('Session validated and extended:', userData.sessionId);
        }

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

        // Add user and session info to request object
        req.user = user;
        req.sessionId = userData.sessionId || null;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);

        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};


module.exports = {
    authenticateToken,
};