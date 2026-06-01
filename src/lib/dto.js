// DtoMapper equivalent — converts model instances into the exact camelCase
// shapes the frontend reads. Several are async because they fold in workload.
const { User, Task, Subtask } = require('../models');
const workload = require('../services/workload');

async function toUserDto(user) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    skills: user.skills || [],
    availability: user.availability,
    weeklyCapacityHours: user.weeklyCapacityHours,
    jobTitle: user.jobTitle,
    mfaEnabled: user.mfaEnabled,
    enabled: user.enabled,
    workloadPercent: await workload.percentFor(user),
    createdAt: user.createdAt,
  };
}

async function toTaskDto(task, viewer) {
  const creator = task.creator || (task.creatorId ? await User.findByPk(task.creatorId) : null);
  const assignee = task.assignee || (task.assigneeId ? await User.findByPk(task.assigneeId) : null);
  let subtasks = task.subtasks;
  if (!subtasks) subtasks = await Subtask.findAll({ where: { taskId: task.id } });
  let deps = task.dependencies;
  if (!deps) deps = await task.getDependencies();

  const dependencyCodes = (deps || []).map((d) => d.taskCode).sort();
  const blockedByDependency = (deps || []).some((d) => d.status !== 'COMPLETED');
  const canEdit = viewer
    ? viewer.role === 'ADMIN' || task.creatorId === viewer.id || task.assigneeId === viewer.id
    : false;

  return {
    id: task.id,
    taskCode: task.taskCode,
    title: task.title,
    description: task.description,
    deadline: task.deadline,
    status: task.status,
    progress: task.progress,
    estimatedHours: task.estimatedHours,
    creatorName: creator ? creator.fullName : null,
    creatorId: task.creatorId,
    assigneeName: assignee ? assignee.fullName : null,
    assigneeId: task.assigneeId,
    subtasks: (subtasks || []).slice().sort((a, b) => a.id - b.id).map((s) => ({ id: s.id, title: s.title, done: s.done })),
    dependencyCodes,
    blockedByDependency,
    canEdit,
    createdAt: task.createdAt,
    statusUpdatedAt: task.statusUpdatedAt,
  };
}

async function toWorkloadDto(user) {
  const w = await workload.compute(user);
  return {
    userId: user.id, name: user.fullName, email: user.email,
    percent: w.percent, level: w.level, activeTasks: w.activeTasks,
    committedHours: w.committedHours, capacityHours: w.capacityHours,
  };
}

function toNotificationDto(n) {
  return { id: n.id, type: n.type, message: n.message, relatedTaskCode: n.relatedTaskCode, read: n.readFlag, createdAt: n.createdAt };
}

async function toTemplateDto(t) {
  const assignee = t.defaultAssignee || (t.defaultAssigneeId ? await User.findByPk(t.defaultAssigneeId) : null);
  return {
    id: t.id, name: t.name, title: t.title, description: t.description,
    estimatedHours: t.estimatedHours, deadlineOffsetDays: t.deadlineOffsetDays,
    defaultAssigneeId: t.defaultAssigneeId, defaultAssigneeName: assignee ? assignee.fullName : null,
  };
}

module.exports = { toUserDto, toTaskDto, toWorkloadDto, toNotificationDto, toTemplateDto };
