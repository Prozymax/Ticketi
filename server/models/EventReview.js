const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EventReview = sequelize.define('EventReview', {
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
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000]
      }
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the reviewer actually attended the event'
    }
  }, {
    tableName: 'event_reviews',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'eventId']
      },
      { fields: ['eventId'] },
      { fields: ['userId'] },
      { fields: ['rating'] }
    ]
  });

  // Associations
  EventReview.associate = (models) => {
    EventReview.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    EventReview.belongsTo(models.Event, {
      foreignKey: 'eventId',
      as: 'event'
    });
  };

  return EventReview;
};