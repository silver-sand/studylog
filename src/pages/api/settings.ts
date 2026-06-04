import type { APIRoute } from 'astro';
import { getDb } from '../../db';
import { scopeDbToUser } from '../../services/user-scope';

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
    const { targetHoursPerWeek, subjects, examType, examDate, theme } = body;

    if (targetHoursPerWeek !== undefined) {
      const h = Number(targetHoursPerWeek);
      if (isNaN(h) || h < 1 || h > 168) {
        return new Response(JSON.stringify({ error: 'Target hours must be between 1 and 168' }), { status: 400 });
      }
    }

    if (subjects !== undefined) {
      if (!Array.isArray(subjects) || subjects.length === 0) {
        return new Response(JSON.stringify({ error: 'At least one subject is required' }), { status: 400 });
      }
    }

    if (examType !== undefined && (typeof examType !== 'string' || examType.trim().length === 0)) {
      return new Response(JSON.stringify({ error: 'Exam type must be a non-empty string' }), { status: 400 });
    }

    const settings = getDb().updateSettings({
      targetHoursPerWeek: targetHoursPerWeek !== undefined ? Number(targetHoursPerWeek) : undefined,
      subjects: subjects !== undefined ? subjects : undefined,
      examType: examType !== undefined ? examType : undefined,
      examDate: examDate !== undefined ? examDate : undefined,
      theme: theme !== undefined ? theme : undefined,
    });

    return new Response(JSON.stringify(settings));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to update settings' }), { status: 500 });
  }
};
