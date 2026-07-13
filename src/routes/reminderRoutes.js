const express = require('express');
const router = express.Router();
const { getUpcomingReminders, createReminder } = require('../controllers/reminderController');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/upcoming', getUpcomingReminders);
router.post('/', createReminder); 

module.exports = router;