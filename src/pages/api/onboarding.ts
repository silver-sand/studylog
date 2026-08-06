import type { APIRoute } from 'astro';
import { getDb } from '../../db';
import { STREAMS, getExamsForStream } from '../../utils/stream-map';
import { getSubjectsForExamKeys } from '../../utils/exam-map';
import { getTokenFromCookie, getSessionUser } from '../../services/auth-service';
import { validateOrigin } from './_csrf';

export const POST: APIRoute = async ({ request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  try {
    const token = getTokenFromCookie(request);
    const user = await getSessionUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }

    const { name, stream, classLevel, selectedExams, targetHours, studyDaysPerWeek, weakSubjects, coaching, targetRank, subjects } = await request.json();
    const db = getDb();

    // Update user profile
    if (name || stream || classLevel || weakSubjects || coaching || targetRank) {
      await db.updateUser(user.id, {
        name: name || undefined,
        stream: stream || undefined,
        classLevel: classLevel || undefined,
        weakSubjects: weakSubjects !== undefined ? weakSubjects : undefined,
        coaching: coaching !== undefined ? coaching : undefined,
        targetRank: targetRank !== undefined ? targetRank : undefined,
      });
    }

    // Pre-fill settings
    if (targetHours || studyDaysPerWeek || selectedExams?.length) {
      const current = await db.getSettings();

      // Use explicitly selected exams, fall back to stream defaults
      const exams = selectedExams?.length ? selectedExams : (stream ? getExamsForStream(stream) : (current.selectedExams?.length ? current.selectedExams : ['JEE']));
      // Use explicit subjects if provided, otherwise auto-compute from selected exams
      const computedSubjects = subjects?.length ? subjects : getSubjectsForExamKeys(exams);

      await db.updateSettings({
        targetHoursPerWeek: targetHours ? Number(targetHours) : current.targetHoursPerWeek,
        studyDaysPerWeek: studyDaysPerWeek ? Number(studyDaysPerWeek) : current.studyDaysPerWeek,
        selectedExams: exams,
        subjects: computedSubjects,
      });

      // Seed syllabus for all selected exams (filtered by subjects so commerce doesn't get science)
      for (const examKey of exams) {
        await db.seedSyllabusData(examKey, computedSubjects);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Onboarding failed';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
