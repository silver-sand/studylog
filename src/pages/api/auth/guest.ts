import type { APIRoute } from 'astro';
import { createGuestUser, AuthError, SESSION_COOKIE_MAX_AGE_SECONDS } from '../../../services/auth-service';
import { validateOrigin } from '../_csrf';
import { rateLimit, rateLimitResponse } from '../../../services/rate-limit';

export const POST: APIRoute = async ({ request, clientAddress, cookies }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  // Guest accounts have no credentials, so an attacker can otherwise mint
  // unlimited user rows — 3/hour per IP caps that.
  const limited = rateLimitResponse(rateLimit(`guest:${clientAddress || 'unknown'}`, 3, 60 * 60 * 1000));
  if (limited) return limited;
  try {
    const result = await createGuestUser();
    // Two cookies: the session cookie for auth, and the anonymous refresh
    // token (sl_refresh_token) so a later signup can upgrade this uid.
    cookies.set('session_token', result.sessionCookie, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
      secure: import.meta.env.PROD,
    });
    if (result.refreshToken) {
      cookies.set('sl_refresh_token', result.refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        secure: import.meta.env.PROD,
      });
    }

    return new Response(JSON.stringify({ user: result.user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 500;
    const msg = e instanceof Error ? e.message : 'Failed to create guest session';
    return new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } });
  }
};
