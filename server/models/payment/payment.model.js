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
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    purchaseId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'purchase_id',
        references: {
            model: 'purchases',
            key: 'id'
        }
    },
    eventId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'event_id',
        references: {
            model: 'events',
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
        defaultValue: 'pi_network',
        field: 'payment_method'
    },
    piPaymentId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        field: 'pi_payment_id'
    },
    transactionHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'transaction_hash'
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
        allowNull: true,
        field: 'completed_at'
    }
}, {
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['purchase_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['pi_payment_id']
        },
        {
            fields: ['created_at']
        }
    ]
});

module.exports = Payment;