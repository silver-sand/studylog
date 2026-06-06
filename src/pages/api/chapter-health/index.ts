import type { APIRoute } from 'astro';
import { getDb } from '../../../db';
import { scopeDbToUser } from '../../../services/user-scope';

export const GET: APIRoute = async ({ url, request }) => {
  scopeDbToUser(request);
  try {
    const db = getDb();
    const examType = url.searchParams.get('exam') || undefined;

    if (!examType) {
      return new Response(JSON.stringify({ error: 'exam parameter required' }), { status: 400 });
    }

    db.seedSyllabusData();
    const allProgress = db.getSyllabusProgress(examType);
    const hasProgress = allProgress.some(p => p.weightedPercent > 0);

    const weakChapters = db.getWeakChapters(examType);
    const count = weakChapters.length;

    // Also compute subject-level health summaries
    const subjectHealth: Record<string, { total: number; weak: number; avgHealth: number }> = {};
    const allChapters = db.getSyllabus(examType);
    for (const ch of allChapters) {
      if (!subjectHealth[ch.subject]) {
        subjectHealth[ch.subject] = { total: 0, weak: 0, avgHealth: 0 };
      }
      subjectHealth[ch.subject].total++;
    }

    // Mark which subjects have weak chapters
    for (const wc of weakChapters) {
      if (subjectHealth[wc.subject]) {
        subjectHealth[wc.subject].weak++;
      }
    }

    // Compute average health per subject
    const healthMap = new Map<string, number[]>();
    for (const wc of weakChapters) {
      if (!healthMap.has(wc.subject)) healthMap.set(wc.subject, []);
      healthMap.get(wc.subject)!.push(wc.health);
    }
    // For subjects with no weak chapters, mark all healthy (avgHealth = 100)
    for (const ch of allChapters) {
      if (!healthMap.has(ch.subject)) {
        subjectHealth[ch.subject].avgHealth = 100;
      }
    }
    // For subjects with weak chapters, compute average from their health values
    for (const [subject, healthValues] of healthMap) {
      if (subjectHealth[subject]) {
        const avg = healthValues.reduce((a, b) => a + b, 0) / healthValues.length;
        subjectHealth[subject].avgHealth = Math.round(avg);
      }
    }

    return new Response(JSON.stringify({
      examType,
      hasProgress,
      weakCount: hasProgress ? count : 0,
      totalChapters: allChapters.length,
      weakChapters: hasProgress ? weakChapters.slice(0, 20) : [],
      subjectHealth,
    }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load chapter health';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
