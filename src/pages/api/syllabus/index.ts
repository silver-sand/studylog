import type { APIRoute } from 'astro';
import { getDb } from '../../../db';

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const examType = url.searchParams.get('exam') || undefined;
    const subject = url.searchParams.get('subject') || undefined;

    // Seed data if first access
    db.seedSyllabusData();

    if (examType) {
      const chapters = db.getSyllabus(examType, subject);
      const progress = db.getSyllabusProgress(examType);
      return new Response(JSON.stringify({ chapters, progress }));
    }

    // Return all exam progress summaries
    const exams = ['JEE', 'NEET', 'CBSE_12', 'MHT_CET', 'CUET', 'GATE', 'CAT', 'UPSC'];
    const summaries = exams.map(e => ({
      examType: e,
      progress: db.getSyllabusProgress(e),
    }));

    return new Response(JSON.stringify({ exams: summaries }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load syllabus';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return new Response(JSON.stringify({ error: 'id and status required' }), { status: 400 });
    }

    if (!['not_started', 'studied', 'revision_1', 'revision_2', 'revision_3', 'mastered'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400 });
    }

    const db = getDb();
    const updated = db.updateSyllabusStatus(id, status);
    return new Response(JSON.stringify(updated));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update syllabus';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return new Response(JSON.stringify({ error: 'updates array required' }), { status: 400 });
    }

    const db = getDb();

    // Look up which exam types these chapters belong to
    const ids = updates.map(u => `'${u.id.replace(/'/g, "''")}'`);
    const examRows = db.getSyllabusByIds(updates.map(u => u.id));
    const examTypes = new Set(examRows.map(ch => ch.examType));

    const count = db.batchUpdateSyllabusStatus(updates);

    const progress: Record<string, any> = {};
    for (const exam of examTypes) {
      progress[exam] = db.getSyllabusProgress(exam);
    }

    return new Response(JSON.stringify({ updated: count, progress }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to batch update syllabus';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
