const { User } = require("../models/index.model");
const pi_networkService = require("./pi_network.service");

class AuthenticationService {

    /**
     * 
     * @param {*} username 
     * @returns user DTO and verification status
     */
    confirmUser = async (username) => {
        console.log(username)
        const user = await User.findOne({
            attributes: ['id', 'is_verified', 'username', 'profileImage'],
            where: { username }
        });
        console.log(user ? user : 'User does not exist')

        if (!user) return { message: 'User doesn\'t exist', error: true, verified: null, user: [] }
        if (!user.dataValues.is_verified) return { user: [], message: 'User not verified', error: true, verified: false }

        return { user: user.toJSON(), message: 'User verified', error: false, verified: true };
    }

    verifyAndCreateUser = async (accessToken, username) => {
        const userData = await pi_networkService.verifyUser(accessToken, username);

        if (!userData.success) return { message: userData.error, error: true, user: null }

        if (!userData.user) return { message: 'User doesn\'t exist', error: true, user: null }
        console.log(accessToken)
        const user = await User.create({
            id: userData.user.id,
            username: userData.user.username,
            accessToken,
            isVerified: true,
            isActive: true,
            lastLogin: new Date()
        });

        if(!user) {
            return { message: 'Unable to create new user', error: true , user: null}
        }

        return { message: 'User created', error: false, user: user.toJSON() }

    }

}

const AuthService = new AuthenticationService();

module.exports = AuthService;

