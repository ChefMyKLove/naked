# We're Naked! — BSV Inscription Project Brief
## ChefMyKLove · ordinalrainbows.com · 3DOrdi · 2026

---

## Overview

Mint 100 BSV inscriptions of *We're Naked! A Rapture in Three Acts* by ChefMyKLove on 3DOrdi as a debut collection. Each inscription is a self-contained interactive HTML file containing the complete story, embedded cover art, and the dust animation sequence. Holders may burn their inscription within a 5-year redemption window to receive a hand-bound physical chapbook.

---

## Collection Specs

| Parameter | Value |
|---|---|
| Platform | 3DOrdi (primary), Zoide (secondary) |
| Chain | BSV (Bitcoin SV) |
| Supply | 100 inscriptions |
| Price | 5 BSV per inscription |
| Gross (sold out) | 500 BSV |
| Gross at $20 CAD/BSV | ~$10,000 CAD |
| File format | Self-contained HTML |
| Redemption window | 5 years from mint date |
| Physical redemption | Hand-bound chapbook, Coptic stitch |

---

## The Inscription File

**Prepare before minting:**

The current `wereNaked_v3.html` references external resources (Google Fonts CDN). Before inscribing, make it fully self-contained:

1. **Inline the fonts** — download Cormorant Garamond and Crimson Text WOFF2 files, base64-encode them, embed as `@font-face` in the CSS. This ensures the story renders correctly with no external dependencies, forever.

2. **Embed the cover art** — convert `IMG_0209.JPG` to base64 and add it as an `<img>` tag or CSS background in the HTML header section.

3. **Add per-inscription metadata** to each file's `<head>`:

```html
<meta name="title" content="We're Naked! — A Rapture in Three Acts">
<meta name="author" content="ChefMyKLove">
<meta name="collection" content="We're Naked! — Inscription Edition">
<meta name="edition" content="#001 of 100">
<meta name="isbn-epub" content="978-1-0673516-0-1">
<meta name="isbn-physical" content="[pending — apply at bac-lac.gc.ca]">
<meta name="year" content="2026">
<meta name="redemption-terms" content="Burn to redeem hand-bound chapbook. Window: 5 years from mint. chefmyklove.com/redeem">
```

