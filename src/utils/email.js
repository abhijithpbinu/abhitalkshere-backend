import nodemailer from 'nodemailer';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/** Notify admin of a new enrollment */
export async function sendEnrollmentEmail({ name, email, phone, paymentId }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const transporter = createTransport();
  await transporter.sendMail({
    from: `"Abhi Talks Here" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
    subject: `🎉 New Enrollment — ${name}`,
    html: `
      <h2>New Course Enrollment</h2>
      <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
        <tr><td style="padding:6px 12px;font-weight:bold">Name</td><td>${name}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold">Email</td><td>${email}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold">Phone</td><td>${phone}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold">Payment ID</td><td>${paymentId}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold">Amount</td><td>₹${process.env.COURSE_PRICE_INR || 999}</td></tr>
      </table>
      <p style="margin-top:16px">Add user to the Telegram group: <a href="${process.env.COURSE_TELEGRAM_URL}">${process.env.COURSE_TELEGRAM_URL}</a></p>
    `,
  });
}

/** Send welcome email to enrolled student */
export async function sendWelcomeEmail({ name, email, paymentId }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const transporter = createTransport();
  await transporter.sendMail({
    from: `"Abhi Talks Here" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Welcome to the AI Course, ${name}! 🚀`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h1 style="color:#D4A017">Welcome, ${name}! 🎓</h1>
        <p>Thank you for enrolling in the <strong>AI Mastery Course</strong> by Abhi Talks Here.</p>
        <p>Your payment was successful.</p>
        <p><strong>Payment ID:</strong> ${paymentId}</p>
        <p style="margin-top:24px">
          👉 <a href="${process.env.COURSE_TELEGRAM_URL}" style="color:#D4A017;font-weight:bold">Join your exclusive Telegram group here</a>
        </p>
        <p style="color:#999;font-size:12px;margin-top:32px">
          If you have any questions, reply to this email or reach out on Instagram @abhitalkshere.
        </p>
      </div>
    `,
  });
}

/** Notify admin of a new contact form submission */
export async function sendContactEmail({ name, email, subject, message }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const transporter = createTransport();
  await transporter.sendMail({
    from: `"Abhi Talks Here" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
    replyTo: email,
    subject: `📩 Contact Form: ${subject}`,
    html: `
      <h2>New Contact Message</h2>
      <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
        <tr><td style="padding:6px 12px;font-weight:bold">Name</td><td>${name}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold">Email</td><td>${email}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold">Subject</td><td>${subject}</td></tr>
      </table>
      <h3>Message</h3>
      <p style="font-family:sans-serif;white-space:pre-wrap">${message}</p>
    `,
  });
}
