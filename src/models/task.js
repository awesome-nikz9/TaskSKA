const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Task extends Model {}
  Task.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    taskCode: { type: DataTypes.STRING(20), unique: true },
    title: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.STRING(300) },
    deadline: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM('NOT_STARTED','IN_PROGRESS','BLOCKED','COMPLETED','OVERDUE'), allowNull: false, defaultValue: 'NOT_STARTED' },
    progress: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    estimatedHours: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 4 },
    statusUpdatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { sequelize, modelName: 'Task', tableName: 'tasks', createdAt: 'createdAt', updatedAt: 'updatedAt' });
  return Task;
};
