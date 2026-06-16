const express = require('express');
const router = express.Router();
const { getUpcomingReminders } = require('../controllers/reminderController');

// Cukup langsung dipetakan karena proteksi token sudah ditangani secara global oleh index.js
router.get('/upcoming', getUpcomingReminders);

module.exports = router;