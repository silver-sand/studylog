import type { APIRoute } from 'astro';
import { getDb } from '../../../db';
import { scopeDbToUser } from '../../../services/user-scope';

export const GET: APIRoute = async ({ url, request }) => {
  scopeDbToUser(request);
  try {
    const db = getDb();
    const settings = db.getSettings();

    // Map settings exam name to syllabus key
    const examKeyMap: Record<string, string> = {
      'JEE Main': 'JEE', 'JEE Advanced': 'JEE',
      'NEET': 'NEET', 'CET': 'MHT_CET',
      'Boards (PCM)': 'CBSE_12', 'Boards (PCB)': 'CBSE_12', 'Boards (Commerce)': 'CBSE_12',
      'CUET': 'CUET', 'GATE': 'GATE', 'CAT': 'CAT', 'UPSC': 'UPSC',
    };
    const examKey = examKeyMap[settings.examType] || 'JEE';

    db.seedSyllabusData();
    const progress = db.getSyllabusProgress(examKey);
    const totalChapters = progress.reduce((s, p) => s + p.total, 0);
    const weightedSum = progress.reduce((s, p) => s + p.weightedPercent * p.total, 0);
    const overallPercent = totalChapters > 0 ? Math.round(weightedSum / totalChapters) : 0;

    // Get first study date
    const entries = db.listEntries({ limit: 1 });
    const firstEntry = entries.length > 0 ? entries[entries.length - 1] : null;
    const firstDate = firstEntry ? new Date(firstEntry.date) : new Date();
    const today = new Date();
    const daysSinceStart = Math.max(1, Math.floor((today.getTime() - firstDate.getTime()) / 86400000));

    // Pace calculation
    const progressRate = overallPercent / daysSinceStart; // percent per day
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

    return new Response(JSON.stringify({
      examType: examKey,
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
    }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to calculate pace';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
