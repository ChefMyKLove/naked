# We're Naked! — Complete Minting & Publishing Guide
## ChefMyKLove · 2026

---

## What You Have

| File | Contents |
|---|---|
| `inscriptions_100.zip` | 100 self-contained HTML inscription files (wereNaked_001.html → wereNaked_100.html) |
| `receipts_100.zip` | 100 burn receipt templates (receipt_001.html → receipt_100.html) |
| `wereNaked_001_SAMPLE.html` | Preview — open in browser to see inscription #001 |
| `receipt_001_SAMPLE.html` | Preview — open in browser to see receipt #001 |
| `manifest.json` | Collection metadata |
| `wereNaked_publishReady.docx` | Publish-ready interior for ebook platforms |
| `naked_landing.html` | Landing page for chefmyklove.com/naked |

Each inscription file contains:
- Complete interactive story with dust animation
- Cover art embedded (no external files needed)
- Both fonts embedded (no CDN, works offline forever)
- Your signature embedded
- Edition number (#001 of 100) visible on title screen
- BSV metadata in `<head>`
- Redemption terms (window closes 2031)

ISBNs:
- ePub: 978-1-0673516-0-1
- Physical chapbook: 978-1-0673516-1-8

---

# PART ONE: BSV INSCRIPTION (3DOrdi)

## Step 1 — Set Up Your BSV Wallet

You need a BSV wallet that supports inscription ownership.

**Option A: HandCash** (easiest, mobile-first)
1. Download HandCash from handcash.io
2. Create account, save your recovery phrase on paper — never digital
3. Fund with BSV (you'll need ~10–20 BSV to cover listing fees + buffer)
4. Note your receiving address — you'll use this as the destination for minted inscriptions

**Option B: Yours Wallet / Sensilet** (browser extension, more control)
1. Install from your browser's extension store
2. Create wallet, save seed phrase
3. Fund with BSV

**Assumption:** You likely already have a BSV wallet from ordinalrainbows.com work. Use that same wallet for consistency and community recognition.

---

## Step 2 — Set Up Your Burn Address

Before minting, you need a publicly committed burn address. This is a BSV address you will never spend from — it's where holders send inscriptions to redeem chapbooks.

1. Generate a **new, separate** BSV address in your wallet
2. Write down the address publicly in your collection description
3. Post it on X/Twitter before launch: *"The official burn address for We're Naked! redemptions: [address] — I publicly commit to never moving funds from this address."*
4. This public commitment is your proof-of-burn infrastructure

**Save this address permanently.** It goes in your collection description, on chefmyklove.com/redeem, and in the agent monitoring script.

---

## Step 3 — Prepare Your Files

1. Download `inscriptions_100.zip` from this session
2. Unzip to a folder on your desktop: `wereNaked_inscriptions/`
3. Open `wereNaked_001.html` in your browser — confirm it looks correct:
   - Cover art displays
   - Signature visible
   - Edition number shows "#001 of 100"
   - Dust animation triggers when you scroll to Part Two
4. If anything looks wrong, stop and fix before minting — inscriptions are permanent

---

## Step 4 — Mint on 3DOrdi

3DOrdi is your primary platform and this will be your debut collection there.

### 4a. Create Your Collection

1. Go to **3dordi.com** and connect your BSV wallet
2. Navigate to **Create Collection**
3. Fill in:
   - **Collection Name:** `We're Naked! — A Rapture in Three Acts`
   - **Creator:** `ChefMyKLove`
   - **Description:** (paste from below)
   - **Supply:** 100
   - **Price:** 5 BSV
   - **Royalty:** 10% (you receive 10% of every secondary sale — set this, it matters)
   - **Cover image:** Upload `IMG_0209.JPG`

### 4b. Collection Description (paste this)

```
A story about the morning of the end of the world.
Two people. A bed. A fan full of dust.

100 BSV inscriptions. Each contains the complete 
interactive story — full text, cover art, and an 
animated dust sequence that plays as you read. 
Self-contained. No server. No CDN. 
The story on-chain, permanently.

— BURN TO REDEEM THE PHYSICAL CHAPBOOK —

Each inscription is redeemable for a hand-bound 
Coptic-stitched chapbook — signed, numbered to match 
your inscription, and shipped by the author personally.

To redeem: Send your inscription to the burn address 
below, then submit proof at chefmyklove.com/redeem

Burn address: [YOUR BURN ADDRESS HERE]
Redemption window: Open until 2031

How many physical chapbooks will exist?
Unknown. It depends entirely on how many holders 
choose to burn. It could be one. It could be all 
one hundred. That uncertainty is part of the work.

Upon burning, a Certificate of Burn inscription 
is issued to your wallet — permanent on-chain proof 
of your redemption, and a collectible in its own right.

ISBN (ePub): 978-1-0673516-0-1
ISBN (Physical): 978-1-0673516-1-8
Published by ChefMyKLove · chefmyklove.com
```

### 4c. Upload the Inscription Files

3DOrdi's upload process may vary — check their current UI. Generally:

1. After creating the collection, look for **Add Items** or **Mint Items**
2. Upload the 100 HTML files from `wereNaked_inscriptions/`
3. They should auto-number 001–100 if uploaded in order
   - On Mac: select all, they upload alphabetically ✓
   - On Windows: select all in File Explorer sorted by name ✓
4. Confirm each file is ~658KB — if any are much smaller, something went wrong
5. Set per-item metadata if 3DOrdi supports it (edition number is already in each file)
6. Review and confirm — **inscriptions are permanent once submitted**
7. Pay the BSV inscription fees (near-zero on BSV — expect cents total for 100 files)

### 4d. After Minting

1. Verify at least 3 inscriptions in the collection viewer — check:
   - Story renders correctly
   - Edition number visible
   - Cover art shows
2. Note the **inscription transaction IDs** for your records — save these in your Airtable tracker
3. Collection is now live on 3DOrdi 🎉

---

## Step 5 — List on Zoide

1. Go to **zoide.com** and connect your BSV wallet
2. Your inscriptions should be visible in your wallet/collection
3. List them as a collection with the same description and price (5 BSV)
4. Zoide gives you secondary market exposure to a different BSV community segment

---

## Step 6 — Set Up Redemption Infrastructure

### 6a. Redemption Form (chefmyklove.com/redeem)

Create a simple form page. Easiest options:

**Netlify Forms (free):**
1. Create a `redeem.html` page on your site with this form:

```html
<form name="redemption" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="redemption">
  <input type="text" name="inscription_number" placeholder="Inscription number (e.g. 042)" required>
  <input type="text" name="burn_tx_hash" placeholder="Burn transaction hash" required>
  <input type="text" name="name" placeholder="Your name" required>
  <textarea name="shipping_address" placeholder="Full shipping address including country" required></textarea>
  <input type="email" name="email" placeholder="Email for shipping confirmation" required>
  <button type="submit">Submit Redemption</button>
</form>
```

2. Deploy to Netlify — form submissions appear in your Netlify dashboard and can email you automatically

**Alternative:** Formspree.io — paste their endpoint into a standard HTML form, free for 50 submissions/month (more than enough)

### 6b. Airtable Redemption Tracker

1. Go to airtable.com, create free account
2. Create a new base: "We're Naked! Redemptions"
3. Add these fields:

| Field Name | Type |
|---|---|
| Inscription # | Number |
| Burn Tx Hash | Single line text |
| Burn Verified | Checkbox |
| Redeemer Name | Single line text |
| Shipping Address | Long text |
| Email | Email |
| Redemption Date | Date |
| Chapbook Bound | Checkbox |
| Chapbook # | Number |
| Shipped Date | Date |
| Tracking Number | Single line text |
| Notes | Long text |

4. Keep this open on your phone — when a redemption comes in, verify the burn on WhatsOnChain (whatsonchain.com), tick Burn Verified, bind the chapbook, ship it, add tracking

---

# PART TWO: EBOOK PLATFORMS

## Step 7 — Amazon KDP (Kindle)

1. Go to **kdp.amazon.com** — sign in or create account
2. Click **+ Create** → **eBook**
3. Fill in:
   - **Title:** We're Naked!
   - **Subtitle:** A Rapture in Three Acts
   - **Author:** ChefMyKLove
   - **Description:** (use the press release copy from the marketing brief)
   - **Keywords:** literary fiction, short story, apocalypse, BSV, experimental fiction, Canadian fiction
   - **Categories:** Fiction > Short Stories; Fiction > Literary
   - **ISBN:** 978-1-0673516-0-1 ← enter this
4. **Upload manuscript:** Upload `wereNaked_publishReady.docx`
5. **Upload cover:** Upload `IMG_0209.JPG` — KDP needs 1600×2560px minimum. Your cover is square — **you will need a portrait version.** Either:
   - Add a plain dark letterbox above/below the image in Canva (free)
   - Or ask me to generate a portrait cover layout
6. **Pricing:**
   - Set to **$2.99 USD**
   - Select **70% royalty** (requires $2.99 minimum — you qualify)
   - Enable all territories
7. **KDP Select:** DO NOT enroll — this requires exclusivity and prevents Kobo/Apple sales
8. Click **Publish** — goes live within 24–72 hours

---

## Step 8 — Kobo Writing Life

1. Go to **kobowritinglife.com** — create account
2. Click **Create eBook**
3. Same metadata as KDP
4. **Upload manuscript:** Same `wereNaked_publishReady.docx`
5. **Cover:** Same portrait cover (1600×2400px preferred)
6. **Price:** $2.99 CAD (or set USD and let Kobo convert)
7. Publish — Kobo is Canada's home platform, this matters for your audience

---

## Step 9 — Draft2Digital (All Other Platforms)

D2D distributes to Apple Books, Barnes & Noble, Scribd, Tolino, Overdrive, and a dozen more — one upload covers everything.

1. Go to **draft2digital.com** — create account
2. Click **Add New Book**
3. Same metadata, manuscript, cover
4. **ISBN:** Enter 978-1-0673516-0-1
5. **Select distribution channels:** Check all (Apple Books, B&N, Scribd, etc.)
6. **Price:** $2.99 USD
7. Publish — D2D distributes within 1–5 days per platform

**Note:** Do NOT submit to Amazon via D2D — you're already direct on KDP. D2D has a checkbox to exclude Amazon.

---

## Step 10 — Deploy Landing Page

1. Download `naked_landing.html` from this session
2. Upload to your chefmyklove.com hosting as `/naked/index.html`
   - On Vercel: drag into project or push to GitHub
   - On any host: upload via FTP/file manager
3. Update all placeholder links with real URLs once platforms go live:
   - Amazon KDP link
   - Kobo link
   - 3DOrdi collection link
4. Update the Ordinal section burn address with your actual BSV burn address

---

# PART THREE: LAUNCH SEQUENCE

## Week 1 — Pre-Launch

| Day | Action |
|---|---|
| Day 1 | Post burn address publicly on X/Twitter |
| Day 1 | Set up Airtable tracker |
| Day 1 | Set up Netlify/Formspree redemption form |
| Day 2 | Submit to KDP, Kobo, D2D simultaneously |
| Day 3 | Mint on 3DOrdi |
| Day 4 | List on Zoide |
| Day 5 | Deploy chefmyklove.com/naked |
| Day 5 | Announce on X/Twitter — BSV community first |
| Day 7 | Announce on Facebook — personal audience |

## Week 2 — Amplify

| Action | Target |
|---|---|
| Post on X: "001 of 100 just found its home" when first inscription sells | BSV community |
| Email CoinGeek with press release | BSV media |
| Post on r/bitcoinsv | Reddit |
| Submit to Broken Pencil magazine | Canadian lit |
| Tag @3DOrdi and @Zoide on launch posts | Community |
| Post opening paragraph of story on Wattpad with link | Literary audience |

## Ongoing

- Every burn: post publicly "Inscription #X has been burned. Chapbook #X is being bound."
- Document the binding process — photos of you hand-binding are marketing gold
- "X of 100 inscriptions remaining" posts build urgency

---

# PART FOUR: THE CHAPBOOK

## Materials to Order Now

| Item | Where | Cost |
|---|---|---|
| Bookbinding needle (pack) | Amazon or local art store | ~$8 |
| Waxed linen thread | Amazon | ~$10 |
| Bone folder | Amazon | ~$8 |
| Bookbinding awl | Amazon | ~$10 |
| Cutting mat + metal ruler | Already own? If not: ~$20 |
| **Total** | | **~$56 CAD** |

## Per-Chapbook Production

1. **Cover:** Print on 100lb card stock at Staples or local print shop
   - File: `IMG_0209.JPG` — crop to 5.5"×8.5" (portrait), add title text if desired
   - Cost: ~$3–5 per cover
2. **Interior:** Print `wereNaked_publishReady.docx` on cream paper, double-sided
   - Cost: ~$1–2 per copy at Staples
3. **Bind:** Coptic stitch (search "Coptic stitch bookbinding tutorial" on YouTube — 2hrs to learn, 30min per book after that)
4. **QR code:** Generate at qr-code-generator.com linking to the burned inscription's WhatsOnChain URL
   - Print small, glue inside back cover
5. **Sign:** Sign title page
6. **Box:** Rigid cardboard mailer from Staples (~$2), optional wax seal on envelope

**Total per chapbook: ~$8–12 CAD**
**Revenue per chapbook redemption: 5 BSV (~$100 CAD at current price)**

---

## Summary Checklist

- [ ] BSV wallet set up, burn address generated and published
- [ ] Unzip inscriptions_100.zip, verify sample opens correctly
- [ ] Mint on 3DOrdi (debut collection)
- [ ] List on Zoide
- [ ] Submit to Amazon KDP (portrait cover needed)
- [ ] Submit to Kobo Writing Life
- [ ] Submit to Draft2Digital
- [ ] Deploy chefmyklove.com/naked landing page
- [ ] Set up redemption form (Netlify/Formspree)
- [ ] Set up Airtable tracker
- [ ] Order chapbook binding supplies
- [ ] Apply for physical chapbook ISBN at bac-lac.gc.ca ← if not done yet

---

*ChefMyKLove · We're Naked! A Rapture in Three Acts*
*ePub ISBN: 978-1-0673516-0-1 · Physical ISBN: 978-1-0673516-1-8*
*chefmyklove.com · ordinalrainbows.com*
