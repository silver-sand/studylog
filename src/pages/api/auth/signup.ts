import type { APIRoute } from 'astro';
import { signup, getRefreshTokenFromCookie, AuthError, SESSION_COOKIE_MAX_AGE_SECONDS } from '../../../services/auth-service';
import { validateOrigin } from '../_csrf';
import { rateLimit, rateLimitResponse } from '../../../services/rate-limit';

export const POST: APIRoute = async ({ request, clientAddress, cookies }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  // 3 signups / hour per IP — prevents bulk account creation
  const limited = rateLimitResponse(rateLimit(`signup:${clientAddress || 'unknown'}`, 3, 60 * 60 * 1000));
  if (limited) return limited;
  try {
    const { name, email, password } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), { status: 400 });
    }

    // If a guest session exists (sl_refresh_token), upgrade it — Firebase
    // preserves the uid, so all guest data carries over into the new account.
    const guestRefreshToken = getRefreshTokenFromCookie(request);
    const result = await signup(
      name.trim(),
      email.trim().toLowerCase(),
      password,
      guestRefreshToken ? { guestRefreshToken } : undefined
    );
    cookies.set('session_token', result.sessionCookie, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
      secure: import.meta.env.PROD,
    });
    // The guest credentials are now consumed — drop the anonymous refresh token.
    cookies.delete('sl_refresh_token', { path: '/' });

    return new Response(JSON.stringify({ user: result.user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 500;
    const msg = e instanceof Error ? e.message : 'Signup failed';
    return new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } });
  }
};
