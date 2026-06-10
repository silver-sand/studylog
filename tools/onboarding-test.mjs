import { chromium } from 'playwright';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COOKIE_FILE = join(__dirname, '..', '.inspect-session.json');
const OUT = join(__dirname, '..', 'screenshots');
mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:4321';

async function main() {
  const browser = await chromium.launch({ headless: true });

  // Desktop viewport
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  try {
    // Sign up fresh
    const authPage = await context.newPage();
    const ts = Date.now();
    const resp = await authPage.request.post(`${BASE}/api/auth/signup`, {
      data: { name: 'Onboarding Tester', email: `onboard-${ts}@local.dev`, password: 'test123456' },
    });
    if (resp.status() !== 201) {
      const body = await resp.text();
      throw new Error(`Signup failed: ${resp.status()} ${body}`);
    }
    console.log('✓ Signed up test user');
    await authPage.close();

    // Go to onboarding
    const p = await context.newPage();
    await p.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(1000);
    console.log('✓ Page loaded');

    // Screenshot step 1 (initial state)
    await p.screenshot({ path: join(OUT, 'onboarding-step1.png'), fullPage: true });
    console.log('  → Captured step 1');

    // Step 1: Fill name, class, select stream
    await p.fill('#onboarding-name', 'Test Student');
    await p.selectOption('#onboarding-classlevel', 'class_11');
    // Click Science stream
    await p.click('.stream-card[data-stream="science"]');
    await p.waitForTimeout(300);

    // Click Continue to go to step 2 (exams)
    await p.click('#next-btn');
    await p.waitForTimeout(500);

    // Screenshot step 2 (exam selection)
    await p.screenshot({ path: join(OUT, 'onboarding-step2.png'), fullPage: true });
    console.log('  → Captured step 2');

    // Select JEE exam
    await p.click('.exam-card[data-exam="JEE"]');
    await p.waitForTimeout(200);

    // Click Continue to go to step 3 (subjects + weak subjects)
    await p.click('#next-btn');
    await p.waitForTimeout(500);

    // Screenshot step 3 (this is where the bug is - subjects should appear)
    await p.screenshot({ path: join(OUT, 'onboarding-step3-subjects.png'), fullPage: true });
    console.log('  → Captured step 3 (subjects)');

    // Also try with NEET (different subject set)
    // Go back to step 2
    await p.click('#prev-btn');
    await p.waitForTimeout(300);
    // Deselect JEE, select NEET
    await p.click('.exam-card[data-exam="JEE"]');
    await p.waitForTimeout(100);
    await p.click('.exam-card[data-exam="NEET"]');
    await p.waitForTimeout(100);
    // Forward to step 3 again
    await p.click('#next-btn');
    await p.waitForTimeout(500);

    await p.screenshot({ path: join(OUT, 'onboarding-step3-neet.png'), fullPage: true });
    console.log('  → Captured step 3 (NEET subjects)');

    await p.close();

    // Mobile viewport
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
    });

    // Sign up another user for mobile
    const mobileAuth = await mobileContext.newPage();
    const ts2 = Date.now();
    const resp2 = await mobileAuth.request.post(`${BASE}/api/auth/signup`, {
      data: { name: 'Mobile Tester', email: `mobile-${ts2}@local.dev`, password: 'test123456' },
    });
    if (resp2.status() !== 201) throw new Error(`Signup failed: ${resp2.status()}`);
    await mobileAuth.close();

    // Settings page mobile
    const mp = await mobileContext.newPage();
    await mp.goto(`${BASE}/settings`, { waitUntil: 'networkidle', timeout: 30000 });
    await mp.waitForTimeout(1500);
    await mp.screenshot({ path: join(OUT, 'settings-mobile.png'), fullPage: true });
    console.log('  → Captured settings mobile');
    await mp.close();

    await mobileContext.close();

    console.log('\n✅ All onboarding screenshots captured');
  } finally {
    await browser.close();
  }
}

main().catch(err => { console.error(`❌ ${err.message}`); process.exit(1); });
