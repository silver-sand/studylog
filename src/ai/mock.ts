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

    const content = `## Overview
- Studied ${subjects.join(', ') || 'various topics'} for ${Math.round(totalHours * 10) / 10}h total across ${entries.length} session(s).
- ${subjects.length >= 2 ? 'Good spread across multiple subjects.' : 'Focused primarily on one area.'}
${avgFocus > 0 ? `- Focus level: ${avgFocus}/5 ${avgFocus >= 4 ? '— strong concentration today.' : avgFocus >= 3 ? '— decent, room to improve.' : '— try shorter blocks with breaks.'}` : ''}

## Topics Covered
${entries.flatMap(e => {
  if (e.chapters && e.chapters.length > 0) {
    return e.chapters.map(ch => `- ${e.subjects?.length ? `${e.subjects[0]}: ` : ''}${ch}${e.hoursStudied ? ` (${Math.round(e.hoursStudied / Math.max(e.subjects.length, 1) * 10) / 10}h)` : ''}`);
  }
  return e.subjects?.map(s => `- ${s}${e.hoursStudied ? ` (${Math.round(e.hoursStudied / Math.max(e.subjects.length, 1) * 10) / 10}h)` : ''}`) || [];
}).join('\n') || '- General study'}

${strengths.length > 0 ? `\n## Strengths\n${strengths.map(s => `- ${s}`).join('\n')}` : ''}
${weaknesses.length > 0 ? `\n## Areas to Improve\n${weaknesses.map(w => `- ${w}`).join('\n')}` : ''}

