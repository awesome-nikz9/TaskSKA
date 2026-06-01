const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Notification extends Model {}
  Notification.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.ENUM('TASK_ASSIGNED','STATUS_UPDATE','CONNECTION_REQUEST','CONNECTION_ACCEPTED','DEADLINE_OVERDUE','DEPENDENCY_ACTIVE'), allowNull: false },
    message: { type: DataTypes.STRING(300), allowNull: false },
    relatedTaskCode: { type: DataTypes.STRING(20) },
    readFlag: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, { sequelize, modelName: 'Notification', tableName: 'notifications', createdAt: 'createdAt', updatedAt: false });
  return Notification;
};
