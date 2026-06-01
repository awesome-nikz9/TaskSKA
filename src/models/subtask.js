const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Subtask extends Model {}
  Subtask.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    done: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, { sequelize, modelName: 'Subtask', tableName: 'subtasks', timestamps: false });
  return Subtask;
};
