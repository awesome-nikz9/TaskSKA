const express = require('express');
const router = express.Router();
const { wrap, ApiException } = require('../lib/errors');
const { requireAuth } = require('../middleware/auth');
const { User, TaskTemplate } = require('../models');
const { toTemplateDto, toTaskDto } = require('../lib/dto');
const { createTask } = require('./tasks');

// GET / -> my templates
router.get('/', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const rows = await TaskTemplate.findAll({ where: { ownerId: me.id } });
  const dtos = await Promise.all(rows.map((t) => toTemplateDto(t)));
  res.json(dtos);
}));

// POST / -> create template
router.post('/', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const body = req.body || {};
  if (body.name == null || String(body.name).trim() === '') {
    throw ApiException.badRequest('name: must not be blank');
  }
  if (body.title == null || String(body.title).trim() === '') {
    throw ApiException.badRequest('title: must not be blank');
  }

  const t = TaskTemplate.build();
  t.ownerId = me.id;
  t.name = body.name;
  t.title = body.title;
  t.description = body.description;
  if (body.estimatedHours != null) t.estimatedHours = body.estimatedHours;
  if (body.deadlineOffsetDays != null) t.deadlineOffsetDays = body.deadlineOffsetDays;
  if (body.defaultAssigneeId != null) {
    const a = await User.findByPk(body.defaultAssigneeId);
    if (!a) throw ApiException.notFound('Default assignee not found');
    t.defaultAssigneeId = a.id;
  }
  await t.save();
  res.json(await toTemplateDto(t));
}));

// POST /:id/instantiate -> create a Task from the template, return TaskDto
router.post('/:id/instantiate', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const t = await TaskTemplate.findByPk(req.params.id);
  if (!t) throw ApiException.notFound('Template not found');
  if (t.ownerId !== me.id) throw ApiException.forbidden('Not your template');

  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + t.deadlineOffsetDays);
  const deadline = toLocalDateTimeString(deadlineDate);
  const assigneeId = t.defaultAssigneeId != null ? t.defaultAssigneeId : null;

  const reqBody = {
    title: t.title,
    description: t.description,
    deadline,
    assigneeId,
    autoAssign: false,
    estimatedHours: t.estimatedHours,
    subtasks: [],
    dependencyCodes: [],
  };
  const task = await createTask(me, reqBody);
  res.json(await toTaskDto(task, me));
}));

// DELETE /:id
router.delete('/:id', requireAuth, wrap(async (req, res) => {
  const me = req.user;
  const t = await TaskTemplate.findByPk(req.params.id);
  if (!t) throw ApiException.notFound('Template not found');
  if (t.ownerId !== me.id) throw ApiException.forbidden('Not your template');
  await t.destroy();
  res.status(200).end();
}));

// Mirrors Java LocalDateTime.now().plusDays(n).toString() -> 'yyyy-MM-ddTHH:mm:ss(.SSS)'
function toLocalDateTimeString(d) {
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  let s = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
    + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  if (d.getMilliseconds() > 0) s += '.' + pad(d.getMilliseconds(), 3);
  return s;
}

module.exports = router;
