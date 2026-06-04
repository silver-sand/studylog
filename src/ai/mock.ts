import type { AIService } from './interface';
import type { EntryAnalysis, WeeklyReviewData, DailyReviewData } from '../types/ai';
import type { Entry } from '../types/entry';
import { formatDisplayDate, getDaysBetween } from '../utils/date';

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Physics: ['physics', 'mechanics', 'kinematics', 'dynamics', 'electro', 'optics', 'wave', 'thermo', 'modern physics', 'rotation', 'gravitation', 'shm', 'sound'],
  Chemistry: ['chemistry', 'organic', 'inorganic', 'physical', 'mole', 'thermodynamics', 'equilibrium', 'redox', 'chemical', 'atomic', 'periodic', 'bonding'],
  Mathematics: ['math', 'algebra', 'calculus', 'geometry', 'trigonometry', 'coordinate', 'vector', 'probability', 'statistics', 'differentiation', 'integration', 'matrix', 'determinant'],
  Biology: ['biology', 'bio', 'cell', 'genetics', 'evolution', 'ecology', 'human', 'plant', 'animal'],
  English: ['english', 'grammar', 'vocabulary', 'reading', 'writing', 'comprehension'],
};

const CHAPTER_KEYWORDS: Record<string, string[]> = {
  'Kinematics': ['motion', 'displacement', 'velocity', 'acceleration', 'kinematics'],
  'Dynamics': ['force', 'newton', 'friction', 'dynamics', 'nlm'],
  'Thermodynamics': ['thermo', 'heat', 'temperature', 'entropy', 'enthalpy'],
  'Optics': ['optics', 'lens', 'mirror', 'refraction', 'reflection', 'light'],
  'Electrostatics': ['electrostatic', 'charge', 'coulomb', 'electric field', 'potential'],
  'Algebra': ['algebra', 'quadratic', 'polynomial', 'sequence', 'series', 'complex'],
  'Calculus': ['calculus', 'derivative', 'integration', 'limit', 'differentiation'],
  'Trigonometry': ['trig', 'sin', 'cos', 'tan', 'angle'],
  'Coordinate Geometry': ['coordinate', 'straight line', 'circle', 'parabola', 'ellipse'],
  'Organic Chemistry': ['organic', 'carbon', 'hydrocarbon', 'functional group'],
  'Inorganic Chemistry': ['inorganic', 'periodic', 's-block', 'p-block', 'd-block'],
  'Physical Chemistry': ['physical chem', 'mole concept', 'equilibrium', 'redox'],
};

function detectSubjects(content: string): string[] {
  const lower = content.toLowerCase();
  const found: string[] = [];
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      found.push(subject);
    }
  }
  return found.length > 0 ? found : ['General'];
}

function detectChapters(content: string): string[] {
  const lower = content.toLowerCase();
  const found: string[] = [];
  for (const [chapter, keywords] of Object.entries(CHAPTER_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      found.push(chapter);
    }
  }
  return found;
}

function extractHours(content: string): number | null {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:hr|hour|hrs|hours|h)\b/gi,
    /studied\s+for\s+(\d+(?:\.\d+)?)/gi,
    /(\d+(?:\.\d+)?)\s*hrs?\s*(?:of|of study)/gi,
  ];
  let total = 0;
  let found = false;
  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const m of matches) {
      total += parseFloat(m[1]);
      found = true;
    }
  }
  return found ? total : null;
}

function generateSummary(content: string, subjects: string[], chapters: string[], hours: number | null): string {
  const subj = subjects.length > 0 ? subjects.join(', ') : 'general topics';
  const chap = chapters.length > 0 ? ` including ${chapters.slice(0, 3).join(', ')}` : '';
  const time = hours ? ` for ${hours} hours` : '';
  return `Studied ${subj}${chap}${time}.`;
}

export class MockAIService implements AIService {
  async analyzeEntry(content: string): Promise<EntryAnalysis> {
    // Simulate a tiny delay for realistic UX
    await new Promise(r => setTimeout(r, 150));

    const subjects = detectSubjects(content);
    const chapters = detectChapters(content);
    const hoursStudied = extractHours(content);

    const tags = [...subjects.map(s => s.toLowerCase()), ...chapters.map(c => c.toLowerCase())];

    return {
      subjects,
      chapters,
      hoursStudied,
      summary: generateSummary(content, subjects, chapters, hoursStudied),
      tags: [...new Set(tags)],
    };
  }

