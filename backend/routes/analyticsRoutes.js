const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

router.get('/dashboard', auth, analyticsController.getDashboardAnalytics);

module.exports = router;
