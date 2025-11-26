const { Followers, User } = require('../models/index.model');
const cacheService = require('./cache.service');

class FollowService {
    /**
     * Follow a user
     * @param {string} followerId - ID of the user who wants to follow
     * @param {string} followingId - ID of the user to be followed
     * @returns {Object} follow result
     */
    followUser = async (followerId, followingId) => {
        try {
            // Check if user is trying to follow themselves
            if (followerId === followingId) {
                return {
                    error: true,
                    message: 'Cannot follow yourself',
                    data: null
                };
            }

            // Check if already following
            const existingFollow = await Followers.findOne({
                where: {
                    followerId,
                    followingId
                }
            });

            if (existingFollow) {
                return {
                    error: true,
                    message: 'Already following this user',
                    data: null
                };
            }

            // Create follow relationship
            const follow = await Followers.create({
                followerId,
                followingId
            });

            // Invalidate follower count cache for both users
            const followerCacheKey = `user:followers:${followingId}`;
            const followingCacheKey = `user:followers:${followerId}`;
            await Promise.all([
                cacheService.del(followerCacheKey),
                cacheService.del(followingCacheKey)
            ]);
            console.log('Invalidated follower count cache for users:', followerId, followingId);

            // Also invalidate profile cache for both users to update follower counts
            const profileCacheKey1 = `user:profile:${followingId}`;
            const profileCacheKey2 = `user:profile:${followerId}`;
            await Promise.all([
                cacheService.del(profileCacheKey1),
                cacheService.del(profileCacheKey2)
            ]);

            return {
                error: false,
                message: 'Successfully followed user',
                data: follow.toJSON()
            };
        } catch (error) {
            console.error('Error following user:', error);
            return {
                error: true,
                message: 'Failed to follow user',
                data: null
            };
        }
    }

    /**
     * Unfollow a user
     * @param {string} followerId - ID of the user who wants to unfollow
     * @param {string} followingId - ID of the user to be unfollowed
     * @returns {Object} unfollow result
     */
    unfollowUser = async (followerId, followingId) => {
        try {
            const follow = await Followers.findOne({
                where: {
                    followerId,
                    followingId
                }
            });

            if (!follow) {
                return {
                    error: true,
                    message: 'Not following this user',
                    data: null
                };
            }

            await follow.destroy();

            // Invalidate follower count cache for both users
            const followerCacheKey = `user:followers:${followingId}`;
            const followingCacheKey = `user:followers:${followerId}`;
            await Promise.all([
                cacheService.del(followerCacheKey),
                cacheService.del(followingCacheKey)
            ]);
            console.log('Invalidated follower count cache for users:', followerId, followingId);

            // Also invalidate profile cache for both users to update follower counts
            const profileCacheKey1 = `user:profile:${followingId}`;
            const profileCacheKey2 = `user:profile:${followerId}`;
            await Promise.all([
                cacheService.del(profileCacheKey1),
                cacheService.del(profileCacheKey2)
            ]);

            return {
                error: false,
                message: 'Successfully unfollowed user',
                data: null
            };
        } catch (error) {
            console.error('Error unfollowing user:', error);
            return {
                error: true,
                message: 'Failed to unfollow user',
                data: null
            };
        }
    }

    /**
     * Check if user is following another user
     * @param {string} followerId - ID of the follower
     * @param {string} followingId - ID of the user being followed
     * @returns {Object} follow status
     */
    isFollowing = async (followerId, followingId) => {
        try {
            const follow = await Followers.findOne({
                where: {
                    followerId,
                    followingId
                }
            });

            return {
                error: false,
                message: 'Follow status retrieved successfully',
                data: {
                    isFollowing: !!follow
                }
            };
        } catch (error) {
            console.error('Error checking follow status:', error);
            return {
                error: true,
                message: 'Failed to check follow status',
                data: null
            };
        }
    }

    /**
     * Get user's followers
     * @param {string} userId - ID of the user
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Object} followers list
     */
    getFollowers = async (userId, page = 1, limit = 10) => {
        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await Followers.findAndCountAll({
                where: { followingId: userId },
                include: [{
                    model: User,
                    as: 'followerUser',
                    attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage']
                }],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return {
                error: false,
                message: 'Followers retrieved successfully',
                data: {
                    followers: rows.map(follow => follow.followerUser),
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(count / limit)
                    }
                }
            };
        } catch (error) {
            console.error('Error getting followers:', error);
            return {
                error: true,
                message: 'Failed to get followers',
                data: null
            };
        }
    }

    /**
     * Get users that a user is following
     * @param {string} userId - ID of the user
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Object} following list
     */
    getFollowing = async (userId, page = 1, limit = 10) => {
        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await Followers.findAndCountAll({
                where: { followerId: userId },
                include: [{
                    model: User,
                    as: 'followedUser',
                    attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage']
                }],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return {
                error: false,
                message: 'Following list retrieved successfully',
                data: {
                    following: rows.map(follow => follow.followedUser),
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(count / limit)
                    }
                }
            };
        } catch (error) {
            console.error('Error getting following list:', error);
            return {
                error: true,
                message: 'Failed to get following list',
                data: null
            };
        }
    }
}

module.exports = new FollowService();