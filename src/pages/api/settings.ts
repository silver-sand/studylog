import type { APIRoute } from 'astro';
import { getDb } from '../../db';
import { scopeDbToUser } from '../../services/user-scope';
import { getSyllabusKeyForExam, getSubjectsForExamKeys } from '../../utils/exam-map';
import { STREAMS } from '../../utils/stream-map';
import { validateOrigin } from './_csrf';

export const GET: APIRoute = async ({ request }) => {
  scopeDbToUser(request);
  try {
    const settings = getDb().getSettings();
    return new Response(JSON.stringify(settings));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to load settings' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  scopeDbToUser(request);
  try {
    const body = await request.json();
    const { targetHoursPerWeek, studyDaysPerWeek, selectedExams, subjects, examDate, theme, stream, name } = body;

    if (targetHoursPerWeek !== undefined) {
      const h = Number(targetHoursPerWeek);
      if (isNaN(h) || h < 1 || h > 168) {
        return new Response(JSON.stringify({ error: 'Target hours must be between 1 and 168' }), { status: 400 });
      }
    }

    if (selectedExams !== undefined) {
      if (!Array.isArray(selectedExams) || selectedExams.length === 0) {
        return new Response(JSON.stringify({ error: 'At least one exam is required' }), { status: 400 });
      }
    }

    if (studyDaysPerWeek !== undefined) {
      const d = Number(studyDaysPerWeek);
      if (isNaN(d) || d < 1 || d > 7) {
        return new Response(JSON.stringify({ error: 'Study days per week must be between 1 and 7' }), { status: 400 });
      }
    }

    if (examDate !== undefined && examDate !== null) {
      if (typeof examDate !== 'string' || isNaN(Date.parse(examDate))) {
        return new Response(JSON.stringify({ error: 'Exam date must be a valid date string or null' }), { status: 400 });
      }
    }

    if (stream !== undefined) {
      if (typeof stream !== 'string' || !(stream in STREAMS)) {
        const validKeys = Object.keys(STREAMS).join(', ');
        return new Response(JSON.stringify({ error: `Stream must be one of: ${validKeys}` }), { status: 400 });
      }
    }

    // Auto-compute subjects from selected exams if exams changed and subjects weren't explicitly provided
    let computedSubjects = subjects;
    if (selectedExams !== undefined && subjects === undefined) {
      computedSubjects = getSubjectsForExamKeys(selectedExams);
    }

    const settings = getDb().updateSettings({
      targetHoursPerWeek: targetHoursPerWeek !== undefined ? Number(targetHoursPerWeek) : undefined,
      studyDaysPerWeek: studyDaysPerWeek !== undefined ? Number(studyDaysPerWeek) : undefined,
      selectedExams: selectedExams !== undefined ? selectedExams : undefined,
      subjects: computedSubjects !== undefined ? computedSubjects : undefined,
      examDate: examDate !== undefined ? examDate : undefined,
      theme: theme !== undefined ? theme : undefined,
    });

    // Seed syllabus for newly selected exams — convert exam keys to syllabus keys
    if (selectedExams !== undefined) {
      const subjectsToSeed = computedSubjects ?? getSubjectsForExamKeys(selectedExams);
      const seededKeys = new Set<string>();
      for (const examKey of selectedExams) {
        const syllabusKey = getSyllabusKeyForExam(examKey);
        if (!seededKeys.has(syllabusKey)) {
          seededKeys.add(syllabusKey);
          getDb().seedSyllabusData(syllabusKey, subjectsToSeed);
        }
      }
    }

    // Persist stream change to user profile
    if (stream !== undefined && typeof stream === 'string') {
      const db = getDb();
      const currentUserId = db.getCurrentUser();
      if (currentUserId) {
        db.updateUser(currentUserId, { stream });
      }
    }

    // Persist name change to user profile
    if (name !== undefined && typeof name === 'string' && name.trim()) {
      const db = getDb();
      const currentUserId = db.getCurrentUser();
      if (currentUserId) {
        db.updateUser(currentUserId, { name: name.trim() });
      }
    }

    return new Response(JSON.stringify(settings));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to update settings' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
