import { Router } from 'express';
import db from '../db/database.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = Router();

// All admin routes require Bearer token
router.use(adminAuth);

// ── GET /api/admin/stats ───────────────────────────────────
router.get('/stats', (req, res) => {
  db.read();
  const orders = db.data.orders;
  const paid = orders.filter(o => o.status === 'paid');
  const revenue = paid.reduce((sum, o) => sum + (o.amount || 0), 0);

  res.json({
    totalOrders: orders.length,
    paidOrders: paid.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalRevenue: revenue,
    totalUsers: db.data.users.length,
    totalContacts: db.data.contacts.length,
    unreadContacts: db.data.contacts.filter(c => !c.read).length,
  });
});

// ── GET /api/admin/orders ──────────────────────────────────
router.get('/orders', (req, res) => {
  db.read();
  const { status, page = 1, limit = 20 } = req.query;
  let orders = [...db.data.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (status) orders = orders.filter(o => o.status === status);

  const start = (page - 1) * limit;
  res.json({
    total: orders.length,
    page: Number(page),
    data: orders.slice(start, start + Number(limit)),
  });
});

// ── GET /api/admin/users ───────────────────────────────────
router.get('/users', (req, res) => {
  db.read();
  const { page = 1, limit = 20, search } = req.query;
  let users = [...db.data.users].sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));

  if (search) {
    const q = search.toLowerCase();
    users = users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  }

  const start = (page - 1) * limit;
  res.json({
    total: users.length,
    page: Number(page),
    data: users.slice(start, start + Number(limit)),
  });
});

// ── GET /api/admin/users/:id ───────────────────────────────
router.get('/users/:id', (req, res) => {
  db.read();
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ── PATCH /api/admin/users/:id ─────────────────────────────
router.patch('/users/:id', (req, res) => {
  db.read();
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const allowed = ['courseAccess', 'name', 'phone'];
  allowed.forEach(key => {
    if (req.body[key] !== undefined) user[key] = req.body[key];
  });
  user.updatedAt = new Date().toISOString();
  db.write();

  res.json(user);
});

// ── GET /api/admin/contacts ────────────────────────────────
router.get('/contacts', (req, res) => {
  db.read();
  const { read, page = 1, limit = 20 } = req.query;
  let contacts = [...db.data.contacts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (read !== undefined) contacts = contacts.filter(c => c.read === (read === 'true'));

  const start = (page - 1) * limit;
  res.json({
    total: contacts.length,
    page: Number(page),
    data: contacts.slice(start, start + Number(limit)),
  });
});

// ── PATCH /api/admin/contacts/:id/read ────────────────────
router.patch('/contacts/:id/read', (req, res) => {
  db.read();
  const contact = db.data.contacts.find(c => c.id === req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  contact.read = true;
  db.write();
  res.json({ success: true });
});

// ── DELETE /api/admin/contacts/:id ────────────────────────
router.delete('/contacts/:id', (req, res) => {
  db.read();
  const idx = db.data.contacts.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Contact not found' });

  db.data.contacts.splice(idx, 1);
  db.write();
  res.json({ success: true });
});

export default router;
