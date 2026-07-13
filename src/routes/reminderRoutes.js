const express = require('express');
const router = express.Router();
const { getUpcomingReminders, createReminder } = require('../controllers/reminderController');

router.get('/upcoming', getUpcomingReminders);
router.post('/', createReminder); 

module.exports = router;