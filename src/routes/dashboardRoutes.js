const express = require('express');
const router = express.Router();
const { getStats, getActivityLogs } = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats', authorize('ADMIN', 'MANAGER'), getStats);
router.get('/activity-logs', authorize('ADMIN', 'MANAGER'), getActivityLogs);

module.exports = router;
