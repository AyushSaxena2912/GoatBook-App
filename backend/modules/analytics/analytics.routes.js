const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const auth = require('../../middleware/auth');

router.get('/dashboard', auth, analyticsController.getDashboardAnalytics);

module.exports = router;
