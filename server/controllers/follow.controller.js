const followService = require('../services/follow.service');
const { ApiResponse } = require('../utils/response.utils');

class FollowController {
    followUser = async (req, res) => {
        try {
            const followerId = req.user.id;
            const { followingId } = req.body;

            if (!followingId) {
                return ApiResponse.error(res, 'Following user ID is required', 400);
            }

            const result = await followService.followUser(followerId, followingId);

            if (result.error) {
                return ApiResponse.error(res, result.message, 400);
            }

            return ApiResponse.success(res, result.data, result.message, 201);
        } catch (error) {
            console.error('Error in followUser controller:', error);
            return ApiResponse.error(res, 'Internal server error', 500);
        }
    }

    unfollowUser = async (req, res) => {
        try {
            const followerId = req.user.id;
            const { followingId } = req.params;

            if (!followingId) {
                return ApiResponse.error(res, 'Following user ID is required', 400);
            }

            const result = await followService.unfollowUser(followerId, followingId);

            if (result.error) {
                return ApiResponse.error(res, result.message, 400);
            }

            return ApiResponse.success(res, null, result.message, 200);
        } catch (error) {
            console.error('Error in unfollowUser controller:', error);
            return ApiResponse.error(res, 'Internal server error', 500);
        }
    }

    checkFollowStatus = async (req, res) => {
        try {
            const followerId = req.user.id;
            const { userId } = req.params;

            if (!userId) {
                return ApiResponse.error(res, 'User ID is required', 400);
            }

            const result = await followService.isFollowing(followerId, userId);

            if (result.error) {
                return ApiResponse.error(res, result.message, 500);
            }

            return ApiResponse.success(res, result.data, result.message, 200);
        } catch (error) {
            console.error('Error in checkFollowStatus controller:', error);
            return ApiResponse.error(res, 'Internal server error', 500);
        }
    }

    getFollowers = async (req, res) => {
        try {
            const { userId } = req.params;
            const { page, limit } = req.query;

            if (!userId) {
                return ApiResponse.error(res, 'User ID is required', 400);
            }

            const result = await followService.getFollowers(userId, page, limit);

            if (result.error) {
                return ApiResponse.error(res, result.message, 500);
            }

            return ApiResponse.success(res, result.data, result.message, 200);
        } catch (error) {
            console.error('Error in getFollowers controller:', error);
            return ApiResponse.error(res, 'Internal server error', 500);
        }
    }

    getFollowing = async (req, res) => {
        try {
            const { userId } = req.params;
            const { page, limit } = req.query;

            if (!userId) {
                return ApiResponse.error(res, 'User ID is required', 400);
            }

            const result = await followService.getFollowing(userId, page, limit);

            if (result.error) {
                return ApiResponse.error(res, result.message, 500);
            }

            return ApiResponse.success(res, result.data, result.message, 200);
        } catch (error) {
            console.error('Error in getFollowing controller:', error);
            return ApiResponse.error(res, 'Internal server error', 500);
        }
    }
}

module.exports = new FollowController();