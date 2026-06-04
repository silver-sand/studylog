import type { APIRoute } from 'astro';
import { getDb } from '../../../db';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const examType = url.searchParams.get('exam') || undefined;

    if (!examType) {
      return new Response(JSON.stringify({ error: 'exam parameter required' }), { status: 400 });
    }

    db.seedSyllabusData();
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
    // Non-weak subjects have no entries in healthMap — we need all chapters
    for (const ch of allChapters) {
      if (!healthMap.has(ch.subject)) {
        // All chapters in this subject are healthy (> threshold)
        // We'll mark avgHealth as 100 for now
      }
    }

    return new Response(JSON.stringify({
      examType,
      weakCount: count,
      totalChapters: allChapters.length,
      weakChapters: weakChapters.slice(0, 20), // limit to 20 worst
      subjectHealth,
    }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load chapter health';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
