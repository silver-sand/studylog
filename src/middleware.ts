import { defineMiddleware } from 'astro/middleware';
import { runWithUser } from './db/user-context';
import { getTokenFromCookie, getSessionUser } from './services/auth-service';

// Paths accessible without authentication
const PUBLIC_PATHS = new Set([
  '/', '/api/auth/login', '/api/auth/signup', '/api/auth/guest', '/api/auth/session',
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Static assets
  if (pathname.startsWith('/_astro/') || pathname.startsWith('/favicon')) return true;
  return false;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, redirect } = context;
  const url = new URL(request.url);

  // Check for existing valid session (session cookie verified via Firebase).
  const token = getTokenFromCookie(request);
  const user = await getSessionUser(token);

  if (user) {
    // Existing valid session — scope all downstream DB access to this user
    // for the entire request (AsyncLocalStorage; immune to interleaving).
    return runWithUser(user.id, () => next());
  }

  // No session.
  if (!isPublicPath(url.pathname)) {
    // API routes get a JSON 401 (the client reads it); pages redirect home.
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return redirect('/');
  }

  return runWithUser('', () => next());
});