  async generateDailyReview(
    entries: Pick<Entry, 'id' | 'date' | 'content' | 'subjects' | 'chapters' | 'hoursStudied' | 'studyType' | 'focusRating'>[]
  ): Promise<DailyReviewData> {
    await new Promise(r => setTimeout(r, 200));

    if (entries.length === 0) {
      return {
        content: '# Daily Review\n\nNo entries logged today.',
        insights: ['No study data recorded for today.'],
        totalHours: 0,
        subjects: [],
        strengths: [],
        weaknesses: [],
        recommendations: ['Log your first study session to get a daily review.'],
      };
    }

    const totalHours = entries.reduce((s, e) => s + (e.hoursStudied || 0), 0);
    const subjects = [...new Set(entries.flatMap(e => e.subjects))].filter(Boolean);
    const avgFocus = Math.round(entries.reduce((s, e) => s + (e.focusRating || 0), 0) / entries.length);

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (avgFocus >= 4) strengths.push('High focus throughout today\'s sessions.');
    if (totalHours >= 4) strengths.push('Great study duration today.');
    if (subjects.length >= 2) strengths.push('Good variety of subjects covered.');

    if (totalHours < 2) weaknesses.push('Study time was quite short today.');
    if (avgFocus > 0 && avgFocus < 3) weaknesses.push('Focus could be improved — try shorter intervals.');
    if (subjects.length === 0) weaknesses.push('No specific subjects logged.');

    const content = `## Overview\n- Studied ${subjects.join(', ') || 'various topics'} for ${Math.round(totalHours * 10) / 10}h total.\n\n## Topics\n${subjects.map(s => `- ${s}`).join('\n') || '- General study'}\n\n## Tomorrow\n- ${weaknesses.length > 0 ? 'Focus on improving consistency.' : 'Keep up the great work!'}\n- Review today's material before starting new topics.`;

    return {
      content,
      insights: [
        `Studied ${Math.round(totalHours * 10) / 10}h across ${subjects.length} subject(s).`,
        ...(avgFocus > 0 ? [`Average focus: ${avgFocus}/5.`] : []),
      ],
      totalHours,
      subjects,
      strengths,
      weaknesses,
      recommendations: [
        totalHours < 2 ? 'Try to study at least 2 hours per day.' : 'Maintain your current pace.',
        'Review what you learned today before tomorrow\'s session.',
      ],
    };
  }

  async generateWeeklyReview(
    entries: Pick<Entry, 'id' | 'date' | 'content' | 'subjects' | 'chapters' | 'hoursStudied'>[]
  ): Promise<WeeklyReviewData> {
    await new Promise(r => setTimeout(r, 300));

    if (entries.length === 0) {
      return {
        content: '# Weekly Review\n\nNo entries this week. Start logging to get insights!',
        insights: ['No study data recorded for this week.'],
        topicCoverage: {},
        strengths: [],
        weaknesses: [],
        recommendations: ['Start logging your daily study sessions to get personalized weekly reviews.'],
      };
    }

    // Aggregate subjects and hours
    const topicCoverage: Record<string, number> = {};
    const studyDays = new Set<string>();
    let totalHours = 0;

    for (const entry of entries) {
      for (const subject of entry.subjects) {
        topicCoverage[subject] = (topicCoverage[subject] || 0) + (entry.hoursStudied || 1);
        totalHours += entry.hoursStudied || 1;
      }
      studyDays.add(entry.date);
    }

    // Sort subjects by hours
    const sortedSubjects = Object.entries(topicCoverage)
      .sort(([, a], [, b]) => b - a);

    // Generate insights
    const insights: string[] = [];
    if (entries[0]?.date) {
      const start = formatDisplayDate(entries[0].date);
      const end = formatDisplayDate(entries[entries.length - 1].date);
      insights.push(`Studied ${entries.length} days this week (${start} - ${end}).`);
    }
    if (totalHours > 0) {
      insights.push(`Total study time: ~${Math.round(totalHours)} hours.`);
    }
    if (sortedSubjects.length > 0) {
      const top = sortedSubjects[0][0];
      insights.push(`Most focused subject: ${top} (${Math.round(sortedSubjects[0][1])} hours).`);
    }

    // Strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (sortedSubjects.length > 0) {
      sortedSubjects.forEach(([subject, hours], i) => {
        if (i === 0) {
          strengths.push(`${subject}: ${Math.round(hours)} hours this week — strong focus.`);
        } else if (hours >= 3) {
          strengths.push(`${subject}: ${Math.round(hours)} hours of consistent work.`);
        } else {
          weaknesses.push(`${subject}: only ${Math.round(hours)} hours — needs more attention.`);
        }
      });
    }

    if (entries.length < 7) {
      weaknesses.push(`Only studied ${entries.length} out of 7 days. Aim for daily consistency.`);
    }

    // Build markdown content
    const content = `# Weekly Review

## Overview
You studied **${entries.length} days** this week with approximately **${Math.round(totalHours)} hours** of total study time.

## Topic Coverage
| Subject | Hours |
|---------|-------|
${sortedSubjects.map(([s, h]) => `| ${s} | ${Math.round(h)}h |`).join('\n')}

## Strengths
${strengths.map(s => `- ✅ ${s}`).join('\n') || '- None identified yet.'}

## Areas for Improvement
${weaknesses.map(w => `- ⚠️ ${w}`).join('\n') || '- Keep up the good work!'}

## Recommendations
1. ${weaknesses.length > 0 ? `Focus more on ${weaknesses[0].split(':')[0]}` : 'Maintain your current momentum.'}
2. Try to study at least 6 days per week for consistency.
3. Review your weakest topics at the start of each session.
4. Take short breaks every 90 minutes to maintain focus.

---
*Generated by StudyLog — based on ${entries.length} daily entries.*
`;

    const hoursList = sortedSubjects.map(([s]) => s);
    const weakList = weaknesses.length > 0
      ? weaknesses.map(w => w.split(':')[0]).filter(Boolean)
      : [];

    return {
      content,
      insights,
      topicCoverage,
      strengths: strengths.map(s => s.replace(/^[✅]*\s*/, '')),
      weaknesses: weaknesses.map(w => w.replace(/^[⚠️]*\s*/, '')),
      recommendations: [
        weaknesses.length > 0
          ? `Spend more time on ${weaknesses[0].split(':')[0] || 'weaker subjects'} next week.`
          : 'Keep up the consistent study routine!',
        'Try to maintain a daily study habit — consistency beats intensity.',
        'Review your weakest chapters at the start of each session.',
      ],
    };
  }
}
