const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    piUserId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      comment: 'Pi Network user ID'
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      validate: {
        len: [3, 50],
        isAlphanumeric: true
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    profilePicture: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL or base64 encoded image'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500]
      }
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    userType: {
      type: DataTypes.ENUM('basic', 'verified', 'premium', 'admin'),
      defaultValue: 'basic',
      allowNull: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    loginCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        notifications: {
          email: true,
          push: true,
          eventReminders: true
        },
        privacy: {
          showEmail: false,
          showLocation: true
        }
      }
    },
    piNetworkData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional Pi Network user data'
    }
  }, {
    tableName: 'users',
    indexes: [
      {
        fields: ['piUserId']
      },
      {
        fields: ['username']
      },
      {
        fields: ['email']
      },
      {
        fields: ['userType']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['createdAt']
      }
    ],
    hooks: {
      beforeCreate: async (user) => {
        // Set default username if not provided
        if (!user.username && user.piUserId) {
          user.username = `user_${user.piUserId.slice(-8)}`;
        }
      },
      afterCreate: async (user) => {
        // Log user creation
        console.log(`New user created: ${user.username} (${user.piUserId})`);
      },
      beforeUpdate: async (user) => {
        // Update login tracking
        if (user.changed('lastLoginAt')) {
          user.loginCount = (user.loginCount || 0) + 1;
        }
      }
    }
  });

  // Instance methods
  User.prototype.getFullName = function() {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
  };

  User.prototype.getPublicProfile = function() {
    return {
      id: this.id,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      profilePicture: this.profilePicture,
      bio: this.bio,
      location: this.preferences?.privacy?.showLocation ? this.location : null,
      userType: this.userType,
      isVerified: this.isVerified,
      createdAt: this.createdAt
    };
  };

  User.prototype.updateLoginInfo = async function() {
    this.lastLoginAt = new Date();
    this.loginCount = (this.loginCount || 0) + 1;
    await this.save();
  };

  User.prototype.canCreateEvent = function() {
    return this.isActive && (this.userType !== 'basic' || this.isVerified);
  };

  User.prototype.getEventLimit = function() {
    const limits = {
      basic: 2,
      verified: 10,
      premium: 50,
      admin: Infinity
    };
    return limits[this.userType] || limits.basic;
  };

  // Class methods
  User.findByPiUserId = async function(piUserId) {
    return await this.findOne({
      where: { piUserId },
      include: ['events', 'eventAttendances']
    });
  };

  User.findActiveUsers = async function(limit = 50, offset = 0) {
    return await this.findAndCountAll({
      where: { isActive: true },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
  };

  User.getStatistics = async function() {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      recentUsers
    ] = await Promise.all([
      this.count(),
      this.count({ where: { isActive: true } }),
      this.count({ where: { isVerified: true } }),
      this.count({
        where: {
          createdAt: {
            [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
      verified: verifiedUsers,
      recent: recentUsers
    };
  };

  // Associations
  User.associate = (models) => {
    User.hasMany(models.Event, {
      foreignKey: 'organizerId',
      as: 'events'
    });

    User.hasMany(models.EventAttendance, {
      foreignKey: 'userId',
      as: 'eventAttendances'
    });

    User.hasMany(models.EventReview, {
      foreignKey: 'userId',
      as: 'eventReviews'
    });
  };

  return User;
};