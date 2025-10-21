const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db.config');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    purchaseId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Purchases',
            key: 'id'
        }
    },
    eventId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Events',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'PI'
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'completed', 'cancelled', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
    },
    paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'pi_network'
    },
    piPaymentId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true
    },
    transactionHash: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    memo: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'payments',
    timestamps: true,
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['purchaseId']
        },
        {
            fields: ['status']
        },
        {
            fields: ['piPaymentId']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = Payment;