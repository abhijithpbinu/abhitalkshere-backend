# Abhi Talks Here — Backend

Express.js backend for the Abhi Talks Here website. Handles payments, enrollments, contact form, and admin dashboard.

---

## 📁 Project Structure

```
src/
├── index.js               # Express app entry point
├── routes/
│   ├── payment.js         # Razorpay order, verify, webhook
│   ├── contact.js         # Contact form submissions
│   └── admin.js           # Admin dashboard API
├── middleware/
│   └── adminAuth.js       # Bearer token auth for admin routes
├── db/
│   └── database.js        # JSON file database (lowdb)
└── utils/
    └── email.js           # Nodemailer email helpers

data/
└── db.json                # Auto-created; stores all data

frontend-integration.js    # Paste into your index.html
.env.example               # Copy to .env and fill in
```

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and fill in:
- `RAZORPAY_KEY_SECRET` — from your Razorpay dashboard
- `RAZORPAY_WEBHOOK_SECRET` — set when creating webhook in Razorpay
- `EMAIL_USER` / `EMAIL_PASS` — Gmail + App Password (not your real Gmail password)
- `ADMIN_SECRET` — any long random string for admin API access

### 3. Start the server
```bash
# Development (auto-restarts on changes)
npm run dev

# Production
npm start
```

---

## 🌐 API Endpoints

### Payment
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/payment/create-order` | Creates Razorpay order (call before opening checkout) |
| POST | `/api/payment/verify` | Verifies payment signature after checkout |
| POST | `/api/payment/webhook` | Razorpay webhook receiver |

**create-order body:**
```json
{ "name": "Rahul", "email": "rahul@example.com", "phone": "9876543210" }
```

**verify body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "abc123..."
}
```

---

### Contact
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/contact` | Submit contact form |

**Body:**
```json
{ "name": "Priya", "email": "priya@example.com", "subject": "Query", "message": "Hello!" }
```

---

### Admin (require `Authorization: Bearer <ADMIN_SECRET>` header)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/admin/stats` | Overview stats |
| GET | `/api/admin/orders?status=paid&page=1` | List orders |
| GET | `/api/admin/users?search=rahul` | List enrolled users |
| PATCH | `/api/admin/users/:id` | Update user (courseAccess, name, phone) |
| GET | `/api/admin/contacts?read=false` | List contact messages |
| PATCH | `/api/admin/contacts/:id/read` | Mark message as read |
| DELETE | `/api/admin/contacts/:id` | Delete contact message |

---

## 🔗 Frontend Integration

See `frontend-integration.js` for the updated `proceedToRazorpay()` and `handleContact()` functions to paste into your `index.html`.

**Key change:** The frontend now calls `/api/payment/create-order` first, then passes the `order_id` to Razorpay checkout. This enables server-side payment verification.

---

## 📧 Gmail Setup (for email notifications)

1. Enable **2-Factor Authentication** on your Gmail account
2. Go to **Google Account → Security → App Passwords**
3. Generate an app password for "Mail"
4. Use that 16-character password as `EMAIL_PASS` in `.env`

---

## 🚀 Deploying to Production

**Recommended: [Railway](https://railway.app) or [Render](https://render.com)**

1. Push this folder to a GitHub repo
2. Connect to Railway/Render
3. Set all environment variables in the dashboard
4. Set `NODE_ENV=production`
5. Update `BACKEND_URL` in your `index.html` to your deployed URL
6. Add webhook URL in Razorpay dashboard: `https://your-domain.com/api/payment/webhook`

---

## 🛡️ Security Notes

- Payment signature is verified server-side — Razorpay's recommended approach
- Admin routes are protected by a secret Bearer token
- Rate limiting on payment (30/15min) and contact (10/hour) routes
- CORS restricted to your domain in production
