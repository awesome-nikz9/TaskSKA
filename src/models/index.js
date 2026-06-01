const sequelize = require('../config/database');
const User = require('./user')(sequelize);
const Task = require('./task')(sequelize);
const Subtask = require('./subtask')(sequelize);
const Connection = require('./connection')(sequelize);
const Notification = require('./notification')(sequelize);
const TaskTemplate = require('./taskTemplate')(sequelize);

// ---- Task <-> User (creator / assignee) ----
Task.belongsTo(User, { as: 'creator', foreignKey: { name: 'creatorId', allowNull: false } });
Task.belongsTo(User, { as: 'assignee', foreignKey: { name: 'assigneeId', allowNull: true } });

// ---- Subtasks ----
Task.hasMany(Subtask, { as: 'subtasks', foreignKey: { name: 'taskId', allowNull: false }, onDelete: 'CASCADE' });
Subtask.belongsTo(Task, { as: 'task', foreignKey: 'taskId' });

// ---- Task dependencies (self many-to-many) ----
Task.belongsToMany(Task, {
  as: 'dependencies', through: 'task_dependencies',
  foreignKey: 'taskId', otherKey: 'dependsOnId',
});

// ---- Connections ----
Connection.belongsTo(User, { as: 'requester', foreignKey: { name: 'requesterId', allowNull: false } });
Connection.belongsTo(User, { as: 'addressee', foreignKey: { name: 'addresseeId', allowNull: false } });

// ---- Notifications ----
Notification.belongsTo(User, { as: 'recipient', foreignKey: { name: 'recipientId', allowNull: false } });

// ---- Templates ----
TaskTemplate.belongsTo(User, { as: 'owner', foreignKey: { name: 'ownerId', allowNull: false } });
TaskTemplate.belongsTo(User, { as: 'defaultAssignee', foreignKey: { name: 'defaultAssigneeId', allowNull: true } });

module.exports = { sequelize, User, Task, Subtask, Connection, Notification, TaskTemplate };
