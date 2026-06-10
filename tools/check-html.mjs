/**
 * Capture the actual rendered HTML of the inline script to debug JSON.parse.
 */
import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:4321';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  try {
    // Sign up
    const authPage = await context.newPage();
    const ts = Date.now();
    const resp = await authPage.request.post(`${BASE}/api/auth/signup`, {
      data: { name: 'HTML Check', email: `html-${ts}@local.dev`, password: 'test123456' },
    });
    if (resp.status() !== 201) throw new Error(`Signup failed: ${resp.status()}`);
    await authPage.close();

    const p = await context.newPage();
    await p.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(500);

    // Capture the rendered is:inline script content
    const inlineScript = await p.evaluate(() => {
      // Find all script tags and look for the one with __ONBOARDING
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const s of scripts) {
        if (s.textContent && s.textContent.includes('__ONBOARDING')) {
          return s.textContent.substring(0, 2000);
        }
      }
      return 'NOT FOUND';
    });

    console.log('=== INLINE SCRIPT (first 2000 chars) ===');
    console.log(inlineScript);

    // Also check for the subjects from a different angle
    const hasScriptTag = await p.evaluate(() => {
      return Array.from(document.querySelectorAll('script')).some(s => s.textContent && s.textContent.includes('__ONBOARDING'));
    });
    console.log(`\nFound __ONBOARDING in script: ${hasScriptTag}`);

    // Count script tags
    const scriptCount = await p.evaluate(() => document.querySelectorAll('script').length);
    console.log(`Script tags found: ${scriptCount}`);

    // List all script src
    const scriptSrcs = await p.evaluate(() => {
      return Array.from(document.querySelectorAll('script')).map(s => s.src || s.id || '(inline)');
    });
    scriptSrcs.forEach((s, i) => console.log(`  [${i}] ${s}`));

  } finally {
    await browser.close();
  }
}

main().catch(err => { console.error(`❌ ${err.message}`); process.exit(1); });
