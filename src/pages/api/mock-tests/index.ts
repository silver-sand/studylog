import type { APIRoute } from 'astro';
import { getDb } from '../../../db';
import { scopeDbToUser } from '../../../services/user-scope';
import { validateOrigin } from '../_csrf';

export const GET: APIRoute = async ({ url, request }) => {
  scopeDbToUser(request);
  try {
    const db = getDb();
    const subject = url.searchParams.get('subject') || undefined;
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined;

    const tests = db.getMockTests({ subject, limit });
    const analytics = db.getMockTestAnalytics();

    return new Response(JSON.stringify({ tests, analytics }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load mock tests';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  scopeDbToUser(request);
  try {
    const body = await request.json();
    const { subject, testName, score, maxMarks, date, examType, notes } = body;

    if (!subject || !testName || score === undefined || maxMarks === undefined || !date) {
      return new Response(JSON.stringify({ error: 'subject, testName, score, maxMarks, date are required' }), { status: 400 });
    }

    if (typeof score !== 'number' || typeof maxMarks !== 'number' || isNaN(score) || isNaN(maxMarks) || maxMarks <= 0) {
      return new Response(JSON.stringify({ error: 'score must be a valid number and maxMarks must be a valid positive number' }), { status: 400 });
    }

    const db = getDb();
    const test = db.createMockTest({
      subject,
      testName,
      score,
      maxMarks,
      date,
      examType: examType || '',
      notes: notes || '',
    });

    return new Response(JSON.stringify(test));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create mock test';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
