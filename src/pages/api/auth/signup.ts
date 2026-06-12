import type { APIRoute } from 'astro';
import { getDb } from '../../../db';
import { signup } from '../../../services/auth-service';
import { validateOrigin } from '../_csrf';

export const POST: APIRoute = async ({ request }) => {
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
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

    // Check if current user (set by middleware) is a guest — convert them
    const currentUserId = getDb().getCurrentUser();
    const currentUser = currentUserId ? getDb().getUserById(currentUserId) : null;
    const isGuest = currentUser?.userType === 'guest';

    const result = await signup(
      name.trim(),
      email.trim().toLowerCase(),
      password,
      isGuest ? { guestUserId: currentUserId } : undefined
    );
    const secureFlag = import.meta.env.PROD ? '; Secure' : '';

    return new Response(JSON.stringify({ user: result.user }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session_token=${result.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}${secureFlag}`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Signup failed';
    return new Response(JSON.stringify({ error: msg }), { status: 409 });
  }
};
