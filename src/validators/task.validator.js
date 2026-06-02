const Joi = require('joi');

// Nilai yang valid untuk field status dan priority
const VALID_STATUS = ['todo', 'in_progress', 'done'];
const VALID_PRIORITY = ['low', 'medium', 'high'];
const VALID_SORT = ['createdAt', 'updatedAt', 'title', 'priority'];
const VALID_ORDER = ['asc', 'desc'];

// Schema untuk CREATE task (POST /tasks)
const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required()
    .messages({
      'string.empty': 'title tidak boleh kosong.',
      'string.max': 'title maksimal 200 karakter.',
      'any.required': 'title wajib diisi.',
    }),
  description: Joi.string().trim().max(1000).optional().allow(''),
  status: Joi.string().valid(...VALID_STATUS).default('todo')
    .messages({ 
      'any.only': `status harus salah satu dari: ${VALID_STATUS.join(', ')}.` 
    }),
  priority: Joi.string().valid(...VALID_PRIORITY).default('medium')
    .messages({ 
      'any.only': `priority harus salah satu dari: ${VALID_PRIORITY.join(', ')}.` 
    }),
  dueDate: Joi.date().iso().min('now').optional()
    .messages({ 
      'date.min': 'dueDate tidak boleh di masa lalu.' 
    }),
});

// Schema untuk FULL UPDATE (PUT /tasks/:id) — semua field wajib
const replaceTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(1000).optional().allow(''),
  status: Joi.string().valid(...VALID_STATUS).required(),
  priority: Joi.string().valid(...VALID_PRIORITY).required(),
  dueDate: Joi.date().iso().optional().allow(null),
});

// Schema untuk PARTIAL UPDATE (PATCH /tasks/:id) — minimal 1 field
const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  description: Joi.string().trim().max(1000).allow(''),
  status: Joi.string().valid(...VALID_STATUS),
  priority: Joi.string().valid(...VALID_PRIORITY),
  dueDate: Joi.date().iso().allow(null),
}).min(1).messages({ 
  'object.min': 'Minimal satu field harus diisi untuk update.' 
});

// Schema untuk QUERY PARAMS di GET /tasks
const listTasksSchema = Joi.object({
  status: Joi.string().valid(...VALID_STATUS).optional(),
  priority: Joi.string().valid(...VALID_PRIORITY).optional(),
  sort: Joi.string().valid(...VALID_SORT).default('createdAt'),
  order: Joi.string().valid(...VALID_ORDER).default('desc'),
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0),
});

module.exports = { 
  createTaskSchema, 
  replaceTaskSchema, 
  updateTaskSchema, 
  listTasksSchema 
};