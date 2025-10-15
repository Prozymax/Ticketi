const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db.config');

const UserSettings = sequelize.define('UserSettings', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    emailNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'email_notifications'
    },
    pushNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'push_notifications'
    },
    marketingEmails: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'marketing_emails'
    },
    language: {
        type: DataTypes.STRING,
        defaultValue: 'en'
    },
    timezone: {
        type: DataTypes.STRING,
        defaultValue: 'UTC'
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'PI'
    },
    twoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'two_factor_enabled'
    }
}, {
    tableName: 'user_settings',
    timestamps: true,
    underscored: true
});

module.exports = UserSettings;