const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../middlewares/errorHandler');
const { getEmailQueue } = require('../config/queues');
const { seedDemoLawyerTeam } = require('../services/lawyerTeam.service');

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function isDemoRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  return keyId.includes('demo') || keyId === 'rzp_test_demokey' || !process.env.RAZORPAY_KEY_SECRET;
}

async function upgradeUserPlan(userId, plan, billing, paymentId) {
  const expiresAt = billing === 'yearly'
    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.user.update({ where: { id: userId }, data: { plan } });
  await prisma.subscription.upsert({
    where: { userId },
    update: { plan, status: 'ACTIVE', expiresAt, razorpaySubscriptionId: paymentId || null },
    create: { userId, plan, status: 'ACTIVE', expiresAt, razorpaySubscriptionId: paymentId || null },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    await getEmailQueue().add('subscription-confirmed', {
      to: user.email,
      subject: `✅ You're on CryptWill ${plan}`,
      html: subConfirmedTemplate(user.fullName, plan, expiresAt),
      userId, type: 'SUBSCRIPTION_CONFIRMED', channel: 'EMAIL',
    });
  }

  let lawyerTeam = null;
  if (plan === 'ENTERPRISE') {
    lawyerTeam = await seedDemoLawyerTeam(userId);
  }

  return { plan, expiresAt, lawyerTeam };
}

async function createSubscription(req, res) {
  try {
    const { plan, billing } = req.body;
    if (!['PRO', 'ENTERPRISE'].includes(plan)) {
      return errorResponse(res, 400, 'Invalid plan selected');
    }

    if (isDemoRazorpay() && process.env.NODE_ENV !== 'production') {
      const result = await upgradeUserPlan(req.user.id, plan, billing || 'monthly', `demo-${Date.now()}`);
      return successResponse(res, 200, {
        demo: true,
        message: 'Plan upgraded (demo mode — configure real Razorpay keys for live payments)',
        ...result,
      });
    }

    const amount = plan === 'ENTERPRISE'
      ? (billing === 'yearly' ? 3999900 : 399900)
      : (billing === 'yearly' ? 249900 : 29900);

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `cw-${req.user.id}-${Date.now()}`,
      notes: { userId: req.user.id, plan, billing: billing || 'monthly' },
    });

    return successResponse(res, 200, { order, razorpayKeyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('[createSubscription]', err);
    return errorResponse(res, 500, 'Failed to create subscription order');
  }
}

async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, billing } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse(res, 400, 'Missing payment verification fields');
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return errorResponse(res, 400, 'Invalid payment signature');
    }

    const result = await upgradeUserPlan(
      req.user.id,
      plan || 'PRO',
      billing || 'monthly',
      razorpay_payment_id
    );

    return successResponse(res, 200, { message: 'Payment verified', ...result });
  } catch (err) {
    console.error('[verifyPayment]', err);
    return errorResponse(res, 500, 'Payment verification failed');
  }
}

async function handleWebhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody).digest('hex');

    if (signature !== expected) {
      return errorResponse(res, 400, 'Invalid webhook signature');
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const notes = payment.notes || {};
      const userId = notes.userId;
      const plan = notes.plan || 'PRO';
      const billing = notes.billing || 'monthly';
      if (!userId) return res.status(200).json({ received: true });

      await upgradeUserPlan(userId, plan, billing, payment.id);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[handleWebhook]', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function getSubscriptionStatus(req, res) {
  try {
    const subscription = await prisma.subscription.findUnique({ where: { userId: req.user.id } });
    return successResponse(res, 200, { subscription, plan: req.user.plan });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch subscription');
  }
}

function subConfirmedTemplate(name, plan, expiresAt) {
  return `<div style="font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0F5;padding:40px;border-radius:12px;">
    <h2 style="color:#22C55E;">✅ You're on CryptWill ${plan}</h2>
    <p>Hi ${name}, your ${plan} subscription is now active.</p>
    <p><strong>Renews:</strong> ${expiresAt.toDateString()}</p>
  </div>`;
}

module.exports = { createSubscription, verifyPayment, handleWebhook, getSubscriptionStatus };
