const { User } = require("../models/index.model");

class ProfileService {
    /**
     * Get user profile by ID
     * @param {string} userId 
     * @returns {Object} user profile data
     */
    getUserProfile = async (userId) => {
        console.log('userid', userId)
        try {
            const user = await User.findByPk(userId, {
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

            console.log('User profile with stats:', userWithStats);

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
}

module.exports = new ProfileService();