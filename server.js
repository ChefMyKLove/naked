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
  const { amount, email, currency = 'cad', subscribe = false } = req.body;

  if (!amount || amount < 500) {
    return res.status(400).json({ error: 'Minimum donation is $5.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,      // already in cents from frontend
      currency,
      receipt_email: email,
      metadata: { email, subscribe: subscribe ? 'true' : 'false', source: 'were-naked-donation' }
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
      if (event.data.object.metadata.subscribe === 'true') {
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
            method: 'POST',
            headers: { ...supabaseHeaders(), 'Prefer': 'return=minimal' },
            body: JSON.stringify({ email, source: 'donation' })
          });
        } catch (err) {
          console.error('Subscriber insert error (donation opt-in):', err.message);
        }
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
    const siteUrl = process.env.SITE_URL || 'https://naked.chefmyklove.com';
    const unsubToken = Buffer.from(email).toString('base64url');
    const unsubUrl = `${siteUrl}/api/unsubscribe?t=${unsubToken}`;
    if (resend) {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: "You're on the list — ChefMyKLove",
        headers: { 'List-Unsubscribe': `<${unsubUrl}>` },
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#f5ede0;padding:0;">
            <div style="background:#1a1410;padding:32px 40px 24px;">
              <p style="font-family:Georgia,serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#8a7a6a;margin:0 0 20px;">ChefMyKLove</p>
              <h1 style="font-family:Georgia,serif;font-size:32px;font-weight:400;color:#f5ede0;margin:0 0 6px;line-height:1.15;">You're in.</h1>
              <p style="font-family:Georgia,serif;font-style:italic;font-size:16px;color:#b8965a;margin:0;">Welcome to the list.</p>
            </div>
            <div style="padding:40px 40px 32px;background:#f5ede0;">
              <p style="font-size:16px;color:#3a2f24;line-height:1.75;margin:0 0 20px;">
                Thank you for subscribing. You'll be among the first to hear about new releases,
                limited editions, events, and everything else happening in the world of ChefMyKLove.
              </p>
              <p style="font-size:16px;color:#3a2f24;line-height:1.75;margin:0 0 32px;">
                Right now, <em>We're Naked! A Rapture in Three Acts</em> is available to read online
                — $5 donation, half of which goes directly to Nanaimo Pride Society.
              </p>
              <a href="${siteUrl}" style="display:inline-block;background:#b8965a;color:#1a1410;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;padding:14px 28px;">
                Visit the Site
              </a>
            </div>
            <div style="padding:24px 40px;background:#ede3d4;border-top:1px solid #d4bc96;">
              <p style="font-family:Georgia,serif;font-size:13px;color:#6a5a4a;margin:0 0 8px;">— ChefMyKLove</p>
              <p style="font-size:11px;color:#9a8a7a;margin:0;line-height:1.6;">
                You subscribed at chefmyklove.com.
                If you'd rather not hear from us, <a href="${unsubUrl}" style="color:#9a8a7a;">unsubscribe here</a>.
              </p>
            </div>
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

// ── Unsubscribe ───────────────────────────────────────────
app.get('/api/unsubscribe', async (req, res) => {
  const { t } = req.query;
  if (!t) return res.status(400).send('Invalid unsubscribe link.');
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(503).send('Service not configured.');

  let email;
  try {
    email = Buffer.from(t, 'base64url').toString('utf8');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('invalid');
  } catch {
    return res.status(400).send('Invalid unsubscribe link.');
  }

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/subscribers?email=eq.${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: supabaseHeaders()
    });
  } catch (err) {
    console.error('Unsubscribe error:', err.message);
  }

  res.send(`
    <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
    <title>Unsubscribed — ChefMyKLove</title>
    <style>
      body{margin:0;background:#1a1410;color:#f0e6d2;font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:40px;}
      .box{max-width:420px;}
      .eyebrow{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#8a7a6a;margin-bottom:24px;}
      h1{font-size:32px;font-weight:400;color:#f5ede0;margin:0 0 16px;}
      p{color:#a09282;line-height:1.7;font-size:15px;}
      a{color:#b8965a;text-decoration:none;}
    </style></head><body>
    <div class="box">
      <p class="eyebrow">ChefMyKLove</p>
      <h1>You're unsubscribed.</h1>
      <p>You won't hear from us again. If you ever change your mind, you can always re-subscribe at <a href="https://naked.chefmyklove.com">naked.chefmyklove.com</a>.</p>
    </div>
    </body></html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
