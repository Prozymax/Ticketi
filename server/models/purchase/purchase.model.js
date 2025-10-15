const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db.config');

const Purchase = sequelize.define('Purchase', {
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
    eventId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'event_id',
        references: {
            model: 'events',
            key: 'id'
        }
    },
    ticketId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'ticket_id',
        references: {
            model: 'tickets',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false,
        field: 'total_amount'
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'PI'
    },
    transactionHash: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        field: 'transaction_hash'
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending',
        field: 'payment_status'
    },
    purchaseDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'purchase_date'
    }
}, {
    tableName: 'purchases',
    timestamps: true,
    underscored: true
});

module.exports = Purchase;