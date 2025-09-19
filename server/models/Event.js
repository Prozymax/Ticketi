const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Event = sequelize.define('Event', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [3, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 5000]
      }
    },
    organizerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    location: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    category: {
      type: DataTypes.ENUM(
        'conference',
        'workshop', 
        'meetup',
        'concert',
        'festival',
        'sports',
        'networking',
        'education',
        'charity',
        'other'
      ),
      defaultValue: 'other'
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'cancelled', 'completed'),
      defaultValue: 'draft'
    },
    maxAttendees: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    currentAttendees: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    ticketPrice: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'PI'
    }
  }, {
    tableName: 'events',
    indexes: [
      { fields: ['organizerId'] },
      { fields: ['startDate'] },
      { fields: ['category'] },
      { fields: ['status'] }
    ]
  });

  // Associations
  Event.associate = (models) => {
    Event.belongsTo(models.User, {
      foreignKey: 'organizerId',
      as: 'organizer'
    });

    Event.hasMany(models.EventAttendance, {
      foreignKey: 'eventId',
      as: 'attendances'
    });
  };

  return Event;
};