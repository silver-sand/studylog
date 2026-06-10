import type { APIRoute } from 'astro';
import { logout, getTokenFromCookie } from '../../../services/auth-service';
import { validateOrigin } from '../_csrf';

function clearSession(request: Request) {
  const token = getTokenFromCookie(request);
  if (token) {
    logout(token);
  }
}

/**
 * Handle both POST (API call from JS) and GET (direct navigation / form-based logout).
 * GET requests redirect to the landing page after clearing the session.
 */
export const POST: APIRoute = async ({ request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  try {
    clearSession(request);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'session_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Logout failed' }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    clearSession(request);
  } catch {
    // Proceed with redirect even on error
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': 'session_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0',
    },
  });
};
