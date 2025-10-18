const jwt = require('jsonwebtoken');
const bufferGen = require('./buffer_gen.utils');

class TokensService {

    generateAuthToken(payload) {
        try {
            const encryptedPayload = bufferGen.encodeBase64(payload)
            const token = jwt.sign({ data: encryptedPayload }, process.env.JWT_SECRET, { expiresIn: '1d' });
            return { token, error: false, message: 'Token generated' };
        } catch (error) {
            console.error('Error generating auth token:', error);
            return { error: true, token: null, message: 'Error generating token' };
        }
    }

    getAuthToken(req) {
        try {
            if (!req.headers['x-access-token']) {
                console.log('❌ Access Token header');
                return { message: 'Access token header missing', token: null, error: true, expired: false };
            }

            const jwtToken = req.headers['x-access-token']

            if (jwtToken === 'undefined' || !jwtToken) {
                console.log('❌ Access token not found');
                return { message: 'Invalid access token', token: null, error: true, expired: false };
            }

            console.log('✅ Access token found, decoding...');

            // verify jwt token
            const jwtData = jwt.verify(jwtToken, process.env.JWT_SECRET)

            const encodedToken = jwtData.data;

            return { message: 'Token found', token: encodedToken, error: false, expired: false };
        } catch (error) {
            console.error('Error getting auth token from cookie:', error);
            if (jwt.JsonWebTokenError) {
                console.log('❌ Invalid access token');
                return { message: 'Invalid access token', token: null, error: true, expired: true };
            }
            return { message: error.message, token: null, error: true, expired: false };

        }
    }
}

const tokenService = new TokensService();

module.exports = tokenService;