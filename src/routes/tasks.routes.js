const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tasks.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { checkTaskOwnership } = require('../middleware/checkOwnership');
const { sanitizeBody } = require('../middleware/sanitize'); // ← TAMBAHAN: Import middleware sanitasi XSS
const {
  createTaskSchema, 
  updateTaskSchema, 
  listTasksSchema
} = require('../validators/task.validator');

// 1. Semua route di bawah ini wajib melewati autentikasi (Login Terlebih Dahulu)
router.use(authenticate);

// 2. GET /api/v1/tasks — Semua user bisa lihat (ter-filter berdasarkan userId untuk user biasa)
router.get('/', validate(listTasksSchema, 'query'), ctrl.listTasks);

// 3. POST /api/v1/tasks — USER dan ADMIN bisa buat task (Urutan: Validate → Sanitize → Authorize → Controller)
router.post(
  '/', 
  validate(createTaskSchema, 'body'), 
  sanitizeBody, // ← Disisipkan di sini untuk membersihkan input string dari tag HTML/XSS jahat
  authorize('USER', 'ADMIN'), 
  ctrl.createTask
);

// 4. GET /api/v1/tasks/:id — User hanya bisa lihat task sendiri, admin bisa lihat semua task
router.get('/:id', checkTaskOwnership, ctrl.getTask);

// 5. PATCH /api/v1/tasks/:id — Update task (Urutan: Ownership Check → Validate → Sanitize → Controller)
router.patch(
  '/:id', 
  checkTaskOwnership, 
  validate(updateTaskSchema, 'body'), 
  sanitizeBody, // ← Disisipkan di sini sebelum data masuk ke database lewat controller
  ctrl.updateTask
);

// 6. DELETE /api/v1/tasks/:id — Hapus task (Hanya untuk pemilik task atau ADMIN)
router.delete('/:id', checkTaskOwnership, ctrl.deleteTask);

module.exports = router;