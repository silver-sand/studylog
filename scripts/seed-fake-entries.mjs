/**
 * Seed fake study entries for testing the review & analytics system.
 *
 * Run: node scripts/seed-fake-entries.mjs
 *
 * Creates entries spanning 8 days (May 27 – Jun 3, 2026) across
 * Physics, Chemistry, Mathematics, and Biology with varied
 * hours, study types, and focus ratings.
 */

const BASE = new Date('2026-05-27T12:00:00Z'); // Wed before last week

const SUBJECTS = {
  Physics: ['Kinematics', 'Laws of Motion', 'Work Energy Power', 'Electrostatics', 'Current Electricity', 'Optics'],
  Chemistry: ['Mole Concept', 'Atomic Structure', 'Chemical Bonding', 'Thermodynamics', 'Organic Chemistry', 'Equilibrium'],
  Mathematics: ['Sets & Functions', 'Trigonometry', 'Calculus', 'Vectors', 'Matrices', 'Probability'],
  Biology: ['Cell Division', 'Genetics', 'Plant Physiology', 'Human Physiology', 'Ecology', 'Biotechnology'],
};

const STUDY_TYPES = ['theory', 'problem_solving', 'revision', 'test'];
const EXAM_TYPES = ['JEE', 'NEET', 'CBSE_12'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSubjects(count) {
  const names = Object.keys(SUBJECTS);
  const shuffled = [...names].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Build a natural-sounding study entry.
 */
function buildContent(subjects, chapters, hours, studyType) {
  const typeVerb = {
    theory: 'studied theory and reviewed notes on',
    problem_solving: 'practiced problems on',
    revision: 'revised',
    test: 'took a practice test on',
  };

  const lines = [];
  for (let i = 0; i < subjects.length; i++) {
    const s = subjects[i];
    const c = chapters[i] || 'general topics';
    const verb = typeVerb[studyType] || 'studied';

    if (studyType === 'test') {
      lines.push(`Attempted a ${hours}-hour mock test covering ${c} in ${s}.`);
    } else {
      lines.push(`${verb} ${c} in ${s} for about ${(hours / subjects.length).toFixed(1)}h.`);
    }

    // Add extra detail sometimes
    if (Math.random() > 0.6) {
      lines.push(`Focused on ${Math.random() > 0.5 ? 'derivations' : 'numericals'} — found ${randomItem(['it tricky at first', 'it straightforward', ' some challenging problems', 'the concepts clear'])}.`);
    }
  }

  // Occasionally add a general note
  if (Math.random() > 0.7) {
    lines.push(`Need to revisit ${randomItem(chapters)} later.`);
  }

  return lines.join('\n');
}

async function main() {
  // Dynamic import the module via node
  const { getDb } = await import('../src/db/index.ts');
  const db = getDb();

  let count = 0;
  const days = 8; // May 27 → Jun 3

  for (let i = 0; i < days; i++) {
    const date = new Date(BASE);
    date.setDate(date.getDate() + i);
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay(); // 0=Sun

    // Skip some days to simulate real life (study ~5-6 days/week)
    if (dayOfWeek === 0 && Math.random() > 0.5) {
      console.log(`  ${dateStr} (${date.toLocaleDateString('en', { weekday: 'short' })}) — skipped (weekend break)`);
      continue;
    }

    // Decide what was studied
    const isHeavy = i >= 3; // more recent days = heavier study
    const subjectCount = isHeavy ? randomItem([2, 2, 3]) : randomItem([1, 1, 2]);
    const subjects = pickSubjects(subjectCount);
    const chapters = subjects.map(s => randomItem(SUBJECTS[s]));

    // Vary parameters
    const hoursPerSubject = Math.round((1 + Math.random() * 2) * 10) / 10;
    const totalHours = Math.round(subjects.reduce((s, _, idx) => s + hoursPerSubject, 0) * 10) / 10;
    const studyType = randomItem(STUDY_TYPES);
    const focusRating = studyType === 'test' ? randomItem([4, 5]) : randomItem([2, 2, 3, 3, 3, 4, 4, 5]);
    const examType = randomItem(EXAM_TYPES);

    const content = buildContent(subjects, chapters, totalHours, studyType);

    const entry = db.createEntry({
      date: dateStr,
      content,
      hoursStudied: totalHours,
      studyType,
      focusRating,
      examType,
    });

    // Now update with proper subjects/chapters (since AI analysis would normally set these)
    db.updateEntry(entry.id, {
      subjects,
      chapters,
      tags: [...subjects.map(s => s.toLowerCase()), ...chapters.map(c => c.toLowerCase().replace(/\s+/g, '-'))],
      aiStatus: 'done',
      aiRaw: JSON.stringify({ subjects, chapters, hoursStudied: totalHours, summary: content.split('\n')[0] }),
    });

    console.log(`  ${dateStr} (${date.toLocaleDateString('en', { weekday: 'short' })}) — ${subjects.join(', ')} — ${totalHours}h — focus ${focusRating}/5 — ${studyType}`);
    count++;
  }

  console.log(`\n✅ Created ${count} fake entries.`);
  console.log(`Now go to /dashboard for charts, or generate a daily/weekly review.`);
}

main().catch(console.error);
