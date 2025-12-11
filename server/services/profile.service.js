const { User } = require("../models/index.model");
const cacheService = require('./cache.service');
const { logger } = require('../utils/logger');

class ProfileService {
    /**
     * Get user profile by ID
     * @param {string} userId 
     * @returns {Object} user profile data
     */
    getUserProfile = async (userId) => {
        try {
            // Cache key for user profile
            const profileCacheKey = `user:profile:${userId}`;

            // Try to get from cache first (cache-aside pattern)
            const cachedProfile = await cacheService.get(profileCacheKey);
            if (cachedProfile) {
                logger.debug('User profile retrieved from cache:', userId);
                return {
                    error: false,
                    message: 'Profile retrieved successfully',
                    user: cachedProfile
                };
            }

            // Cache miss - fetch from database
            const user = await User.findByPk(userId, {
                attributes: [
                    'id',
                    'username',
                    'email',
                    'profileImage',
                    'isVerified',
                    'lastLogin',
                    'createdAt'
                ],
                include: [
                    {
                        association: 'followers',
                        attributes: ['id'],
                        required: false
                    },
                    {
                        association: 'following',
                        attributes: ['id'],
                        required: false
                    }
                ]
            });

            if (!user) {
                return { error: true, message: 'User not found', user: [] };
            }

            const followersCount = user.followers ? user.followers.length : 0;
            const followingCount = user.following ? user.following.length : 0;

            const userWithStats = {
                ...user.toJSON(),
                followersCount,
                followingCount
            };

            // Remove the followers and following arrays from the response to keep it clean
            delete userWithStats.followers;
            delete userWithStats.following;

            logger.debug('User profile fetched from database:', userId);

            // Store in cache with 1800 second TTL (30 minutes)
            await cacheService.set(profileCacheKey, userWithStats, 1800);

            // Also cache follower count separately with 300 second TTL (5 minutes)
            const followersCacheKey = `user:followers:${userId}`;
            await cacheService.set(followersCacheKey, {
                followersCount,
                followingCount
            }, 300);

            return {
                error: false,
                message: 'Profile retrieved successfully',
                user: userWithStats
            };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return {
                error: true,
                message: 'Failed to fetch profile',
                user: null
            };
        }
    }

    getProfileImage = async (userId) => {
        try {
            if (!userId) return { error: true, message: 'User not found', user: [] }
            const user = await User.findByPk(userId, {
                attributes: ['profileImage']
            });
            if (!user) {
                return { error: true, message: 'User not found', user: [] };
            }
            logger.debug('Profile image retrieved for user:', userId);
            return {
                error: false,
                message: 'Profile retrieved successfully',
                user: user
            };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return {
                error: true,
                message: 'Failed to fetch profile',
                user: null
            };
        }
    }

    /**
     * Update user profile
     * @param {string} userId 
     * @param {Object} updateData 
     * @returns {Object} updated user profile
     */
    updateUserProfile = async (userId, updateData) => {
        try {
            const allowedFields = [
                'email',
                'firstName',
                'lastName',
                'profileImage'
            ];

            // Filter only allowed fields
            const filteredData = {};
            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key)) {
                    filteredData[key] = updateData[key];
                }
            });

            const [updatedRowsCount] = await User.update(filteredData, {
                where: { id: userId }
            });

            if (updatedRowsCount === 0) {
                return { error: true, message: 'User not found or no changes made', user: null };
            }

            // Fetch updated user
            const updatedUser = await User.findByPk(userId, {
                attributes: [
                    'id',
                    'username',
                    'email',
                    'firstName',
                    'lastName',
                    'piWalletAddress',
                    'profileImage',
                    'isVerified',
                    'lastLogin',
                    'createdAt'
                ]
            });

            // Invalidate user profile cache
            const profileCacheKey = `user:profile:${userId}`;
            await cacheService.del(profileCacheKey);
            logger.info('✅ Profile cache invalidated after update', { userId });

            return {
                error: false,
                message: 'Profile updated successfully',
                user: updatedUser.toJSON()
            };
        } catch (error) {
            console.error('Error updating user profile:', error);
            return {
                error: true,
                message: 'Failed to update profile',
                user: null
            };
        }
    }

    /**
     * Get user statistics (events created, tickets purchased, etc.)
     * @param {string} userId 
     * @returns {Object} user statistics
     */
    getUserStats = async (userId) => {
        try {
            // This would require additional models for events, purchases, etc.
            // For now, return basic stats
            const stats = {
                eventsCreated: 0,
                ticketsPurchased: 0,
                totalSpent: 0,
                joinDate: null
            };

            const user = await User.findByPk(userId, {
                attributes: ['createdAt']
            });

            if (user) {
                stats.joinDate = user.createdAt;
            }

            return {
                error: false,
                message: 'Stats retrieved successfully',
                stats
            };
        } catch (error) {
            console.error('Error fetching user stats:', error);
            return {
                error: true,
                message: 'Failed to fetch stats',
                stats: null
            };
        }
    }

    /**
     * Upload profile image
     * @param {string} userId 
     * @param {string} filename 
     * @returns {Object} updated user profile
     */
    uploadProfileImage = async (userId, fileBuffer, filename, mimetype) => {
        try {
            const s3Service = require('./s3.service');

            // Get current user to check for existing profile image
            const user = await User.findByPk(userId);

            if (!user) {
                return { error: true, message: 'User not found', user: null };
            }

            // Delete old profile image from S3 if it exists
            if (user.profileImage && (user.profileImage.includes('s3') || user.profileImage.includes('railway'))) {
                try {
                    await s3Service.deleteFile(user.profileImage);
                    logger.info('✅ Deleted old profile image from S3', { userId });
                } catch (deleteError) {
                    console.error('Error deleting old profile image:', deleteError);
                    // Continue even if deletion fails
                }
            }

            // Upload to S3
            const uploadResult = await s3Service.uploadFile(
                fileBuffer,
                filename,
                mimetype,
                'profiles' // Store in profiles folder
            );

            if (!uploadResult.success) {
                return {
                    error: true,
                    message: 'Failed to upload image to S3',
                    user: null
                };
            }

            // Update user with new profile image URL from S3
            const profileImageUrl = uploadResult.url;

            await user.update({
                profileImage: profileImageUrl
            });

            // Fetch updated user with all profile data
            const updatedUser = await User.findByPk(userId, {
                attributes: [
                    'id',
                    'username',
                    'email',
                    'firstName',
                    'lastName',
                    'piWalletAddress',
                    'profileImage',
                    'isVerified',
                    'lastLogin',
                    'createdAt'
                ],
                include: [
                    {
                        association: 'followers',
                        attributes: ['id'],
                        required: false
                    },
                    {
                        association: 'following',
                        attributes: ['id'],
                        required: false
                    }
                ]
            });

            const followersCount = updatedUser.followers ? updatedUser.followers.length : 0;
            const followingCount = updatedUser.following ? updatedUser.following.length : 0;

            const userWithStats = {
                ...updatedUser.toJSON(),
                followersCount,
                followingCount
            };

            delete userWithStats.followers;
            delete userWithStats.following;

            // Invalidate user profile cache
            const profileCacheKey = `user:profile:${userId}`;
            await cacheService.del(profileCacheKey);
            logger.info('✅ Profile image uploaded successfully - cache invalidated', { userId });

            return {
                error: false,
                message: 'Profile image uploaded successfully',
                user: userWithStats
            };
        } catch (error) {
            console.error('Error uploading profile image:', error);
            return {
                error: true,
                message: 'Failed to upload profile image',
                user: null
            };
        }
    }
}

module.exports = new ProfileService();
