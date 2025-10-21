const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db.config");

const Followers = sequelize.define("Followers", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  followerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'follower_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  followingId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'following_id',
    references: {
      model: 'users',
      key: 'id'
    }
  }
 }, {
    tableName: 'followers',
    timestamps: true,
    underscored: true
});

module.exports = Followers;