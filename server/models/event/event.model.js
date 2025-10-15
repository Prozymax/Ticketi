const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db.config');

const Event = sequelize.define('Event', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    organizerId: {
        type: DataTypes.UUID,
        allowNull: true,
        reference: {
            model: 'users',
            key: 'id'
        },
        field: 'organizer_id'
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'start_date'
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'end_date'
    },
    regularTickets: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'regular_tickets'
    },
    ticketPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        field: 'ticket_price'
    },
    eventImage: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'event_image'
    },
    isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_published'
    },
    organizerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'organizer_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    ticketsSold: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'tickets_sold'
    },
    status: {
        type: DataTypes.ENUM('draft', 'published', 'cancelled', 'completed'),
        defaultValue: 'draft'
    }
}, {
    tableName: 'events',
    timestamps: true,
    underscored: true
});

module.exports = Event;