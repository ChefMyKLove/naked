const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

// CORS — defaults to known production domains.
// Override by setting ALLOWED_ORIGINS in Railway (comma-separated).
const defaultOrigins = [
  'https://naked.chefmyklove.com',
  'https://chefmyklove.com'
];
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : defaultOrigins;

app.use(cors({ origin: allowedOrigins }));

// Raw body required for Stripe webhook signature verification
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ── Health check ──────────────────────────────────────────
app.get('/', (_req, res) => res.json({ ok: true }));

// ── Create PaymentIntent ──────────────────────────────────
app.post('/api/donate', async (req, res) => {
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
    const storyUrl = process.env.STORY_ACCESS_URL || 'https://naked.chefmyklove.com/read';
    const fromEmail = process.env.FROM_EMAIL || 'hello@chefmyklove.com';

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
