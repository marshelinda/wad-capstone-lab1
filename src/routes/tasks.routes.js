const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tasks.controller');
const validate = require('../middleware/validate');
const {
  createTaskSchema,
  replaceTaskSchema,
  updateTaskSchema,
  listTasksSchema,
} = require('../validators/task.validator');

// Jalur Endpoint utama Tasks
router.get('/', validate(listTasksSchema, 'query'), ctrl.listTasks);
router.post('/', validate(createTaskSchema, 'body'), ctrl.createTask);

// Jalur Endpoint dengan ID spesifik
router.get('/:id', ctrl.getTask);
router.put('/:id', validate(replaceTaskSchema, 'body'), ctrl.replaceTask);
router.patch('/:id', validate(updateTaskSchema, 'body'), ctrl.updateTask);
router.delete('/:id', ctrl.deleteTask);

module.exports = router;