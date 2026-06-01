const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Connection extends Model {}
  Connection.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    status: { type: DataTypes.ENUM('PENDING','ACCEPTED','DECLINED'), allowNull: false, defaultValue: 'PENDING' },
    respondedAt: { type: DataTypes.DATE },
  }, { sequelize, modelName: 'Connection', tableName: 'connections', createdAt: 'createdAt', updatedAt: false });
  return Connection;
};
