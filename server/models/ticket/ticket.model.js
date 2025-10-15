const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db.config');

const Ticket = sequelize.define('Ticket', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
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
    ticketType: {
        type: DataTypes.ENUM('regular', 'vip', 'premium', 'early_bird'),
        defaultValue: 'regular',
        field: 'ticket_type'
    },
    price: {
        type: DataTypes.DECIMAL(10, 6), // For Pi cryptocurrency precision
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'PI'
    },
    totalQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'total_quantity'
    },
    availableQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'available_quantity'
    },
    soldQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'sold_quantity'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    saleStartDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'sale_start_date'
    },
    saleEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'sale_end_date'
    }
}, {
    tableName: 'tickets',
    timestamps: true,
    underscored: true
});

module.exports = Ticket;