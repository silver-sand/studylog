import type { APIRoute } from 'astro';
import { getDb } from '../../../db';
import { scopeDbToUser } from '../../../services/user-scope';
import { EXAM_DEFINITIONS, getSubjectsForExamKeys } from '../../../utils/exam-map';
import { validateOrigin } from '../_csrf';

const VALID_STATUSES = ['not_started', 'studied', 'revision_1', 'revision_2', 'revision_3', 'mastered'] as const;

export const GET: APIRoute = async ({ url, request }) => {
  scopeDbToUser(request);
  try {
    const db = getDb();
    const examType = url.searchParams.get('exam') || undefined;
    const subject = url.searchParams.get('subject') || undefined;

    // Determine relevant subjects from user's selected exams
    const settings = db.getSettings();
    const selectedExams = settings.selectedExams?.length ? settings.selectedExams : ['JEE'];
    const activeSubjects = getSubjectsForExamKeys(selectedExams);

    if (examType) {
      // Seed only the user's subjects
      db.seedSyllabusData(examType, activeSubjects);
      const chapters = db.getSyllabus(examType, subject).filter(ch =>
        !subject && activeSubjects.length > 0 ? activeSubjects.includes(ch.subject) : true
      );
      const progress = db.getSyllabusProgress(examType, subject ? [subject] : activeSubjects);
      return new Response(JSON.stringify({ chapters, progress }));
    }

    // Return summaries for unique syllabus keys relevant to user's exams
    const relevantKeys = new Set(
      selectedExams
        .map(key => EXAM_DEFINITIONS.find(e => e.key === key)?.syllabusKey)
        .filter(Boolean)
    );
    const summaries = [...relevantKeys].map(e => ({
      examType: e,
      progress: db.getSyllabusProgress(e, activeSubjects),
    }));

    return new Response(JSON.stringify({ exams: summaries }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load syllabus';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  scopeDbToUser(request);
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return new Response(JSON.stringify({ error: 'id and status required' }), { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
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
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  scopeDbToUser(request);
  try {
    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return new Response(JSON.stringify({ error: 'updates array required' }), { status: 400 });
    }

    // Validate all status values before applying
    for (const u of updates) {
      if (!u.id || !u.status || !VALID_STATUSES.includes(u.status)) {
        return new Response(JSON.stringify({ error: `Invalid status "${u.status}" for chapter ${u.id}` }), { status: 400 });
      }
    }

    const db = getDb();
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
