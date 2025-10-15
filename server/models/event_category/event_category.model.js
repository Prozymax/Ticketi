const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db.config');

const EventCategory = sequelize.define('EventCategory', {
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
    categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'category_id',
        references: {
            model: 'categories',
            key: 'id'
        }
    }
}, {
    tableName: 'event_categories',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['event_id', 'category_id']
        }
    ]
});

module.exports = EventCategory;