const prisma = require('../../config/prisma');

// @desc    Get all notifications/reminders for the logged-in user
// @route   GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.reminders.findMany({
      where: {
        user_id: req.user.id
      },
      orderBy: {
        remind_at: 'desc'
      }
    });

    res.json(notifications);
  } catch (err) {
    console.error('GET NOTIFICATIONS ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Verify ownership
    const notification = await prisma.reminders.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await prisma.reminders.update({
      where: { id: notificationId },
      data: { is_read: true }
    });

    res.json(updated);
  } catch (err) {
    console.error('MARK NOTIFICATION READ ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await prisma.reminders.updateMany({
      where: {
        user_id: req.user.id,
        is_read: false
      },
      data: {
        is_read: true
      }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('MARK ALL NOTIFICATIONS READ ERROR:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};
