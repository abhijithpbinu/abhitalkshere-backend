/**
 * FRONTEND INTEGRATION GUIDE
 * ──────────────────────────
 * Replace the relevant JS sections in your index.html with the code below.
 * This connects your frontend to the Express backend.
 */

// ── CONFIG ─────────────────────────────────────────────────
const BACKEND_URL = 'http://localhost:3000'; // Change to your deployed URL in production

// ── PAYMENT FLOW ───────────────────────────────────────────
// Replace your existing proceedToRazorpay() function with this:

async function proceedToRazorpay() {
  const name  = document.getElementById('payName').value.trim();
  const email = document.getElementById('payEmail').value.trim();
  const phone = document.getElementById('payPhone').value.trim();

  if (!name)                        { alert('Please enter your name.');              return; }
  if (!email || !email.includes('@')){ alert('Please enter a valid email.');         return; }
  if (!phone || phone.length < 10)  { alert('Please enter a valid phone number.');   return; }

  const btn = document.getElementById('payBtn');
  btn.disabled = true;
  btn.textContent = 'Creating order...';

  try {
    // Step 1 — Create order on server
    const orderRes = await fetch(`${BACKEND_URL}/api/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone }),
    });
    const orderData = await orderRes.json();

    if (!orderRes.ok) throw new Error(orderData.error || 'Order creation failed');

    // Step 2 — Open Razorpay checkout
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.orderId,        // ← important: links checkout to server order
      name: 'Abhi Talks Here',
      description: 'AI Course Lifetime Access',
      prefill: { name, email, contact: phone },
      theme: { color: '#D4A017' },
      modal: {
        backdropclose: false,
        ondismiss: function () {
          btn.disabled = false;
          btn.textContent = 'Pay ₹999 Securely';
        },
      },

      // Step 3 — Verify payment on server after success
      handler: async function (response) {
        btn.textContent = 'Verifying...';
        try {
          const verifyRes = await fetch(`${BACKEND_URL}/api/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            }),
          });
          const result = await verifyRes.json();

          if (!verifyRes.ok) throw new Error(result.error || 'Verification failed');

          // Show success
          document.getElementById('payModal').style.display = 'none';
          document.body.style.overflow = '';
          document.getElementById('courseLink').href = result.courseUrl;
          document.getElementById('successPayId').textContent = 'Payment ID: ' + response.razorpay_payment_id;
          document.getElementById('successOverlay').style.display = 'flex';

        } catch (err) {
          alert('Payment received but verification failed. Please contact support with Payment ID: ' + response.razorpay_payment_id);
        }
      },
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (resp) {
      btn.disabled = false;
      btn.textContent = 'Pay ₹999 Securely';
      alert('Payment failed: ' + resp.error.description + '\nPlease try again.');
    });
    rzp.open();

  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Pay ₹999 Securely';
    alert('Could not initiate payment: ' + err.message);
  }
}

// ── CONTACT FORM ───────────────────────────────────────────
// Replace your existing handleContact() function with this:

async function handleContact() {
  const btn = document.querySelector('.btn-send');

  // Read your form fields (update selectors to match your HTML IDs)
  const name    = document.getElementById('contactName')?.value?.trim()    || '';
  const email   = document.getElementById('contactEmail')?.value?.trim()   || '';
  const subject = document.getElementById('contactSubject')?.value?.trim() || '';
  const message = document.getElementById('contactMessage')?.value?.trim() || '';

  if (!name || !email || !message) {
    alert('Please fill in all required fields.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    const res = await fetch(`${BACKEND_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    btn.textContent = 'Sent! I will reply soon.';
    btn.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Send Message';
      btn.style.background = 'linear-gradient(135deg,var(--gold),#B8860B)';
    }, 3000);

  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Send Message';
    alert('Failed to send message. Please try again.');
  }
}
