const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../middlewares/errorHandler');
const { getEmailQueue } = require('../config/queues');

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

async function createSubscription(req, res) {
  try {
    const { plan, billing } = req.body; // plan: 'PRO', billing: 'monthly'|'yearly'
    if (plan !== 'PRO') return errorResponse(res, 400, 'Only PRO plan available via this endpoint');

    const amount = billing === 'yearly' ? 249900 : 29900; // in paise
    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `cw-${req.user.id}-${Date.now()}`,
      notes: { userId: req.user.id, plan, billing },
    });

    return successResponse(res, 200, { order, razorpayKeyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('[createSubscription]', err);
    return errorResponse(res, 500, 'Failed to create subscription order');
  }
}

async function handleWebhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body).digest('hex');

    if (signature !== expected) {
      return errorResponse(res, 400, 'Invalid webhook signature');
    }

    const event = req.body;

    if (event.event === 'payment.captured') {
      const { userId, plan, billing } = event.payload.payment.entity.notes;
      if (!userId) return res.status(200).json({ received: true });

      const expiresAt = billing === 'yearly'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { plan: 'PRO' } }),
        prisma.subscription.upsert({
          where: { userId },
          update: { plan: 'PRO', status: 'ACTIVE', expiresAt, razorpaySubscriptionId: event.payload.payment.entity.id },
          create: { userId, plan: 'PRO', status: 'ACTIVE', expiresAt, razorpaySubscriptionId: event.payload.payment.entity.id },
        }),
      ]);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        await getEmailQueue().add('subscription-confirmed', {
          to: user.email,
          subject: '✅ You\'re on CryptWill Pro',
          html: subConfirmedTemplate(user.fullName, expiresAt),
          userId, type: 'SUBSCRIPTION_CONFIRMED', channel: 'EMAIL',
        });
      }
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

function subConfirmedTemplate(name, expiresAt) {
  return `<div style="font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0F5;padding:40px;border-radius:12px;">
    <h2 style="color:#22C55E;">✅ You're on CryptWill Pro</h2>
    <p>Hi ${name}, your Pro subscription is now active.</p>
    <p><strong>Features unlocked:</strong> Unlimited assets, 10 beneficiaries, 7 guardians, SMS notifications, 5GB vault, PDF will, custom intervals.</p>
    <p><strong>Renews:</strong> ${expiresAt.toDateString()}</p>
  </div>`;
}

module.exports = { createSubscription, handleWebhook, getSubscriptionStatus };