Edition number (#001 through #100) must be unique per file. Use the generation script (see below) to produce all 100 files automatically.

---

## File Generation Script

Run this once to produce 100 uniquely numbered HTML files ready for inscription:

```javascript
// generate_inscriptions.js
const fs = require('fs');
const template = fs.readFileSync('wereNaked_v3.html', 'utf8');

for (let i = 1; i <= 100; i++) {
  const num = String(i).padStart(3, '0');
  let file = template
    .replace('#001 of 100', `#${num} of 100`)
    .replace('content="#001 of 100"', `content="#${num} of 100"`);
  fs.writeFileSync(`inscriptions/wereNaked_${num}.html`, file);
}
console.log('100 inscription files generated.');
```

```bash
mkdir inscriptions && node generate_inscriptions.js
```

---

## Minting on 3DOrdi

1. Connect your BSV wallet to 3DOrdi
2. Create a new collection — "We're Naked! by ChefMyKLove"
3. Upload all 100 HTML files
4. Set price: 5 BSV per inscription
5. Set supply: 100
6. Add collection description (see Listing Copy below)
7. Publish

**Also list on Zoide** after 3DOrdi launch — secondary market exposure, different community segment.

**Your GIF minter** can serve as a backup minting path if 3DOrdi has any limitations with HTML files. HTML inscriptions on BSV are well-supported but confirm with 3DOrdi's current file type support before upload day.

---

## Listing Copy

**Collection title:**
> We're Naked! — A Rapture in Three Acts

**Collection description:**
> A story about the morning of the end of the world. Two people. A one-room flat. A whole day ahead.
>
> 100 BSV inscriptions. Each contains the complete interactive story — full text, cover art, and an animated dust sequence that plays as you read. Self-contained. No server. No CDN. The story on-chain, permanently.
>
> **Burn to redeem the physical chapbook.**
> Each inscription is redeemable for a hand-bound Coptic-stitched chapbook — signed, numbered, and shipped by the author. Send your inscription to the burn address, submit proof at chefmyklove.com/redeem, and receive your copy within 30 days.
>
> Redemption window: 5 years from mint date.
> After that, inscriptions remain valid collectibles — the redemption window simply closes.
>
> How many physical chapbooks will exist? Unknown. It depends entirely on how many holders choose to burn. It could be one. It could be all one hundred.
>
> ISBN 978-1-0673516-0-1 (ePub) · ISBN 978-1-0673516-1-8 (Physical chapbook)
> Published by ChefMyKLove · chefmyklove.com
>
> Upon burning, a Certificate of Burn inscription is issued to your wallet — permanent on-chain proof of your redemption, and a collectible in its own right.

---

## Burn Receipt Ordinal

When a holder burns their inscription, a **Certificate of Burn** Ordinal is inscribed back to their wallet automatically (Phase 1: manually; Phase 2: via agent). This receipt is itself a tradeable BSV artifact.

**What the receipt contains:**
- Edition number (#X of 100)
- Burn transaction hash
- Date of burn
- Confirmation that chapbook #X has been dispatched
- Author signature (embedded)
- Both ISBNs
- Statement: *"The digital is gone. The physical exists because of this act. This receipt is all that remains on-chain."*

**Why it has value:** If only 12 of 100 inscriptions ever get burned, only 12 receipts exist — ever. The receipt is proof of a destructive act, which is rarer than the original inscription. Secondary market value is plausible.

**Receipt files:** `receipts_100.zip` — 100 pre-numbered templates. At burn time, fill `BURN_TX_HASH` and `BURN_DATE` then inscribe to the redeemer's wallet.

---

## Signature

Author signature (ChefMyKLove) is embedded in:
- All 100 inscription HTML files (cream/gold version, visible on title screen)
- All 100 burn receipt templates (dark ink version on cream background)
- Portrait cover art files

Source files: `sig_cream.png`, `sig_dark.png` (stored locally from session — re-upload if needed).

---

### Burn Address
Designate a BSV address you control but publicly commit never to spend from — or use a provably unspendable address. Document the burn address publicly in the collection description and on chefmyklove.com/redeem before launch.

**Recommended:** Use a dedicated BSV address you generate from a separate seed phrase, publish the address publicly, and commit on-chain and on your site that you will never move funds from it. This is more transparent than a cryptographic burn address and allows you to confirm burns without running a full node.

### Redemption Flow (Manual / Current)
1. Holder sends inscription to burn address
2. Holder submits burn tx hash + name + shipping address at chefmyklove.com/redeem
3. You verify burn on WhatsOnChain or similar BSV explorer
4. Hand-bind chapbook numbered to match inscription
5. Ship within 30 days
6. Log in redemption tracker (see Agent System below)

---

## Agent-Based Redemption System

### Goal
A Claude agent (or similar) monitors the burn address, verifies redemptions on-chain, manages the fulfillment queue, and handles all communication — so the system runs without your active involvement and can outlive your direct participation.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  BSV Burn Address Monitor                           │
│  Polls WhatsOnChain API every 10 minutes            │
│  Detects new incoming transactions                   │
└──────────────────────┬──────────────────────────────┘
                       │ new burn detected
                       ▼
┌─────────────────────────────────────────────────────┐
│  Redemption Matcher                                 │
│  Reads inscription number from tx metadata          │
│  Matches against pending redemption form submission │
│  Flags mismatches for manual review                 │
└──────────────────────┬──────────────────────────────┘
                       │ match confirmed
                       ▼
┌─────────────────────────────────────────────────────┐
│  Fulfillment Queue (Airtable or Notion DB)          │
│  Fields: inscription #, burn tx, name,              │
│  address, date, status, tracking number             │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐     ┌──────────────────────────┐
│  Email Agent     │     │  Notification to Author  │
│  Sends confirm   │     │  "New redemption queued: │
│  to redeemer     │     │   #042, ship to [name]"  │
│  with ETA        │     │                          │
└──────────────────┘     └──────────────────────────┘
```

### Phase 1 — Semi-Automated (Build Now)

**Stack:**
- **Redemption form:** Netlify Forms or Formspree (free tier) at chefmyklove.com/redeem
- **Fulfillment database:** Airtable (free tier, 100 rows more than enough)
- **BSV monitoring:** WhatsOnChain API (free, no auth required)
- **Email:** Resend or Postmark (free tier, transactional email)
- **Glue script:** Node.js cron job running on Railway (free tier) or Vercel serverless function

**Cron job logic (runs every 10 min):**
```javascript
// monitor_burns.js
const BURN_ADDRESS = 'your_burn_address_here';
const AIRTABLE_API = process.env.AIRTABLE_API_KEY;
const RESEND_API = process.env.RESEND_API_KEY;

async function checkBurns() {
  // 1. Fetch recent txs to burn address
  const res = await fetch(
    `https://api.whatsonchain.com/v1/bsv/main/address/${BURN_ADDRESS}/history`
  );
  const txs = await res.json();

  // 2. For each new tx, check against Airtable pending queue
  for (const tx of txs) {
    const match = await findPendingRedemption(tx.tx_hash);
    if (match && !match.fields['Burn Verified']) {
      await markVerified(match.id, tx.tx_hash);
      await sendConfirmationEmail(match.fields);
      await notifyAuthor(match.fields);
    }
  }
}
```

### Phase 2 — Fully Automated (Future)

When print-on-demand chapbook production becomes viable (or if you partner with a local bindery):

- Agent receives verified redemption
- Agent submits print order to bindery API
- Bindery produces and ships directly
- Agent sends tracking number to redeemer
- Zero human involvement required

**This is the perpetual automation goal.** The 5-year window buys time to build it. If Phase 2 is live before 2031, extend or remove the window.

### Redemption Window Terms (on-chain + site)

> *Physical redemption of this inscription is guaranteed through [MINT DATE + 5 years]. After this date, the inscription remains a valid BSV collectible but physical fulfillment is subject to author availability. ChefMyKLove commits to best-effort fulfillment beyond the window where operationally possible.*

---

## The Chapbook

**ISBN:** 978-1-0673516-1-8 (confirmed — physical chapbook edition)

**Specs:**
- Size: 5.5" × 8.5" (standard chapbook)
- Cover: 100lb card stock, full-bleed cover art, printed at Staples or local print shop
- Interior: Cream paper, Garamond 12pt, laser printed
- Binding: Coptic stitch (open spine, lays flat)
- Signed by ChefMyKLove on title page
- Numbered: "#X of 100" on copyright page
- Inside back cover: QR code → BSV inscription on-chain

**Inside back cover QR links to:**
`https://whatsonchain.com/tx/[inscription-tx-id]`

