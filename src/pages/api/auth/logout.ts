import type { APIRoute } from 'astro';
import { logout, getTokenFromCookie } from '../../../services/auth-service';
import { validateOrigin } from '../_csrf';

/**
 * Handle both POST (API call from JS) and GET (direct navigation / form-based logout).
 * GET requests redirect to the landing page after clearing the session.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  try {
    await logout(getTokenFromCookie(request));
    cookies.delete('session_token', { path: '/' });
    cookies.delete('sl_refresh_token', { path: '/' });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Logout failed' }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    await logout(getTokenFromCookie(request));
  } catch {
    // Proceed with redirect even on error
  }
  cookies.delete('session_token', { path: '/' });
  cookies.delete('sl_refresh_token', { path: '/' });

  return new Response(null, {
    status: 302,
    headers: { Location: '/' },
  });
};