## Tomorrow
${recommendations.map(r => `- ${r}`).join('\n')}`;

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
        totalHours < 2
          ? 'Try to study at least 2 hours per day — short sessions make it hard to build depth.'
          : totalHours >= 4
            ? 'Great study volume today. Keep this pace up!'
            : 'Good session length. Try adding 30 more minutes tomorrow.',
        subjects.length > 0 && entries.some(e => e.chapters?.length > 0)
          ? `Review ${entries[0].chapters?.[0] || subjects[0]} briefly before tomorrow's session to lock it in.`
          : 'Review what you learned today before starting fresh topics.',
        avgFocus > 0 && avgFocus < 3
          ? 'Try the Pomodoro technique: 25 min study, 5 min break to improve focus.'
          : avgFocus >= 4
            ? 'Your focus was sharp today — leverage that for tougher topics.'
            : 'A short walk or stretch between sessions can help reset concentration.',
        subjects.length >= 2
          ? 'Alternate between subjects to keep engagement high.'
          : 'Consider mixing in a second subject tomorrow for variety.',
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

    // Collect all unique chapters studied
    const studiedChapters: string[] = [...new Set(entries.flatMap(e => e.chapters || []))].filter(Boolean);

    // Collect chapters grouped by subject
    const chaptersBySubject: Record<string, Set<string>> = {};
    for (const entry of entries) {
      for (let i = 0; i < entry.subjects.length; i++) {
        const subj = entry.subjects[i];
        if (!chaptersBySubject[subj]) chaptersBySubject[subj] = new Set();
        if (entry.chapters && entry.chapters.length > 0) {
          // If multiple chapters, distribute roughly
          const chPerSubj = Math.ceil(entry.chapters.length / entry.subjects.length);
          const start = i * chPerSubj;
          const end = Math.min(start + chPerSubj, entry.chapters.length);
          for (let j = start; j < end; j++) {
            chaptersBySubject[subj].add(entry.chapters[j]);
          }
        }
      }
    }

    // Daily breakdown
    const dailyBreakdown: { date: string; hours: number; subjects: string[] }[] = [];
    const entriesByDate: Record<string, typeof entries> = {};
    for (const entry of entries) {
      if (!entriesByDate[entry.date]) entriesByDate[entry.date] = [];
      entriesByDate[entry.date].push(entry);
    }
    for (const [date, dayEntries] of Object.entries(entriesByDate)) {
      const dayHours = dayEntries.reduce((s, e) => s + (e.hoursStudied || 0), 0);
      const daySubjects = [...new Set(dayEntries.flatMap(e => e.subjects))];
      dailyBreakdown.push({ date: formatDisplayDate(date), hours: dayHours, subjects: daySubjects });
    }

    // Generate insights
    const insights: string[] = [];
    if (entries[0]?.date) {
      const start = formatDisplayDate(entries[0].date);
      const end = formatDisplayDate(entries[entries.length - 1].date);
      insights.push(`Studied ${studyDays.size} days this week (${start} - ${end}).`);
    }
    if (totalHours > 0) {
      insights.push(`Total study time: ~${Math.round(totalHours)} hours.`);
    }
    if (sortedSubjects.length > 0) {
      const top = sortedSubjects[0][0];
      const topHours = Math.round(sortedSubjects[0][1]);
      insights.push(`Most focused subject: ${top} (${topHours} hours).`);
      if (studiedChapters.length > 0) {
        insights.push(`Covered ${studiedChapters.length} different chapters across all subjects.`);
      }
    }
    const avgDailyHours = totalHours / Math.max(studyDays.size, 1);
    if (avgDailyHours >= 3) {
      insights.push(`Strong daily average of ${avgDailyHours.toFixed(1)} hours on study days.`);
    }

    // Strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (sortedSubjects.length > 0) {
      sortedSubjects.forEach(([subject, hours], i) => {
        if (i === 0 && hours >= 3) {
          const chaptersList = chaptersBySubject[subject];
          const chRef = chaptersList && chaptersList.size > 0 ? ` — topics: ${[...chaptersList].slice(0, 3).join(', ')}` : '';
          strengths.push(`${subject}: ${Math.round(hours)} hours this week${chRef}.`);
        } else if (hours >= 3) {
          strengths.push(`${subject}: ${Math.round(hours)} hours of consistent work.`);
        } else {
          weaknesses.push(`${subject}: only ${Math.round(hours)} hours — needs more attention.`);
        }
      });
    }

    if (entries.length < 7) {
      weaknesses.push(`Only studied ${Math.round(avgDailyHours)}h avg on ${studyDays.size} days. Aim for daily consistency.`);
    }

    // Build markdown content
    const content = `# Weekly Review

## Overview
You studied **${studyDays.size} days** this week with approximately **${Math.round(totalHours)} hours** of total study time.
${avgDailyHours >= 2 ? `\nAveraging **${avgDailyHours.toFixed(1)} hours** per study day — ${avgDailyHours >= 3 ? 'great momentum!' : 'room to build deeper sessions.'}` : ''}

## Daily Breakdown
| Day | Hours | Subjects |
|-----|-------|----------|
${dailyBreakdown.map(d => `| ${d.date} | ${Math.round(d.hours * 10) / 10}h | ${d.subjects.join(', ') || '—'} |`).join('\n')}

## Topic Coverage
| Subject | Hours | Chapters |
|---------|-------|----------|
${sortedSubjects.map(([s, h]) => {
  const chs = chaptersBySubject[s];
  const chStr = chs && chs.size > 0 ? [...chs].slice(0, 4).join(', ') : '—';
  return `| ${s} | ${Math.round(h)}h | ${chStr} |`;
}).join('\n')}

## Strengths
${strengths.map(s => `- ✅ ${s}`).join('\n') || '- None identified yet.'}

## Areas for Improvement
${weaknesses.map(w => `- ⚠️ ${w}`).join('\n') || '- Keep up the good work!'}

## Action Items
1. ${weaknesses.length > 0 ? `Prioritize ${weaknesses[0].split(':')[0]} — aim for at least 3h next week.` : 'Maintain your current momentum across all subjects.'}
2. ${entries.length < 5 ? 'Try to study at least 5 days next week for better consistency.' : 'Great consistency! Now focus on increasing depth in each session.'}
3. ${studiedChapters.length > 0 ? `Review ${studiedChapters.slice(0, 2).join(' and ')} — spaced repetition helps retention.` : 'Start noting specific chapters to get better topic tracking.'}
4. Take short breaks every 90 minutes to maintain focus during long sessions.

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
          ? `Spend more time on ${weaknesses[0].split(':')[0] || 'weaker subjects'} next week — target at least 3 hours.`
          : 'Keep up the consistent study routine across all subjects!',
        entries.length < 5
          ? 'Try to study at least 5 days per week for better consistency.'
          : 'Great consistency — now focus on increasing session depth.',
        studiedChapters.length > 0
          ? `Review ${studiedChapters.slice(0, 2).join(' and ')} using spaced repetition.`
          : 'Start noting specific chapters to get more targeted recommendations.',
      ],
    };
  }
}