This gives the chapbook permanent, verifiable provenance. Anyone holding the physical book can scan and confirm exactly which inscription was burned to produce it.

**Material cost per chapbook:** ~$5–8 CAD
**Binding supplies (one-time):** ~$50 CAD

---

## Redemption Tracker

Keep this as an Airtable base. Fields:

| Field | Type |
|---|---|
| Inscription # | Number |
| Burn Tx Hash | Text |
| Burn Verified | Checkbox |
| Redeemer Name | Text |
| Shipping Address | Long text |
| Redemption Date | Date |
| Chapbook Bound | Checkbox |
| Shipped Date | Date |
| Tracking Number | Text |
| Notes | Long text |

---

## Timeline

| Week | Action |
|---|---|
| 1 | ✅ Physical chapbook ISBN confirmed: 978-1-0673516-1-8 |
| 1 | ✅ 100 inscription HTML files built — fonts, cover art, signature embedded |
| 1 | ✅ 100 burn receipt templates built |
| 1 | ✅ Portrait covers built (BSV + ebook versions) |
| 1 | ✅ Landing page built — deploy to chefmyklove.com/naked |
| 1 | ⏳ Clean source image for cover (remove text at cleanup.pictures, send back) |
| 1 | ⏳ Set up BSV wallet, designate burn address, publish publicly |
| 2 | ⏳ Deploy chefmyklove.com/naked landing page |
| 2 | ⏳ Build redemption form at chefmyklove.com/redeem |
| 2 | ⏳ Set up Airtable redemption tracker |
| 2 | ⏳ Mint on 3DOrdi — debut collection |
| 2 | ⏳ List on Zoide |
| 2 | ⏳ Announce on X/Twitter BSV community |
| 3 | ⏳ Build Phase 1 burn monitor (Node.js + WhatsOnChain) |
| 3 | ⏳ Press outreach — BSV media + literary crossover |
| Ongoing | Fulfill redemptions, inscribe burn receipts, log in Airtable |
| 2027+ | Evaluate Phase 2 automation |

---

## Press Angles

**BSV / crypto media:**
- BSV-specific: CoinGeek (coingeek.com) — they cover BSV ecosystem actively
- Bitcoin Association announcements
- BSV Discord/Telegram communities
- @3DOrdi and @Zoide social accounts — tag them on launch

**Literary crossover:**
- "Canadian author inscribes debut short story on BSV — holders burn the digital to claim a hand-bound physical book"
- Broken Pencil (Canadian indie lit)
- Literary Hub
- CBC Books — the BSV angle makes it genuinely unusual

**The hook that works everywhere:**
> *"The rarest book in Canada has no fixed print run. Every copy that exists is proof that someone chose to destroy something permanent to create something physical."*

---

## Project Dependencies

| Item | Status | Action |
|---|---|---|
| ePub ISBN | ✅ 978-1-0673516-0-1 | Done |
| Physical chapbook ISBN | ✅ 978-1-0673516-1-8 | Done |
| BSV wallet | ⏳ Pending | Set up, designate burn address |
| HTML inscription files | ✅ Built | 100 files in inscriptions_100.zip — fonts, cover art, signature all embedded |
| Burn receipt files | ✅ Built | 100 templates in receipts_100.zip — edition numbers pre-filled, awaiting burn tx data |
| Signature | ✅ Embedded | Author signature embedded in all inscription files and receipts |
| Cover art (portrait) | ✅ Built | cover_bsv_1600x2560.jpg + cover_ebook_1600x2560.jpg — pending clean source image for tree version |
| 3DOrdi account | ⏳ Pending | Connect wallet, create collection |
| Landing page | ✅ Built | Deploy to chefmyklove.com/naked |
| Redemption form | ⏳ Pending | Netlify Forms or Formspree |
| Airtable tracker | ⏳ Pending | Set up base |
| Burn monitor script | ⏳ Pending | Build Phase 1 |
| Chapbook supplies | ⏳ Pending | Order bookbinding kit |

---

*ChefMyKLove · chefmyklove.com · ordinalrainbows.com*
*We're Naked! — A Rapture in Three Acts*
*ePub ISBN: 978-1-0673516-0-1 · Physical ISBN: 978-1-0673516-1-8*
