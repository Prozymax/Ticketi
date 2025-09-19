const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EventAttendance = sequelize.define('EventAttendance', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('registered', 'confirmed', 'attended', 'cancelled', 'no_show'),
      defaultValue: 'registered'
    },
    registrationDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    ticketsPurchased: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    checkInTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'event_attendances',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'eventId']
      },
      { fields: ['eventId'] },
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['registrationDate'] }
    ]
  });

  // Associations
  EventAttendance.associate = (models) => {
    EventAttendance.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    EventAttendance.belongsTo(models.Event, {
      foreignKey: 'eventId',
      as: 'event'
    });
  };

  return EventAttendance;
};