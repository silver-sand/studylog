import type { APIRoute } from 'astro';
import { getDb } from '../../db';
import { getSessionUser, scopeDbToUser } from '../../services/user-scope';

export const POST: APIRoute = async ({ request }) => {
  scopeDbToUser(request);
  try {
    const user = getSessionUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }

    const { name, stream, goal, targetHours, subjects } = await request.json();
    const db = getDb();

    // Update user profile
    if (name || stream || goal) {
      db.updateUser(user.id, { name: name || undefined, stream: stream || undefined, goal: goal || undefined });
    }

    // Pre-fill settings
    if (targetHours || subjects || stream) {
      const current = db.getSettings();
      const examType = stream === 'commerce' ? 'Boards (Commerce)' : current.examType;
      const defaultSubjects = stream === 'commerce'
        ? ['Accountancy', 'Business Studies', 'Economics', 'Applied Mathematics', 'English']
        : current.subjects;

      db.updateSettings({
        targetHoursPerWeek: targetHours ? Number(targetHours) : current.targetHoursPerWeek,
        subjects: Array.isArray(subjects) && subjects.length > 0 ? subjects : defaultSubjects,
        examType: examType,
      });
    }

    // Seed syllabus for this user's exam
    const settings = db.getSettings();
    db.seedSyllabusData(settings.examType);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Onboarding failed';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
