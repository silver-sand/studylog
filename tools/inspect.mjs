import { chromium } from 'playwright';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COOKIE_FILE = join(__dirname, '..', '.inspect-session.json');
const OUT = join(__dirname, '..', 'screenshots');
mkdirSync(OUT, { recursive: true });

const BASE = process.argv[2] || 'http://localhost:4321';
const ACTION = process.argv[3] || 'browse';
const TARGET = process.argv[4] || '/';
const FULL_PAGE = process.argv.includes('--full') || process.argv.includes('-f');

let browser;
let context;

async function ensureSession() {
  context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  if (existsSync(COOKIE_FILE)) {
    const cookies = JSON.parse(readFileSync(COOKIE_FILE, 'utf-8'));
    await context.addCookies(cookies);
    return;
  }

  // Fresh signup
  const p = await context.newPage();
  const ts = Date.now();
  const resp = await p.request.post(`${BASE}/api/auth/signup`, {
    data: { name: 'Inspect Bot', email: `inspect-${ts}@local.dev`, password: 'inspect123' },
  });
  if (resp.status() !== 201) {
    const body = await resp.text();
    throw new Error(`Signup failed: ${resp.status()} ${body}`);
  }
  await p.close();
}

async function browse(url) {
  const p = await context.newPage();
  try {
    await p.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(1500);
    const name = url.replace(BASE, '').replace(/[^a-z0-9]/gi, '-').replace(/--+/g, '-').replace(/^-|-$/g, '') || 'home';
    const filePath = join(OUT, `${name}.png`);
    await p.screenshot({ path: filePath, fullPage: FULL_PAGE });
    console.log(filePath);
    return filePath;
  } finally {
    await p.close();
  }
}

async function main() {
  browser = await chromium.launch({ headless: true });

  try {
    await ensureSession();

    if (ACTION === 'browse') {
      const path = await browse(`${BASE}${TARGET}`);
      console.log(`\n📷 Screenshot saved: ${path}`);
      console.log(`   View it with: Read tool on ${path}`);
    } else if (ACTION === 'batch') {
      const pages = ['/', '/dashboard', '/daily', '/syllabus', '/timer', '/mentor', '/weekly', '/settings'];
      for (const p of pages) {
        console.log(`\n📸 ${p}`);
        await browse(`${BASE}${p}`);
      }
      console.log('\n✅ All screenshots captured');
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => { console.error(`❌ ${err.message}`); process.exit(1); });
