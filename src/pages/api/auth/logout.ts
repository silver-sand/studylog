import type { APIRoute } from 'astro';
import { logout, getTokenFromCookie } from '../../../services/auth-service';
import { validateOrigin } from '../_csrf';

export const POST: APIRoute = async ({ request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  try {
    const token = getTokenFromCookie(request);
    if (token) {
      logout(token);
    }

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
