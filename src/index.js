import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

import paymentRoutes from './routes/payment.js';
import contactRoutes from './routes/contact.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
? ['https://abhitalkshere.com', 'https://www.abhitalkshere.com', 'https://abhijithpbinu.github.io']    : '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));

// ── Rate limiting ──────────────────────────────────────────
app.use('/api/payment', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Too many requests' } }));
app.use('/api/contact', rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: 'Too many contact submissions' } }));

// ── Body parsing ───────────────────────────────────────────
// Webhook needs raw body for signature verification
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }), (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) req.body = JSON.parse(req.body.toString());
  next();
});
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────
app.use('/api/payment', paymentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

// ── Health check ───────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── 404 ────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handler ──────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀  Abhi Talks Here — Backend running`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV || 'development'}\n`);
});
