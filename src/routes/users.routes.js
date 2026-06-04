const express = require('express');
const router = express.Router();
const { getTasksByUser } = require('../controllers/tasks.controller');

// GET /api/v1/users/:userId/tasks - Mengambil semua task milik user tertentu
router.get('/:userId/tasks', getTasksByUser);

module.exports = router;