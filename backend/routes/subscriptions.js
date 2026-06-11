const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createOrder, verifyOrder, getCurrentSubscription } = require('../controllers/subscriptionController');

// All subscription routes require authentication and farm context
router.use(auth);

// Create a Cashfree order (start payment)
router.post('/create-order', createOrder);

// Verify payment status
router.post('/verify-order', verifyOrder);

// Get current subscription details
router.get('/current', getCurrentSubscription);

module.exports = router;
