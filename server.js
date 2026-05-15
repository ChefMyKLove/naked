const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

// Supabase REST helpers — no SDK, just fetch
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function supabaseHeaders() {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };
}

async function insertToken(token, email) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/access_tokens`, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify({ token, email })
  });
  if (!res.ok) throw new Error(`Supabase insert failed: ${await res.text()}`);
}

async function verifyToken(token) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/access_tokens?token=eq.${encodeURIComponent(token)}&select=token`,
    { headers: supabaseHeaders() }
  );
  if (!res.ok) return false;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0;
}

const app = express();
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// CORS — production domains are always allowed.
// ALLOWED_ORIGINS env var (comma-separated) adds extras but never removes the defaults.
const defaultOrigins = [
  'https://naked.chefmyklove.com',
  'https://chefmyklove.com'
];
const extraOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];
const allowedOrigins = [...new Set([...defaultOrigins, ...extraOrigins])];
console.log('CORS allowed origins:', allowedOrigins);

const corsOptions = { origin: allowedOrigins, optionsSuccessStatus: 200 };
app.options('*', cors(corsOptions));   // explicit preflight handler for all routes
app.use(cors(corsOptions));

// Raw body required for Stripe webhook signature verification
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ── Health check ──────────────────────────────────────────
app.get('/', (_req, res) => res.json({ ok: true }));

// ── Verify story access token ─────────────────────────────
app.get('/api/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.json({ valid: false });
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.json({ valid: false, error: 'Database not configured.' });

  try {
    const valid = await verifyToken(token);
    res.json({ valid });
  } catch (err) {
    console.error('Verify error:', err.message);
    res.json({ valid: false });
  }
});

// ── Create PaymentIntent ──────────────────────────────────
app.post('/api/donate', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payment service not configured.' });
  const { amount, email, currency = 'cad' } = req.body;

  if (!amount || amount < 500) {
    return res.status(400).json({ error: 'Minimum donation is $5.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,      // already in cents from frontend
      currency,
      receipt_email: email,
      metadata: { email, source: 'were-naked-donation' }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe PaymentIntent error:', err.message);
    res.status(500).json({ error: 'Payment setup failed — please try again.' });
  }
});

// ── Stripe webhook — sends access-link email on success ───
app.post('/api/webhook', async (req, res) => {
  if (!stripe) return res.status(503).send('Webhook handler not configured.');
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const { email } = event.data.object.metadata;
    const baseUrl = process.env.STORY_ACCESS_URL || 'https://naked.chefmyklove.com/story';
    const fromEmail = process.env.FROM_EMAIL || 'hello@chefmyklove.com';

    // Generate a unique access token and store it in Supabase
    const accessToken = crypto.randomUUID();
    if (SUPABASE_URL && SUPABASE_KEY && email) {
      try {
        await insertToken(accessToken, email);
      } catch (err) {
        console.error('Supabase token insert error:', err.message);
      }
    }
    const storyUrl = `${baseUrl}?token=${accessToken}`;

    if (process.env.RESEND_API_KEY && email) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: "Your access link — We're Naked!",
          html: `
            <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2a1f14;padding:40px 24px;">
              <p style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#8a7a6a;">ChefMyKLove</p>
              <h1 style="font-size:28px;font-weight:400;margin:16px 0 8px;">Thank you.</h1>
              <p style="color:#5a4a3a;line-height:1.7;">
                Half of your donation is going directly to Nanaimo Pride Society —
                and that matters more than words can say.
              </p>
              <p style="margin-top:32px;font-size:15px;color:#2a1f14;">
                Here's your access link to read <em>We're Naked! A Rapture in Three Acts</em>:
              </p>
              <p style="margin:24px 0;">
                <a href="${storyUrl}" style="background:#b8965a;color:#fff;padding:14px 28px;text-decoration:none;font-size:14px;letter-spacing:2px;text-transform:uppercase;">
                  Read the Story
                </a>
              </p>
              <p style="font-size:13px;color:#8a7a6a;margin-top:8px;">
                Or copy this link: <a href="${storyUrl}" style="color:#b8965a;">${storyUrl}</a>
              </p>
              <p style="margin-top:48px;font-size:13px;color:#8a7a6a;border-top:1px solid #e8dcc8;padding-top:24px;">
                — ChefMyKLove
              </p>
            </div>
          `
        });
        console.log(`Access link sent to ${email}`);
      } catch (err) {
        console.error('Email send error:', err.message);
      }
    } else {
      console.log(`Payment succeeded for ${email} — no RESEND_API_KEY set, email not sent.`);
    }
  }

  res.json({ received: true });
});

// ── Mailing list subscribe ────────────────────────────────
app.post('/api/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(503).json({ error: 'Service not configured.' });
  }

  try {
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
      method: 'POST',
      headers: { ...supabaseHeaders(), 'Prefer': 'return=minimal' },
      body: JSON.stringify({ email, source: 'website' })
    });

    if (insertRes.status === 409) {
      return res.json({ already: true });
    }
    if (!insertRes.ok) {
      throw new Error(`Supabase error: ${await insertRes.text()}`);
    }

    const fromEmail = process.env.FROM_EMAIL || 'hello@chefmyklove.com';
    if (resend) {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: "You're on the list — ChefMyKLove",
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2a1f14;padding:40px 24px;">
            <p style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#8a7a6a;">ChefMyKLove</p>
            <h1 style="font-size:26px;font-weight:400;margin:16px 0 8px;">You're in.</h1>
            <p style="color:#5a4a3a;line-height:1.7;">
              Thank you for subscribing. You'll be among the first to hear about new releases,
              limited editions, and everything happening in the world of ChefMyKLove.
            </p>
            <p style="margin-top:48px;font-size:13px;color:#8a7a6a;border-top:1px solid #e8dcc8;padding-top:24px;">
              — ChefMyKLove
            </p>
          </div>
        `
      }).catch(err => console.error('Subscribe welcome email error:', err.message));
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Subscribe error:', err.message);
    res.status(500).json({ error: 'Something went wrong — please try again.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
