import { defineMiddleware } from 'astro/middleware';
import { getDb } from './db';
import { getTokenFromCookie, createGuestUser, getSessionUser } from './services/auth-service';

// Asset extensions that should never trigger guest creation
const SKIP_GUEST_PATHS = ['/_astro/', '/favicon', '.css', '.js', '.svg', '.png', '.jpg', '.ico', '.woff', '.woff2'];

function shouldSkipGuestCreation(pathname: string): boolean {
  return SKIP_GUEST_PATHS.some(p => pathname.includes(p));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies } = context;
  const url = new URL(request.url);

  // Check for existing valid session
  const token = getTokenFromCookie(request);
  const user = getSessionUser(token);

  if (user) {
    // Existing valid session — scope DB to this user
    getDb().setCurrentUser(user.id);
    const response = await next();
    return response;
  }

  // No valid session — only create guest for actual page navigations,
  // not for static assets (CSS, JS, images, fonts) that fire in parallel
  // and would create dozens of orphaned guest users on first page load.
  const accept = request.headers.get('accept') || '';
  const isPageRequest = accept.includes('text/html') && !url.pathname.startsWith('/api/');

  if (isPageRequest && !shouldSkipGuestCreation(url.pathname)) {
    const guest = createGuestUser();
    getDb().setCurrentUser(guest.user.id);

    cookies.set('session_token', guest.token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  // Proceed — API routes and static assets without sessions will be handled
  // by scopeDbToUser() calls in individual handlers
  const response = await next();
  return response;
});
