const bufferGen = require("../utils/buffer_gen.utils");
const { ApiResponse } = require("../utils/response.utils")
const jwt = require('jsonwebtoken');
const tokenService = require("../utils/token.utils");


class AuthController {

    login = async (response, userData) => {
        try {
            const fullUser = userData;


            if (!fullUser) {
                return ApiResponse.error(response, 'User not found', 404, 'User not found');
            }

            // Create JWT token for the user
            const payload = {
                userId: fullUser.id,
                username: fullUser.username,
                piWalletAddress: fullUser.piWalletAddress || fullUser.pi_wallet_address,
                accessToken: fullUser.access_token
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
                    token
                }
            };

            return ApiResponse.success(response, responseData, 'User authenticated successfully', 200);
        } catch (error) {
            console.error('Error setting authentication cookie:', error);
            return ApiResponse.error(response, 'Authentication failed', 500, 'Failed to set authentication');
        }
    }
}

module.exports = new AuthController()