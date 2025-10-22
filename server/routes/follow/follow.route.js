const express = require('express');
const router = express.Router();
const FollowController = require('../../controllers/follow.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');

// Follow routes
router.post('/follow', authenticateToken, FollowController.followUser);
router.delete('/unfollow/:followingId', authenticateToken, FollowController.unfollowUser);
router.get('/status/:userId', authenticateToken, FollowController.checkFollowStatus);
router.get('/followers/:userId', FollowController.getFollowers);
router.get('/following/:userId', FollowController.getFollowing);

module.exports = { followRouter: router };