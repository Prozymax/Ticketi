const profileService = require('../services/profile.service');
const { ApiResponse } = require('../utils/response.utils');

class ProfileController {
    /**
     * Get current user's profile
     */
    getProfile = async (req, res) => {
        try {
            const userId = req.user.userId; // From auth middleware

            const result = await profileService.getUserProfile(userId);

            if (result.error) {
                return ApiResponse.error(res, result.message, 404, result.message);
            }

            return ApiResponse.success(res, result.user, result.message, 200);
        } catch (error) {
            console.error('Profile fetch error:', error);
            return ApiResponse.error(res, 'Failed to fetch profile', 500, 'Internal server error');
        }
    }

    /**
     * Update current user's profile
     */
    updateProfile = async (req, res) => {
        try {
            const userId = req.user.userId; // From auth middleware
            const updateData = req.body;

            const result = await profileService.updateUserProfile(userId, updateData);

            if (result.error) {
                return ApiResponse.error(res, result.message, 400, result.message);
            }

            return ApiResponse.success(res, result.user, result.message, 200);
        } catch (error) {
            console.error('Profile update error:', error);
            return ApiResponse.error(res, 'Failed to update profile', 500, 'Internal server error');
        }
    }

    /**
     * Get current user's statistics
     */
    getStats = async (req, res) => {
        try {
            const userId = req.user.userId; // From auth middleware

            const result = await profileService.getUserStats(userId);

            if (result.error) {
                return ApiResponse.error(res, result.message, 404, result.message);
            }

            return ApiResponse.success(res, result.stats, result.message, 200);
        } catch (error) {
            console.error('Stats fetch error:', error);
            return ApiResponse.error(res, 'Failed to fetch stats', 500, 'Internal server error');
        }
    }
}

module.exports = new ProfileController();