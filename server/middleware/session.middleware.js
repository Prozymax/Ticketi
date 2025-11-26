const crypto = require('crypto');
const cacheService = require('../services/cache.service');
const { logger } = require('../utils/logger');

/**
 * RedisSessionStore - Manages user sessions in Redis
 * Provides session lifecycle management with TTL and multi-session support
 */
class RedisSessionStore {
    constructor() {
        this.defaultTTL = 86400; // 24 hours in seconds
        this.sessionKeyPrefix = 'session:';
        this.userSessionsKeyPrefix = 'sessions:user:';
    }

    /**
     * Generate a secure session ID
     * @returns {string} Cryptographically random session ID
     */
    generateSessionId() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Get session key format
     * @param {string} sessionId - Session identifier
     * @returns {string} Formatted session key
     */
    getSessionKey(sessionId) {
        return `${this.sessionKeyPrefix}${sessionId}`;
    }

    /**
     * Get user sessions key format
     * @param {string} userId - User identifier
     * @returns {string} Formatted user sessions key
     */
    getUserSessionsKey(userId) {
        return `${this.userSessionsKeyPrefix}${userId}`;
    }

    /**
     * Get session from Redis
     * @param {string} sessionId - Session identifier
     * @returns {Promise<Object|null>} Session data or null if not found
     */
    async get(sessionId) {
        try {
            if (!sessionId) {
                logger.warn('Session get: sessionId is required');
                return null;
            }

            const sessionKey = this.getSessionKey(sessionId);
            const sessionData = await cacheService.get(sessionKey);

            if (!sessionData) {
                logger.debug(`Session not found: ${sessionId}`);
                return null;
            }

            logger.debug(`Session retrieved: ${sessionId}`);
            return sessionData;

        } catch (error) {
            logger.error(`Failed to get session ${sessionId}:`, {
                message: error.message,
                stack: error.stack
            });
            return null;
        }
    }

