import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { sendEnrollmentEmail, sendWelcomeEmail } from '../utils/email.js';

const router = Router();

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// ── POST /api/payment/create-order ────────────────────────
// Called before Razorpay checkout opens (creates an order server-side)
router.post('/create-order', async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'name, email, and phone are required' });
  }

  try {
    const razorpay = getRazorpay();
    const amount = Number(process.env.COURSE_PRICE_INR || 999) * 100; // paise

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { name, email, phone },
    });

    // Store a pending record
    db.read();
    db.data.orders.push({
      id: uuidv4(),
      razorpayOrderId: order.id,
      name,
      email,
      phone,
      amount: amount / 100,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    db.write();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('create-order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ── POST /api/payment/verify ───────────────────────────────
// Client calls this after Razorpay checkout succeeds
router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment fields' });
  }

  // Verify signature
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSig !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment signature mismatch — possible fraud' });
  }

  // Update order status
  db.read();
  const order = db.data.orders.find(o => o.razorpayOrderId === razorpay_order_id);
  if (order) {
    order.status = 'paid';
    order.paymentId = razorpay_payment_id;
    order.paidAt = new Date().toISOString();
  }

  // Upsert enrolled user
  const existing = db.data.users.find(u => u.email === order?.email);
  if (!existing && order) {
    db.data.users.push({
      id: uuidv4(),
      name: order.name,
      email: order.email,
      phone: order.phone,
      paymentId: razorpay_payment_id,
      enrolledAt: new Date().toISOString(),
      courseAccess: true,
    });
  }
  db.write();

  // Send emails (non-blocking)
  if (order) {
    sendEnrollmentEmail({ ...order, paymentId: razorpay_payment_id }).catch(console.error);
    sendWelcomeEmail({ name: order.name, email: order.email, paymentId: razorpay_payment_id }).catch(console.error);
  }

  res.json({
    success: true,
    courseUrl: process.env.COURSE_TELEGRAM_URL,
  });
});

// ── POST /api/payment/webhook ──────────────────────────────
// Razorpay dashboard → Settings → Webhooks → point here
// Handles payment.captured event as backup confirmation
router.post('/webhook', (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (secret) {
    const digest = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (digest !== signature) {
      console.warn('Webhook signature mismatch');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
  }

  const event = req.body.event;
  const payload = req.body.payload?.payment?.entity;

  if (event === 'payment.captured' && payload) {
    db.read();
    const order = db.data.orders.find(o => o.razorpayOrderId === payload.order_id);
    if (order && order.status !== 'paid') {
      order.status = 'paid';
      order.paymentId = payload.id;
      order.paidAt = new Date().toISOString();
      db.write();
      console.log(`[webhook] Payment captured: ${payload.id}`);
    }
  }

  res.json({ received: true });
});

export default router;
