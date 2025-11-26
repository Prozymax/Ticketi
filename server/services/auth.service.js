const { User } = require("../models/index.model");
const pi_networkService = require("./pi_network.service");
const sessionStore = require("../middleware/session.middleware");
const { logger } = require("../utils/logger");
const cacheService = require('./cache.service');

class AuthenticationService {

    /**
     * 
     * @param {*} username 
     * @returns user DTO and verification status
     */
    confirmUser = async (username) => {
        console.log(username)
        const user = await User.findOne({
            attributes: ['id', 'is_verified', 'username', 'profileImage'],
            where: { username }
        });
        console.log(user ? user : 'User does not exist')

        if (!user) return { message: 'User doesn\'t exist', error: true, verified: null, user: [] }
        if (!user.dataValues.is_verified) return { user: [], message: 'User not verified', error: true, verified: false }

        return { user: user.toJSON(), message: 'User verified', error: false, verified: true };
    }

    verifyAndCreateUser = async (accessToken, username) => {
        const userData = await pi_networkService.verifyUser(accessToken, username);

        if (!userData.success) return { message: userData.error, error: true, user: null }

        if (!userData.user) return { message: 'User doesn\'t exist', error: true, user: null }
        console.log(accessToken)
        const user = await User.create({
            id: userData.user.id,
            username: userData.user.username,
            accessToken,
            isVerified: true,
            isActive: true,
            lastLogin: new Date()
        });

        if (!user) {
            return { message: 'Unable to create new user', error: true, user: null }
        }

        // Invalidate all user caches when authentication status changes (new user verified)
        const profileCacheKey = `user:profile:${user.id}`;
        const followersCacheKey = `user:followers:${user.id}`;
        await Promise.all([
            cacheService.del(profileCacheKey),
            cacheService.del(followersCacheKey),
            cacheService.deletePattern(`events:organizer:${user.id}:*`)
        ]);
        console.log('Invalidated all user caches for newly verified user:', user.id);

        return { message: 'User created', error: false, user: user.toJSON() }

    }

    /**
     * Create a Redis session for authenticated user
     * @param {Object} user - User object
     * @param {Object} metadata - Additional session metadata (ipAddress, userAgent)
     * @returns {Promise<Object>} Session creation result with sessionId
     */
    createSession = async (user, metadata = {}) => {
        try {
            if (!user || !user.id) {
                logger.error('Session creation failed: user object with id is required');
                return { success: false, sessionId: null, message: 'Invalid user data' };
            }

            // Prepare session data
            const sessionData = {
                userId: user.id,
                username: user.username,
                isVerified: user.is_verified || user.isVerified,
                piWalletAddress: user.piWalletAddress || user.pi_wallet_address,
                ipAddress: metadata.ipAddress || null,
                userAgent: metadata.userAgent || null,
                createdAt: new Date().toISOString()
            };

            // Create session in Redis with 24 hour TTL
            const sessionId = await sessionStore.createSession(sessionData, 86400);

            if (!sessionId) {
                logger.error('Failed to create Redis session for user:', user.id);
                return { success: false, sessionId: null, message: 'Failed to create session' };
            }

            logger.info(`Session created successfully for user ${user.id}: ${sessionId}`);
            return { success: true, sessionId, message: 'Session created' };

        } catch (error) {
            logger.error('Error creating session:', {
                message: error.message,
                stack: error.stack,
                userId: user?.id
            });
            return { success: false, sessionId: null, message: 'Session creation error' };
        }
    }

    /**
     * Validate session from Redis
     * @param {string} sessionId - Session identifier
     * @returns {Promise<Object>} Validation result with session data
     */
    validateSession = async (sessionId) => {
        try {
            if (!sessionId) {
                return { valid: false, session: null, message: 'Session ID required' };
            }

            // Validate and touch session (extends TTL by 3600 seconds)
            const session = await sessionStore.validateSession(sessionId);

            if (!session) {
                logger.debug(`Session validation failed: ${sessionId}`);
                return { valid: false, session: null, message: 'Invalid or expired session' };
            }

            logger.debug(`Session validated successfully: ${sessionId}`);
            return { valid: true, session, message: 'Session valid' };

        } catch (error) {
            logger.error('Error validating session:', {
                message: error.message,
                sessionId
            });
            return { valid: false, session: null, message: 'Session validation error' };
        }
    }

    /**
     * Destroy user session on logout
     * @param {string} sessionId - Session identifier
     * @returns {Promise<Object>} Logout result
     */
    logout = async (sessionId) => {
        try {
            if (!sessionId) {
                return { success: false, message: 'Session ID required' };
            }

            // Destroy session from Redis
            const success = await sessionStore.destroy(sessionId);

            if (!success) {
                logger.warn(`Failed to destroy session: ${sessionId}`);
                return { success: false, message: 'Failed to destroy session' };
            }

            logger.info(`User logged out successfully, session destroyed: ${sessionId}`);
            return { success: true, message: 'Logged out successfully' };

        } catch (error) {
            logger.error('Error during logout:', {
                message: error.message,
                sessionId
            });
            return { success: false, message: 'Logout error' };
        }
    }

    /**
     * Logout user from all devices (destroy all sessions)
     * @param {string} userId - User identifier
     * @returns {Promise<Object>} Logout result with count of destroyed sessions
     */
    logoutAllDevices = async (userId) => {
        try {
            if (!userId) {
                return { success: false, count: 0, message: 'User ID required' };
            }

            // Destroy all sessions for the user
            const count = await sessionStore.destroyByUserId(userId);

            // Invalidate all user caches when authentication status changes (logout from all devices)
            const profileCacheKey = `user:profile:${userId}`;
            const followersCacheKey = `user:followers:${userId}`;
            await Promise.all([
                cacheService.del(profileCacheKey),
                cacheService.del(followersCacheKey),
                cacheService.deletePattern(`events:organizer:${userId}:*`)
            ]);
            logger.info('Invalidated all user caches after logout from all devices for user:', userId);

            logger.info(`User ${userId} logged out from all devices, ${count} sessions destroyed`);
            return { success: true, count, message: `Logged out from ${count} devices` };

        } catch (error) {
            logger.error('Error during logout from all devices:', {
                message: error.message,
                userId
            });
            return { success: false, count: 0, message: 'Logout error' };
        }
    }

}

const AuthService = new AuthenticationService();

module.exports = AuthService;

