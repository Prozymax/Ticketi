const bufferGen = require("../utils/buffer_gen.utils");
const cookieService = require("../utils/cookieService");
const { ApiResponse } = require("../utils/response.utils")
const jwt = require('jsonwebtoken');


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

            const encryptedDataToken = bufferGen.encodeBase64(JSON.stringify(payload))

            const jwtToken = jwt.sign({ data: encryptedDataToken }, process.env.JWT_SECRET, { expiresIn: '24h' });

            // Set secure encrypted cookie with the JWT token
            cookieService.setAuthCookieWithExpiry(response, jwtToken, 24 * 60 * 60); // 24 hours in seconds

            // Return user data without sensitive information
            const responseData = {
                success: true,
                user: {
                    id: fullUser.id,
                    username: fullUser.username,
                    piWalletAddress: fullUser.piWalletAddress || fullUser.pi_wallet_address,
                    isVerified: fullUser.is_verified,
                    firstName: fullUser.first_name,
                    lastName: fullUser.last_name
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