import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { sendContactEmail } from '../utils/email.js';

const router = Router();

// ── POST /api/contact ──────────────────────────────────────
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are required' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const entry = {
    id: uuidv4(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: (subject || 'No subject').trim(),
    message: message.trim(),
    createdAt: new Date().toISOString(),
    read: false,
  };

  db.read();
  db.data.contacts.push(entry);
  db.write();

  // Send email notification (non-blocking)
  sendContactEmail(entry).catch(console.error);

  res.json({ success: true, message: 'Your message has been received!' });
});

export default router;
