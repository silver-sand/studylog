import type { APIRoute } from 'astro';
import { getDb } from '../../db';
import { scopeDbToUser } from '../../services/user-scope';
import { getSyllabusKeyForExam, getSubjectsForExamKeys } from '../../utils/exam-map';

export const GET: APIRoute = async ({ request }) => {
  scopeDbToUser(request);
  try {
    const settings = getDb().getSettings();
    return new Response(JSON.stringify(settings));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to load settings' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  scopeDbToUser(request);
  try {
    const body = await request.json();
    const { targetHoursPerWeek, studyDaysPerWeek, selectedExams, subjects, examDate, theme, stream } = body;

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

    // Seed syllabus for newly selected exams (filtered by subjects to avoid commerce/science mixing)
    if (selectedExams !== undefined) {
      const subjectsToSeed = computedSubjects ?? getSubjectsForExamKeys(selectedExams);
      for (const examKey of selectedExams) {
        getDb().seedSyllabusData(examKey, subjectsToSeed);
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

    return new Response(JSON.stringify(settings));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to update settings' }), { status: 500 });
  }
};
