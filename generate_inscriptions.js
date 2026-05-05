/**
 * generate_inscriptions.js
 * 
 * Generates 100 numbered inscription HTML files and 100 burn receipt templates.
 * 
 * Usage:
 *   1. Place wereNaked_v3.html and burn_receipt_template.html in same directory
 *   2. node generate_inscriptions.js
 *   3. Output: ./inscriptions/ (story files) and ./receipts/ (receipt templates)
 * 
 * Receipt templates have placeholder values — the agent fills these at burn time:
 *   BURN_TX_HASH  → actual BSV transaction hash
 *   BURN_DATE     → block timestamp of burn
 *   PHYSICAL_ISBN → your physical chapbook ISBN once registered
 */

const fs = require('fs');
const path = require('path');

// ── CONFIG ────────────────────────────────────────────────────────────────────
const COLLECTION_NAME = "We're Naked! — A Rapture in Three Acts";
const AUTHOR = "ChefMyKLove";
const TOTAL = 100;
const PRICE_BSV = 5;
const CHAIN = "BSV";
const REDEMPTION_URL = "https://chefmyklove.com/redeem";
const MINT_YEAR = 2026;
const REDEMPTION_WINDOW_YEARS = 5;
const REDEMPTION_EXPIRY = `${MINT_YEAR + REDEMPTION_WINDOW_YEARS}`;
const ISBN_EPUB = "978-1-0673516-0-1";
const PHYSICAL_ISBN = "[pending — bac-lac.gc.ca]";

// ── READ TEMPLATES ────────────────────────────────────────────────────────────
if (!fs.existsSync('wereNaked_v3.html')) {
  console.error('ERROR: wereNaked_v3.html not found in current directory.');
  process.exit(1);
}
if (!fs.existsSync('burn_receipt_template.html')) {
  console.error('ERROR: burn_receipt_template.html not found in current directory.');
  process.exit(1);
}

const storyTemplate = fs.readFileSync('wereNaked_v3.html', 'utf8');
const receiptTemplate = fs.readFileSync('burn_receipt_template.html', 'utf8');

// ── CREATE OUTPUT DIRS ────────────────────────────────────────────────────────
['inscriptions', 'receipts'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// ── GENERATE ─────────────────────────────────────────────────────────────────
let inscriptionCount = 0;
let receiptCount = 0;

for (let i = 1; i <= TOTAL; i++) {
  const num = String(i).padStart(3, '0');        // "001"
  const numDisplay = `#${num}`;                   // "#001"
  const editionLabel = `${numDisplay} of ${TOTAL}`; // "#001 of 100"

  // ── INSCRIPTION FILE ──────────────────────────────────────────────────────
  let inscription = storyTemplate;

  // Inject meta tags after <head>
  const metaTags = `
  <!-- BSV Inscription Metadata -->
  <meta name="bsv-collection" content="${COLLECTION_NAME}">
  <meta name="bsv-author" content="${AUTHOR}">
  <meta name="bsv-edition" content="${editionLabel}">
  <meta name="bsv-price" content="${PRICE_BSV} BSV">
  <meta name="bsv-chain" content="${CHAIN}">
  <meta name="bsv-isbn-epub" content="${ISBN_EPUB}">
  <meta name="bsv-isbn-physical" content="${PHYSICAL_ISBN}">
  <meta name="bsv-year" content="${MINT_YEAR}">
  <meta name="bsv-redemption-url" content="${REDEMPTION_URL}">
  <meta name="bsv-redemption-window" content="Open until ${REDEMPTION_EXPIRY}">
  <meta name="bsv-redemption-terms" content="Burn this inscription and submit proof at ${REDEMPTION_URL} to redeem hand-bound chapbook ${editionLabel}. Window closes ${REDEMPTION_EXPIRY}.">`;

  inscription = inscription.replace('<head>', `<head>${metaTags}`);

  // Update title
  inscription = inscription.replace(
    '<title>We\'re Naked! — A Rapture in Three Acts</title>',
    `<title>We're Naked! ${editionLabel} — ChefMyKLove</title>`
  );

  // Inject edition number display into the story header
  // Adds edition number and redemption note below the subtitle
  const editionDisplay = `
    <p class="edition-stamp">${editionLabel} &nbsp;&middot;&nbsp; ${PRICE_BSV} BSV &nbsp;&middot;&nbsp; <a href="${REDEMPTION_URL}" style="color:var(--dim);text-decoration:none;letter-spacing:1px">Burn to redeem chapbook</a></p>`;

  inscription = inscription.replace(
    '<p class="subtitle">A Rapture in Three Acts</p>',
    `<p class="subtitle">A Rapture in Three Acts</p>${editionDisplay}`
  );

  // Add edition-stamp CSS if not present
  if (!inscription.includes('.edition-stamp')) {
    inscription = inscription.replace(
      '.subtitle {',
      `.edition-stamp {
        text-align: center;
        font-family: 'Cormorant Garamond', serif;
        font-size: 0.72em;
        letter-spacing: 2px;
        color: var(--dim);
        margin-top: -24px;
        margin-bottom: 40px;
    }
    .subtitle {`
    );
  }

  const inscriptionPath = path.join('inscriptions', `wereNaked_${num}.html`);
  fs.writeFileSync(inscriptionPath, inscription, 'utf8');
  inscriptionCount++;

  // ── RECEIPT TEMPLATE ──────────────────────────────────────────────────────
  // Receipts have real edition data but placeholder burn fields
  // The agent fills BURN_TX_HASH, BURN_DATE, PHYSICAL_ISBN at redemption time
  let receipt = receiptTemplate;

  receipt = receipt
    .replace(/EDITION_NUM/g, num)           // all occurrences of EDITION_NUM → "042"
    .replace('PHYSICAL_ISBN', PHYSICAL_ISBN);
  // BURN_TX_HASH and BURN_DATE left as placeholders for agent to fill

  const receiptPath = path.join('receipts', `receipt_${num}.html`);
  fs.writeFileSync(receiptPath, receipt, 'utf8');
  receiptCount++;
}

// ── MANIFEST ─────────────────────────────────────────────────────────────────
const manifest = {
  collection: COLLECTION_NAME,
  author: AUTHOR,
  chain: CHAIN,
  total: TOTAL,
  price_bsv: PRICE_BSV,
  isbn_epub: ISBN_EPUB,
  isbn_physical: PHYSICAL_ISBN,
  mint_year: MINT_YEAR,
  redemption_window_closes: REDEMPTION_EXPIRY,
  redemption_url: REDEMPTION_URL,
  generated: new Date().toISOString(),
  inscriptions_generated: inscriptionCount,
  receipts_generated: receiptCount,
  files: {
    inscriptions: Array.from({length: TOTAL}, (_, i) => {
      const n = String(i+1).padStart(3,'0');
      return `inscriptions/wereNaked_${n}.html`;
    }),
    receipts: Array.from({length: TOTAL}, (_, i) => {
      const n = String(i+1).padStart(3,'0');
      return `receipts/receipt_${n}.html`;
    })
  }
};

fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  We're Naked! — Generation Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Inscriptions:  ${inscriptionCount}/100  →  ./inscriptions/
  Receipts:      ${receiptCount}/100  →  ./receipts/
  Manifest:      manifest.json

  Next steps:
  1. Inline fonts in wereNaked_v3.html (remove Google Fonts CDN)
  2. Embed cover art as base64
  3. Re-run this script
  4. Upload ./inscriptions/ to 3DOrdi
  5. Keep ./receipts/ for agent fulfillment system
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
