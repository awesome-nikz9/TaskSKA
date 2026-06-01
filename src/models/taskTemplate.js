const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class TaskTemplate extends Model {}
  TaskTemplate.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    title: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.STRING(300) },
    defaultStatus: { type: DataTypes.ENUM('NOT_STARTED','IN_PROGRESS','BLOCKED','COMPLETED','OVERDUE'), allowNull: false, defaultValue: 'NOT_STARTED' },
    estimatedHours: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 4 },
    deadlineOffsetDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 7 },
  }, { sequelize, modelName: 'TaskTemplate', tableName: 'task_templates', timestamps: false });
  return TaskTemplate;
};
