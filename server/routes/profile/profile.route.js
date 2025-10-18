const express = require('express');
const profileRouter = express.Router();
const profileController = require('../../controllers/profile.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');

// Apply auth middleware to all profile routes
// profileRouter.use(authMiddleware.authenticateToken);

// Get current user's profile
profileRouter.get('/', authenticateToken, profileController.getProfile);

// Update current user's profile
profileRouter.put('/', authenticateToken, profileController.updateProfile);

// Get current user's statistics
profileRouter.get('/stats', authenticateToken, profileController.getStats);

module.exports = { profileRouter };