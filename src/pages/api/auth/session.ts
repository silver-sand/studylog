import type { APIRoute } from 'astro';
import { getSessionUser, getTokenFromCookie } from '../../../services/auth-service';

export const GET: APIRoute = async ({ request }) => {
  try {
    const token = getTokenFromCookie(request);
    const user = getSessionUser(token);

    if (!user) {
      return new Response(JSON.stringify({ user: null }), { status: 200 });
    }

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ user: null }), { status: 200 });
  }
};
