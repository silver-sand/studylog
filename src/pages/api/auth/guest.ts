import type { APIRoute } from 'astro';
import { createGuestUser } from '../../../services/auth-service';

export const POST: APIRoute = async () => {
  try {
    const result = createGuestUser();

    return new Response(JSON.stringify({ user: result.user }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session_token=${result.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create guest session';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
