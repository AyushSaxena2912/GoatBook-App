const prisma = require('../../config/prisma');
const { v4: uuidv4 } = require('uuid');

const CASHFREE_BASE_URL = process.env.CASHFREE_BASE_URL || 'https://sandbox.cashfree.com/pg';
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_API_VERSION = '2023-08-01';

// Price lookup for plans
const PLAN_PRICES = {
  BASIC: 5000,
  STANDARD: 10000,
  ADVANCED: 15000,
  ULTIMATE: 20000
};

// @desc    Create a payment order for Cashfree
// @route   POST /api/subscriptions/create-order
exports.createOrder = async (req, res) => {
  const { planName } = req.body;

  if (!planName || !PLAN_PRICES[planName.toUpperCase()]) {
    return res.status(400).json({ message: 'Invalid or missing plan name' });
  }

  const normalizedPlan = planName.toUpperCase();
  const orderAmount = PLAN_PRICES[normalizedPlan];
  const orderId = `order_${uuidv4().replace(/-/g, '')}`;

  try {
    const user = await prisma.users.findUnique({ where: { id: req.user.id } });

    const orderPayload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: user.id.replace(/-/g, ''), // Cashfree customer_id requires alphanumeric
        customer_name: user.name || 'GoatBook User',
        customer_email: user.email || 'user@goatbook.app',
        customer_phone: user.phone || '9999999999'
      },
      order_meta: {
        // Return URL can be configured based on frontend routes
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-status?order_id={order_id}`
      },
      order_tags: {
        farm_id: req.farmId,
        plan_name: normalizedPlan
      }
    };

    const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': CASHFREE_API_VERSION
      },
      body: JSON.stringify(orderPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('CASHFREE CREATE ORDER ERROR:', data);
      return res.status(500).json({ message: 'Failed to initiate payment', error: data.message });
    }

    // Save order intent to our database (temporarily marking as pending)
    await prisma.subscriptions.update({
        where: { farm_id: req.farmId },
        data: {
            cashfree_order_id: orderId,
            plan_name: normalizedPlan,
            status: 'PENDING',
            updated_at: new Date()
        }
    });

    res.json({
      order_id: data.order_id,
      payment_session_id: data.payment_session_id,
      order_amount: data.order_amount
    });

  } catch (err) {
    console.error('CREATE ORDER ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Verify payment order from Cashfree
// @route   POST /api/subscriptions/verify-order
exports.verifyOrder = async (req, res) => {
  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ message: 'Order ID is required' });
  }

  try {
    const response = await fetch(`${CASHFREE_BASE_URL}/orders/${order_id}`, {
      method: 'GET',
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': CASHFREE_API_VERSION
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('CASHFREE VERIFY ERROR:', data);
      return res.status(500).json({ message: 'Failed to verify payment', error: data.message });
    }

    if (data.order_status === 'PAID') {
      // Find subscription by farmId
      const subscription = await prisma.subscriptions.findUnique({
          where: { farm_id: req.farmId }
      });

      if (!subscription) {
          return res.status(404).json({ message: 'Subscription record not found' });
      }

      // Determine end date based on plan (1 year from now)
      const now = new Date();
      const endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const planName = data.order_tags?.plan_name || subscription.plan_name;

      // Update subscription to ACTIVE
      await prisma.subscriptions.update({
        where: { farm_id: req.farmId },
        data: {
          status: 'ACTIVE',
          is_trial: false,
          plan_name: planName,
          start_date: now,
          end_date: endDate,
          cashfree_order_id: order_id,
          updated_at: new Date()
        }
      });

      return res.json({ message: 'Payment verified successfully. Subscription activated.', status: 'PAID' });
    }

    res.json({ message: 'Payment is pending or failed', status: data.order_status });

  } catch (err) {
    console.error('VERIFY ORDER ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get current subscription details
// @route   GET /api/subscriptions/current
exports.getCurrentSubscription = async (req, res) => {
  try {
    const subscription = await prisma.subscriptions.findUnique({
      where: { farm_id: req.farmId }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    res.json(subscription);
  } catch (err) {
    console.error('FETCH SUBSCRIPTION ERROR:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
