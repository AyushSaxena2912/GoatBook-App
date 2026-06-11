const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const farmMiddleware = require('../middleware/farmMiddleware');

router.get('/dashboard', protect, farmMiddleware, analyticsController.getDashboardAnalytics);

module.exports = router;
