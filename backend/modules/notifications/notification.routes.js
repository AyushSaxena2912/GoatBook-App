const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const auth = require('../../middleware/auth');

// @route   GET api/notifications
// @desc    Get all notifications/reminders for the logged-in user
router.get('/', auth, notificationController.getNotifications);

// @route   PUT api/notifications/:id/read
// @desc    Mark a specific notification as read
router.put('/:id/read', auth, notificationController.markAsRead);

// @route   PUT api/notifications/read-all
// @desc    Mark all notifications as read for the logged-in user
router.put('/read-all', auth, notificationController.markAllAsRead);

module.exports = router;
