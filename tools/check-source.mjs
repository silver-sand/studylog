/**
 * Get the raw HTML source of the onboarding page to check template processing.
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
    const authPage = await context.newPage();
    const ts = Date.now();
    const resp = await authPage.request.post(`${BASE}/api/auth/signup`, {
      data: { name: 'Source Check', email: `src-${ts}@local.dev`, password: 'test123456' },
    });
    if (resp.status() !== 201) throw new Error(`Signup failed: ${resp.status()}`);
    await authPage.close();

    const p = await context.newPage();

    // Capture the response that has the HTML
    const responsePromise = p.waitForResponse(resp =>
      resp.url() === `${BASE}/onboarding` && resp.status() === 200
    );
    await p.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle', timeout: 30000 });
    const response = await responsePromise;
    const html = await response.text();

    // Find the data bridge section
    const bridgeMatch = html.match(/<script[^>]*>[\s\S]*?__ONBOARDING[\s\S]*?<\/script>/i);
    if (bridgeMatch) {
      console.log('=== DATA BRIDGE SCRIPT (raw HTML) ===');
      console.log(bridgeMatch[0].substring(0, 3000));
    } else {
      console.log('__ONBOARDING NOT FOUND in raw HTML');
      // Check if there are any script tags with onboardData
      const onboardMatch = html.match(/onboardData/g);
      console.log('onboardData references:', onboardMatch ? onboardMatch.length : 0);

      // Dump all inline scripts
      const inlineScripts = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi);
      if (inlineScripts) {
        console.log(`\nFound ${inlineScripts.length} script tags`);
        inlineScripts.forEach((s, i) => {
          if (s.includes('__ONBOARDING') || s.includes('onboardData') || s.includes('JSON.stringify')) {
            console.log(`\n--- Script ${i} ---`);
            console.log(s.substring(0, 500));
          }
        });
      }
    }

    await p.close();
  } finally {
    await browser.close();
  }
}

main().catch(err => { console.error(`❌ ${err.message}`); process.exit(1); });
