const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db.config');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    piWalletAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        field: 'pi_wallet_address'
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'first_name'
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'last_name'
    },
    accessToken: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'access_token'
    },
    profileImage: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'profile_image'
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login'
    }
}, {
    tableName: 'users',
    timestamps: true,
    underscored: true
});

module.exports = User;