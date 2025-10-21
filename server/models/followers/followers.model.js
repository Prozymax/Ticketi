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
  },
  followingId: {
    type: DataTypes.UUID,
    allowNull: false,
  }
 }, {
    tableName: 'followers',
    timestamps: true,
    underscored: true
});

module.exports = Followers;