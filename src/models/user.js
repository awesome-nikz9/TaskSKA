const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class User extends Model {}
  User.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fullName: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(100), allowNull: false },
    role: { type: DataTypes.ENUM('TASKMASTER','TASKER','AUDITOR','ADMIN'), allowNull: false, defaultValue: 'TASKMASTER' },
    skills: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    availability: { type: DataTypes.STRING(200) },
    weeklyCapacityHours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 40 },
    jobTitle: { type: DataTypes.STRING(120) },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    mfaEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    emailVerificationToken: { type: DataTypes.STRING(120) },
    otpCode: { type: DataTypes.STRING(10) },
    otpExpiry: { type: DataTypes.DATE },
    resetToken: { type: DataTypes.STRING(120) },
    resetExpiry: { type: DataTypes.DATE },
    notifyAssignment: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notifyStatus: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notifyConnection: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notifyEmail: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, { sequelize, modelName: 'User', tableName: 'users', updatedAt: false, createdAt: 'createdAt' });
  return User;
};
