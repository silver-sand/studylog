import type { APIRoute } from 'astro';
import { login } from '../../../services/auth-service';
import { validateOrigin } from '../_csrf';

export const POST: APIRoute = async ({ request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), { status: 400 });
    }

    const result = await login(email.trim().toLowerCase(), password);

    return new Response(JSON.stringify({ user: result.user }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session_token=${result.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Login failed';
    return new Response(JSON.stringify({ error: msg }), { status: 401 });
  }
};
