import type { APIRoute } from 'astro';
import { getDb } from '../../db';
import { STREAMS, getExamsForStream } from '../../utils/stream-map';
import { getSubjectsForExamKeys } from '../../utils/exam-map';
import { getTokenFromCookie, getSessionUser } from '../../services/auth-service';
import { scopeDbToUser } from '../../services/user-scope';

export const POST: APIRoute = async ({ request }) => {
  scopeDbToUser(request);
  try {
    const token = getTokenFromCookie(request);
    const user = getSessionUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }

    const { name, stream, selectedExams, targetHours } = await request.json();
    const db = getDb();

    // Update user profile
    if (name || stream) {
      db.updateUser(user.id, { name: name || undefined, stream: stream || undefined });
    }

    // Pre-fill settings
    if (targetHours || selectedExams?.length) {
      const current = db.getSettings();

      // Use explicitly selected exams, fall back to stream defaults
      const exams = selectedExams?.length ? selectedExams : (stream ? getExamsForStream(stream) : (current.selectedExams?.length ? current.selectedExams : ['JEE']));
      // Auto-compute subjects from selected exams
      const computedSubjects = getSubjectsForExamKeys(exams);

      db.updateSettings({
        targetHoursPerWeek: targetHours ? Number(targetHours) : current.targetHoursPerWeek,
        selectedExams: exams,
        subjects: computedSubjects,
      });

      // Seed syllabus for all selected exams
      for (const examKey of exams) {
        db.seedSyllabusData(examKey);
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