    /**
     * Set session in Redis with TTL
     * @param {string} sessionId - Session identifier
     * @param {Object} session - Session data to store
     * @param {number} ttl - Time to live in seconds (default: 86400)
     * @returns {Promise<boolean>} Success status
     */
    async set(sessionId, session, ttl = this.defaultTTL) {
        try {
            if (!sessionId) {
                logger.warn('Session set: sessionId is required');
                return false;
            }

            if (!session || typeof session !== 'object') {
                logger.warn('Session set: session data must be an object');
                return false;
            }

            const sessionKey = this.getSessionKey(sessionId);
            
            // Add metadata to session
            const sessionWithMetadata = {
                ...session,
                sessionId,
                createdAt: session.createdAt || new Date().toISOString(),
                lastActivity: new Date().toISOString()
            };

            // Store session in Redis
            const success = await cacheService.set(sessionKey, sessionWithMetadata, ttl);

            if (success && session.userId) {
                // Add session to user's session list
                await this.addSessionToUserList(session.userId, sessionId, ttl);
            }

            if (success) {
                logger.info(`Session created: ${sessionId} (TTL: ${ttl}s)`);
            }

            return success;

        } catch (error) {
            logger.error(`Failed to set session ${sessionId}:`, {
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    /**
     * Destroy session from Redis
     * @param {string} sessionId - Session identifier
     * @returns {Promise<boolean>} Success status
     */
    async destroy(sessionId) {
        try {
            if (!sessionId) {
                logger.warn('Session destroy: sessionId is required');
                return false;
            }

            // Get session to find userId before deleting
            const session = await this.get(sessionId);
            
            const sessionKey = this.getSessionKey(sessionId);
            const success = await cacheService.del(sessionKey);

            if (success && session && session.userId) {
                // Remove session from user's session list
                await this.removeSessionFromUserList(session.userId, sessionId);
            }

            if (success) {
                logger.info(`Session destroyed: ${sessionId}`);
            }

            return success;

        } catch (error) {
            logger.error(`Failed to destroy session ${sessionId}:`, {
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    /**
     * Touch session to extend TTL
     * @param {string} sessionId - Session identifier
     * @param {number} extensionSeconds - Seconds to extend TTL by (default: 3600)
     * @returns {Promise<boolean>} Success status
     */
    async touch(sessionId, extensionSeconds = 3600) {
        try {
            if (!sessionId) {
                logger.warn('Session touch: sessionId is required');
                return false;
            }

            // Get current session
            const session = await this.get(sessionId);
            
            if (!session) {
                logger.debug(`Session touch: session not found ${sessionId}`);
                return false;
            }

            // Update last activity timestamp
            session.lastActivity = new Date().toISOString();

            // Get current TTL
            const sessionKey = this.getSessionKey(sessionId);
            const currentTTL = await cacheService.ttl(sessionKey);

            // Calculate new TTL (current + extension)
            const newTTL = currentTTL > 0 ? currentTTL + extensionSeconds : this.defaultTTL;

            // Update session with new TTL
            const success = await cacheService.set(sessionKey, session, newTTL);

            if (success) {
                logger.debug(`Session touched: ${sessionId} (new TTL: ${newTTL}s)`);
            }

            return success;

        } catch (error) {
            logger.error(`Failed to touch session ${sessionId}:`, {
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    /**
     * Add session to user's session list
     * @param {string} userId - User identifier
     * @param {string} sessionId - Session identifier
     * @param {number} ttl - Time to live in seconds
     * @returns {Promise<boolean>} Success status
     * @private
     */
    async addSessionToUserList(userId, sessionId, ttl) {
        try {
            const userSessionsKey = this.getUserSessionsKey(userId);
            
            // Get existing sessions
            let sessions = await cacheService.get(userSessionsKey) || [];
            
            // Add new session if not already present
            if (!sessions.includes(sessionId)) {
                sessions.push(sessionId);
                await cacheService.set(userSessionsKey, sessions, ttl);
                logger.debug(`Added session ${sessionId} to user ${userId} session list`);
            }

            return true;

        } catch (error) {
            logger.error(`Failed to add session to user list for user ${userId}:`, {
                message: error.message
            });
            return false;
        }
    }

    /**
     * Remove session from user's session list
     * @param {string} userId - User identifier
     * @param {string} sessionId - Session identifier
     * @returns {Promise<boolean>} Success status
     * @private
     */
    async removeSessionFromUserList(userId, sessionId) {
        try {
            const userSessionsKey = this.getUserSessionsKey(userId);
            
            // Get existing sessions
            let sessions = await cacheService.get(userSessionsKey) || [];
            
            // Remove session
            sessions = sessions.filter(id => id !== sessionId);
            
            if (sessions.length > 0) {
                await cacheService.set(userSessionsKey, sessions, this.defaultTTL);
            } else {
                // Delete the key if no sessions remain
                await cacheService.del(userSessionsKey);
            }

            logger.debug(`Removed session ${sessionId} from user ${userId} session list`);
            return true;

        } catch (error) {
            logger.error(`Failed to remove session from user list for user ${userId}:`, {
                message: error.message
            });
            return false;
        }
    }

    /**
     * Destroy all sessions for a user
     * @param {string} userId - User identifier
     * @returns {Promise<number>} Number of sessions destroyed
     */
    async destroyByUserId(userId) {
        try {
            if (!userId) {
                logger.warn('Session destroyByUserId: userId is required');
                return 0;
            }

            // Get all sessions for the user
            const sessions = await this.getAllSessions(userId);
            
            if (!sessions || sessions.length === 0) {
                logger.debug(`No sessions found for user ${userId}`);
                return 0;
            }

            // Delete all sessions
            let destroyedCount = 0;
            for (const sessionId of sessions) {
                const success = await this.destroy(sessionId);
                if (success) {
                    destroyedCount++;
                }
            }

            // Delete user sessions list
            const userSessionsKey = this.getUserSessionsKey(userId);
            await cacheService.del(userSessionsKey);

            logger.info(`Destroyed ${destroyedCount} sessions for user ${userId}`);
            return destroyedCount;

        } catch (error) {
            logger.error(`Failed to destroy sessions for user ${userId}:`, {
                message: error.message,
                stack: error.stack
            });
            return 0;
        }
    }

    /**
     * Get all session IDs for a user
     * @param {string} userId - User identifier
     * @returns {Promise<string[]>} Array of session IDs
     */
    async getAllSessions(userId) {
        try {
            if (!userId) {
                logger.warn('Session getAllSessions: userId is required');
                return [];
            }

            const userSessionsKey = this.getUserSessionsKey(userId);
            const sessions = await cacheService.get(userSessionsKey);

            if (!sessions || !Array.isArray(sessions)) {
                logger.debug(`No sessions found for user ${userId}`);
                return [];
            }

            logger.debug(`Found ${sessions.length} sessions for user ${userId}`);
            return sessions;

        } catch (error) {
            logger.error(`Failed to get sessions for user ${userId}:`, {
                message: error.message,
                stack: error.stack
            });
            return [];
        }
    }

    /**
     * Create a new session with generated session ID
     * @param {Object} sessionData - Session data (must include userId)
     * @param {number} ttl - Time to live in seconds (default: 86400)
     * @returns {Promise<string|null>} Session ID or null on failure
     */
    async createSession(sessionData, ttl = this.defaultTTL) {
        try {
            if (!sessionData || !sessionData.userId) {
                logger.warn('Session createSession: sessionData with userId is required');
                return null;
            }

            const sessionId = this.generateSessionId();
            const success = await this.set(sessionId, sessionData, ttl);

            if (success) {
                logger.info(`New session created for user ${sessionData.userId}: ${sessionId}`);
                return sessionId;
            }

            return null;

        } catch (error) {
            logger.error('Failed to create session:', {
                message: error.message,
                stack: error.stack
            });
            return null;
        }
    }

    /**
     * Validate session and return session data
     * @param {string} sessionId - Session identifier
     * @returns {Promise<Object|null>} Session data if valid, null otherwise
     */
    async validateSession(sessionId) {
        try {
            if (!sessionId) {
                return null;
            }

            const session = await this.get(sessionId);
            
            if (!session) {
                logger.debug(`Session validation failed: session not found ${sessionId}`);
                return null;
            }

            // Touch session to extend TTL on validation
            await this.touch(sessionId);

            logger.debug(`Session validated: ${sessionId}`);
            return session;

        } catch (error) {
            logger.error(`Failed to validate session ${sessionId}:`, {
                message: error.message
            });
            return null;
        }
    }
}

// Export singleton instance
module.exports = new RedisSessionStore();
