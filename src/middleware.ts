import { defineMiddleware } from 'astro/middleware';
import { getDb } from './db';
import { getTokenFromCookie, getSessionUser } from './services/auth-service';

// Paths accessible without authentication
const PUBLIC_PATHS = new Set(['/', '/api/auth/login', '/api/auth/signup']);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // API routes are also public (individual handlers do their own auth)
  if (pathname.startsWith('/api/')) return true;
  // Static assets
  if (pathname.startsWith('/_astro/') || pathname.startsWith('/favicon')) return true;
  return false;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, redirect } = context;
  const url = new URL(request.url);

  // Check for existing valid session
  const token = getTokenFromCookie(request);
  const user = getSessionUser(token);

  if (user) {
    // Existing valid session — scope DB to this user
    getDb().setCurrentUser(user.id);
    return next();
  }

  // No session — allow public paths, redirect everything else to landing page
  if (!isPublicPath(url.pathname)) {
    return redirect('/');
  }

  const response = await next();
  return response;
});
