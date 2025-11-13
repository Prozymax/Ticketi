const express = require('express');
const profileRouter = express.Router();
const profileController = require('../../controllers/profile.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { uploadSingle } = require('../../middleware/upload.middleware');

// Apply auth middleware to all profile routes
// profileRouter.use(authMiddleware.authenticateToken);

// Get current user's profile
profileRouter.get('/', authenticateToken, profileController.getProfile);

profileRouter.get('/image', authenticateToken, profileController.getProfileImage);

// Update current user's profile
profileRouter.put('/', authenticateToken, profileController.updateProfile);

// Upload profile image
profileRouter.post('/upload-image', authenticateToken, uploadSingle('profileImage'), profileController.uploadProfileImage);

// Get current user's statistics
profileRouter.get('/stats', authenticateToken, profileController.getStats);

module.exports = { profileRouter };