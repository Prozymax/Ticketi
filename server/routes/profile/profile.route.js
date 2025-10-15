const express = require('express');
const profileRouter = express.Router();
const profileController = require('../../controllers/profile.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Apply auth middleware to all profile routes
// profileRouter.use(authMiddleware.authenticateToken);

// Get current user's profile
profileRouter.get('/', profileController.getProfile);

// Update current user's profile
profileRouter.put('/', profileController.updateProfile);

// Get current user's statistics
profileRouter.get('/stats', profileController.getStats);

module.exports = { profileRouter };