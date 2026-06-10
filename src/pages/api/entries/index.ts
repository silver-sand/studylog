import type { APIRoute } from 'astro';
import { createEntry, listEntries } from '../../../services/entry-service';
import { getDb } from '../../../db';
import { formatDate } from '../../../utils/date';
import { scopeDbToUser } from '../../../services/user-scope';
import { validateOrigin } from '../_csrf';

export const POST: APIRoute = async ({ request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  scopeDbToUser(request);
  try {
    const body = await request.json();
    const { content, hoursStudied, studyType, focusRating, examType, subjects } = body;

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Content is required' }), { status: 400 });
    }

    const trimmed = content.trim();
    if (trimmed.length < 10) {
      return new Response(JSON.stringify({ error: 'Content must be at least 10 characters' }), { status: 400 });
    }
    if (trimmed.length > 10000) {
      return new Response(JSON.stringify({ error: 'Content must be under 10000 characters' }), { status: 400 });
    }

    if (hoursStudied !== undefined) {
      const h = Number(hoursStudied);
      if (isNaN(h) || h < 0 || h > 24) {
        return new Response(JSON.stringify({ error: 'Hours must be between 0 and 24' }), { status: 400 });
      }
    }

    const VALID_STUDY_TYPES = ['theory', 'problem_solving', 'revision', 'test', 'other'];
    if (studyType !== undefined && !VALID_STUDY_TYPES.includes(studyType)) {
      return new Response(JSON.stringify({ error: 'Invalid study type' }), { status: 400 });
    }

    if (focusRating !== undefined) {
      const r = Number(focusRating);
      if (isNaN(r) || r < 0 || r > 5) {
        return new Response(JSON.stringify({ error: 'Focus rating must be 0-5' }), { status: 400 });
      }
    }

    const today = formatDate(new Date());

    const entry = await createEntry({
      date: today,
      content: trimmed,
      hoursStudied: hoursStudied !== undefined ? Number(hoursStudied) : undefined,
      studyType: studyType || undefined,
      focusRating: focusRating !== undefined ? Number(focusRating) : undefined,
      examType: examType || undefined,
    });

    return new Response(JSON.stringify(entry), { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ request, url }) => {
  scopeDbToUser(request);
  try {
    const from = url.searchParams.get('from') || undefined;
    const to = url.searchParams.get('to') || undefined;
    const limitRaw = url.searchParams.get('limit');
    const offsetRaw = url.searchParams.get('offset');
    const limit = limitRaw ? Number(limitRaw) : undefined;
    const offset = offsetRaw ? Number(offsetRaw) : undefined;
    // Guard against NaN from invalid query param values
    const validLimit = limit !== undefined && !isNaN(limit) ? limit : undefined;
    const validOffset = offset !== undefined && !isNaN(offset) ? offset : undefined;

    const entries = listEntries({ from, to, limit: validLimit, offset: validOffset });
    return new Response(JSON.stringify(entries));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to list entries' }), { status: 500 });
  }
};
