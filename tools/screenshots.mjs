import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'screenshots');
mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:4321';

const PAGES = [
  { path: '/', name: 'landing' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/daily', name: 'daily' },
  { path: '/syllabus', name: 'syllabus' },
  { path: '/timer', name: 'timer' },
  { path: '/mentor', name: 'mentor' },
  { path: '/weekly', name: 'weekly' },
  { path: '/settings', name: 'settings' },
];

// ── Signed-in viewport sizes ──
const VIEWPORTS = [
  { width: 1440, height: 900, suffix: 'desktop' },
  { width: 390, height: 844, suffix: 'mobile' },
];

async function main() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n📐 Viewport: ${vp.width}×${vp.height} (${vp.suffix})`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.width <= 430 ? 3 : 2,
    });

    // ── Sign up to get session cookie ──
    console.log('  🔑 Signing up test user...');
    const authPage = await context.newPage();
    try {
      const resp = await authPage.request.post(`${BASE}/api/auth/signup`, {
        data: {
          name: 'Test User',
          email: `test-${Date.now()}@studylog.local`,
          password: 'test123456',
        },
      });
      console.log(`  Signup: ${resp.status()} ${resp.statusText()}`);
      const body = await resp.text();
      console.log(`  Response: ${body.substring(0, 100)}`);
    } catch (err) {
      console.log(`  Signup failed: ${err.message}`);
      // Navigate to landing — maybe guest auto-creation happens
      try {
        await authPage.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
        console.log(`  Landed on homepage — checking cookies...`);
      } catch (e) {
        console.log(`  Landing page failed: ${e.message}`);
      }
    }
    await authPage.close();

    // ── Screenshot each page ──
    for (const pageDef of PAGES) {
      const url = `${BASE}${pageDef.path}`;
      console.log(`  📸 ${pageDef.name}`);
      try {
        const p = await context.newPage();
        await p.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await p.waitForTimeout(1500);

        await p.screenshot({
          path: join(OUT, `${pageDef.name}-${vp.suffix}.png`),
          fullPage: true,
        });
        await p.close();
        console.log(`     ✓`);
      } catch (err) {
        console.error(`     ✗ ${err.message}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('\n✅ Done! All screenshots in screenshots/');
}

main().catch(err => { console.error(err); process.exit(1); });
