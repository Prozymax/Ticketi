const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db.config.js');
const User = require('../user/user.model.js');

const Auth = sequelize.define('Auth', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    provider: {
        type: DataTypes.ENUM('pi', 'local', 'google'),
        defaultValue: 'pi',
    },
    access_token: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    last_login: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: true,
    tableName: 'auth',
});

// Define relationships
Auth.belongsTo(User, { 
    foreignKey: 'user_uuid', 
    targetKey: 'id',
    as: 'user'
});

User.hasMany(Auth, { 
    foreignKey: 'user_uuid', 
    sourceKey: 'id',
    as: 'auths'
});

module.exports = Auth;
