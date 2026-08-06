import type { APIRoute } from 'astro';
import { login, AuthError, SESSION_COOKIE_MAX_AGE_SECONDS } from '../../../services/auth-service';
import { validateOrigin } from '../_csrf';
import { rateLimit, rateLimitResponse } from '../../../services/rate-limit';

export const POST: APIRoute = async ({ request, clientAddress, cookies }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  // 5 attempts / 15 min per IP — throttles credential stuffing
  const limited = rateLimitResponse(rateLimit(`login:${clientAddress || 'unknown'}`, 5, 15 * 60 * 1000));
  if (limited) return limited;
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), { status: 400 });
    }

    const result = await login(email.trim().toLowerCase(), password);
    cookies.set('session_token', result.sessionCookie, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
      secure: import.meta.env.PROD,
    });

    return new Response(JSON.stringify({ user: result.user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    const msg = e instanceof Error ? e.message : 'Login failed';
    return new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } });
  }
};
