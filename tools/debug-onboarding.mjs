/**
 * Debug script — captures console logs + DOM state during onboarding flow.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'screenshots');
mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:4321';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  try {
    // Sign up fresh
    const authPage = await context.newPage();
    const ts = Date.now();
    const resp = await authPage.request.post(`${BASE}/api/auth/signup`, {
      data: { name: 'Debug Tester', email: `debug-${ts}@local.dev`, password: 'test123456' },
    });
    if (resp.status() !== 201) {
      const body = await resp.text();
      throw new Error(`Signup failed: ${resp.status()} ${body}`);
    }
    console.log('✓ Signed up test user');
    await authPage.close();

    const p = await context.newPage();

    // Capture console messages
    const logs = [];
    p.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    p.on('pageerror', err => {
      logs.push(`[PAGE_ERROR] ${err.message}`);
    });

    // Navigate to onboarding
    await p.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(500);

    // Fill step 0
    await p.fill('#onboarding-name', 'Debug Student');
    await p.selectOption('#onboarding-classlevel', 'class_11');
    await p.click('.stream-card[data-stream="science"]');
    await p.waitForTimeout(200);

    // Go to step 1
    await p.click('#next-btn');
    await p.waitForTimeout(500);

    // Check step 1 state
    const step1Active = await p.evaluate(() => {
      const el = document.querySelector('.step-content:not(.hidden)');
      return el ? `Step ${el.dataset.step} is visible` : 'No visible step';
    });
    console.log(`  → ${step1Active}`);

    // Debug: check if exam cards are visible
    const visibleCards = await p.evaluate(() => {
      return Array.from(document.querySelectorAll('#exam-grid .exam-card:not(.hidden)')).map(c => c.dataset.exam);
    });
    console.log(`  → Visible exam cards: ${visibleCards.join(', ')}`);

    // Select JEE
    await p.click('.exam-card[data-exam="JEE"]');
    await p.waitForTimeout(200);

    const selectedCards = await p.evaluate(() => {
      return Array.from(document.querySelectorAll('#exam-grid .exam-card.selected')).map(c => c.dataset.exam);
    });
    console.log(`  → Selected: ${selectedCards.join(', ')}`);

    // Go to step 2
    await p.click('#next-btn');
    await p.waitForTimeout(500);

    // Debug: capture DOM state of subject grid
    const step2State = await p.evaluate(() => {
      const grid = document.getElementById('subject-toggle-grid');
      const weakGrid = document.getElementById('weak-subjects-grid');
      const chips = grid ? Array.from(grid.querySelectorAll('.subject-toggle-chip')).map(c => c.textContent.trim()) : 'NO_GRID';
      const weakChips = weakGrid ? Array.from(weakGrid.querySelectorAll('.weak-subject-chip')).map(c => c.textContent.trim()) : 'NO_GRID';

      // Also check what the next step transition computed
      const stepContent = document.querySelector('.step-content:not(.hidden)');

      return {
        visibleStep: stepContent ? stepContent.dataset.step : 'none',
        gridExists: !!grid,
        gridHTML: grid ? grid.innerHTML.substring(0, 500) : 'N/A',
        chips: chips,
        weakChips: weakChips,
        stream: document.getElementById('onboarding-stream')?.value || 'EMPTY',
        selectedExams: Array.from(document.querySelectorAll('#exam-grid .exam-card.selected')).map(c => c.dataset.exam),
      };
    });

    console.log(`  → Step 2 debug state:
    visibleStep: ${step2State.visibleStep}
    gridExists: ${step2State.gridExists}
    chips count: ${step2State.chips.length}
    chips: [${step2State.chips.join(', ')}]
    weak chips count: ${step2State.weakChips.length}
    weak chips: [${step2State.weakChips.join(', ')}]
    stream: ${step2State.stream}
    selectedExams: ${step2State.selectedExams.join(', ')}
    grid HTML preview: ${step2State.gridHTML}`);

    // Check data bridge
    const dataBridge = await p.evaluate(() => {
      return {
        hasOnboarding: !!window.__ONBOARDING,
        hasExamSubjects: !!window.__EXAM_SUBJECTS,
        hasStreamSubjects: !!window.__STREAM_SUBJECTS,
        examSubjectsKeys: window.__EXAM_SUBJECTS ? Object.keys(window.__EXAM_SUBJECTS) : [],
        streamSubjectsKeys: window.__STREAM_SUBJECTS ? Object.keys(window.__STREAM_SUBJECTS) : [],
        scienceSubjects: window.__STREAM_SUBJECTS ? window.__STREAM_SUBJECTS.science : null,
        jeeSubjects: window.__EXAM_SUBJECTS ? window.__EXAM_SUBJECTS.JEE : null,
      };
    });
    console.log(`  → Data bridge:
    __ONBOARDING: ${dataBridge.hasOnboarding}
    __EXAM_SUBJECTS: ${dataBridge.hasExamSubjects}
    __STREAM_SUBJECTS: ${dataBridge.hasStreamSubjects}
    exam keys: ${dataBridge.examSubjectsKeys.join(', ')}
    stream keys: ${dataBridge.streamSubjectsKeys.join(', ')}
    science subjects: ${JSON.stringify(dataBridge.scienceSubjects)}
    JEE subjects: ${JSON.stringify(dataBridge.jeeSubjects)}`);

    await p.screenshot({ path: join(OUT, 'debug-step3.png'), fullPage: true });
    console.log('  → Screenshot saved');

    // Print all captured logs
    console.log('\n── Console Logs ──');
    logs.forEach(l => console.log(l));
    if (logs.length === 0) console.log('(none)');

    // Also check what updateStep says
    const step3Visible = await p.evaluate(() => {
      const el = document.querySelector('.step-content:not(.hidden)');
      return el ? `Step ${el.dataset.step}` : 'none';
    });
    console.log(`\n  → After all: ${step3Visible}`);

    await p.close();
    console.log('\n✅ Done');
  } finally {
    await browser.close();
  }
}

main().catch(err => { console.error(`❌ ${err.message}`); process.exit(1); });
