const bufferGen = require("../utils/buffer_gen.utils");
const { ApiResponse } = require("../utils/response.utils")
const jwt = require('jsonwebtoken');
const tokenService = require("../utils/token.utils");
const AuthService = require("../services/auth.service");


class AuthController {

    login = async (response, userData, req = null) => {
        try {
            const fullUser = userData;


            if (!fullUser) {
                return ApiResponse.error(response, 'User not found', 404, 'User not found');
            }

            // Create Redis session for the user
            const sessionMetadata = {
                ipAddress: req?.ip || req?.connection?.remoteAddress || null,
                userAgent: req?.headers['user-agent'] || null
            };

            const sessionResult = await AuthService.createSession(fullUser, sessionMetadata);

            if (!sessionResult.success) {
                console.error('Failed to create session:', sessionResult.message);
                // Continue with login even if session creation fails (graceful degradation)
            }

            // Create JWT token for the user
            const payload = {
                userId: fullUser.id,
                username: fullUser.username,
                piWalletAddress: fullUser.piWalletAddress || fullUser.pi_wallet_address,
                accessToken: fullUser.access_token,
                sessionId: sessionResult.sessionId || null // Include session ID in token
            };

            console.log(payload)

            const { error, message, token } = tokenService.generateAuthToken(JSON.stringify(payload))
            if(error) return ApiResponse.error(response, message, 500)

            // Return user data without sensitive information
            const responseData = {
                success: true,
                user: {
                    id: fullUser.id,
                    username: fullUser.username,
                    piWalletAddress: fullUser.piWalletAddress || fullUser.pi_wallet_address,
                    isVerified: fullUser.is_verified,
                    token,
                    sessionId: sessionResult.sessionId || null
                }
            };

            return ApiResponse.success(response, responseData, 'User authenticated successfully', 200);
        } catch (error) {
            console.error('Error setting authentication cookie:', error);
            return ApiResponse.error(response, 'Authentication failed', 500, 'Failed to set authentication');
        }
    }

    logout = async (req, res) => {
        try {
            // Extract session ID from token
            const { token: userToken } = tokenService.getAuthToken(req);
            
            if (!userToken) {
                return ApiResponse.error(res, 'No active session', 401, 'Not authenticated');
            }

            const userDataObject = bufferGen.decodeBase64(userToken);
            const userData = typeof(userDataObject) === 'string' ? JSON.parse(userDataObject) : userDataObject;

            if (userData.sessionId) {
                // Destroy Redis session
                const logoutResult = await AuthService.logout(userData.sessionId);
                
                if (!logoutResult.success) {
                    console.error('Failed to destroy session:', logoutResult.message);
                }
            }

            return ApiResponse.success(res, { success: true }, 'Logged out successfully', 200);

        } catch (error) {
            console.error('Error during logout:', error);
            return ApiResponse.error(res, 'Logout failed', 500, 'Failed to logout');
        }
    }
}

module.exports = new AuthController()
