require('dotenv').config()
const express = require('express');
const authRouter = express.Router();
authRouter.use(express.json());
const { ApiResponse } = require('../../utils/response.utils.js');
const AuthService = require('../../services/auth.service.js');
const authController = require('../../controllers/auth.controller.js');
const { User } = require('../../models/index.model.js');
const { authenticateToken } = require('../../middleware/auth.middleware.js');

// Health check endpoint
authRouter.get('/', async (req, response) => {
    return response.status(200).json({
        message: 'Auth API is working',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

authRouter.get('/confirm-username', async (request, response) => {
    const { username } = request.query;
    const user = await AuthService.confirmUser(username);
    if (user.error) {
        return ApiResponse.error(response, user.message, 403, user.message);
    }
    return ApiResponse.success(response, user.user, user.message, 200);

})

authRouter.post('/authenticate', async (request, response) => {
    const { username, accessToken } = request.body;
    console.log(request.body)

    if (!username) {
        return ApiResponse.error(response, 'Username not found', 403, 'Username not found');
    }

    try {
        const userVerified = await AuthService.confirmUser(username);
        // TODO: Not everytime user gets a new token fix
        if (userVerified.error) {
            console.log(userVerified.message)
            // User doesn't exist, create new user
            const { error, message, user } = await AuthService.verifyAndCreateUser(accessToken, username);

            if (error) { 
                console.error('Error creating user:', message);
                return ApiResponse.error(response, message, 403, message);
            }

            // Login with newly created user
            return await authController.login(response, user);
        } else {
            // User exists, login with existing user
            await User.update({
                lastLogin: new Date(),
                accessToken
            },
                { where: { username } }
            );
            return await authController.login(response, userVerified.user);
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return ApiResponse.error(response, 'Authentication failed', 500, 'Failed to authenticate user');
    }
})

// Logout endpoint to clear cookies
authRouter.post('/logout', (request, response) => {
    try {
        return ApiResponse.success(response, null, 'Logged out successfully', 200);
    } catch (error) {
        console.error('Logout error:', error);
        return ApiResponse.error(response, 'Logout failed', 500, 'Failed to logout');
    }
})


module.exports = { authRouter };