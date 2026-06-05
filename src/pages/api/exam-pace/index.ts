import type { APIRoute } from 'astro';
import { getDb } from '../../../db';
import { scopeDbToUser } from '../../../services/user-scope';
import { getSyllabusKeyForExam } from '../../../utils/exam-map';

export const GET: APIRoute = async ({ request }) => {
  scopeDbToUser(request);
  try {
    const db = getDb();
    const settings = db.getSettings();

    db.seedSyllabusData();

    // Support multi-exam: return pace for each selected exam
    const selectedExams = settings.selectedExams?.length ? settings.selectedExams : ['JEE'];

    // Get first study date
    const entries = db.listEntries({ limit: 1 });
    const firstEntry = entries.length > 0 ? entries[entries.length - 1] : null;
    const firstDate = firstEntry ? new Date(firstEntry.date) : new Date();
    const today = new Date();
    const daysSinceStart = Math.max(1, Math.floor((today.getTime() - firstDate.getTime()) / 86400000));

    const results = selectedExams.map(examKey => {
      const syllabusKey = getSyllabusKeyForExam(examKey);
      const progress = db.getSyllabusProgress(syllabusKey);
      const totalChapters = progress.reduce((s, p) => s + p.total, 0);
      const weightedSum = progress.reduce((s, p) => s + p.weightedPercent * p.total, 0);
      const overallPercent = totalChapters > 0 ? Math.round(weightedSum / totalChapters) : 0;

      // Pace calculation
      const progressRate = overallPercent / daysSinceStart;
      const remainingPercent = 100 - overallPercent;
      const daysNeededAtCurrentPace = progressRate > 0 ? Math.ceil(remainingPercent / progressRate) : Infinity;
      const projectedDate = daysNeededAtCurrentPace !== Infinity
        ? new Date(today.getTime() + daysNeededAtCurrentPace * 86400000)
        : null;

      let examDate: Date | null = null;
      let daysUntilExam: number | null = null;
      let status: 'on_track' | 'behind' | 'critical' | 'no_exam_date' = 'no_exam_date';

      if (settings.examDate) {
        examDate = new Date(settings.examDate);
        daysUntilExam = Math.max(0, Math.floor((examDate.getTime() - today.getTime()) / 86400000));

        if (daysUntilExam > 0 && daysNeededAtCurrentPace !== Infinity) {
          if (daysNeededAtCurrentPace <= daysUntilExam) {
            status = 'on_track';
          } else if (daysNeededAtCurrentPace <= daysUntilExam * 1.5) {
            status = 'behind';
          } else {
            status = 'critical';
          }
        } else if (daysUntilExam === 0) {
          status = 'critical';
        }
      }

      return {
        examKey,
        syllabusKey,
        overallPercent,
        totalChapters,
        daysSinceStart,
        progressRate: Math.round(progressRate * 100) / 100,
        daysNeededAtCurrentPace,
        projectedCompletion: projectedDate ? projectedDate.toISOString().split('T')[0] : null,
        examDate: settings.examDate,
        daysUntilExam,
        status,
        chaptersPerDay: totalChapters > 0 && daysSinceStart > 0
          ? Math.round((totalChapters * overallPercent / 100) / daysSinceStart * 100) / 100
          : 0,
      };
    });

    return new Response(JSON.stringify({ exams: results }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to calculate pace';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
