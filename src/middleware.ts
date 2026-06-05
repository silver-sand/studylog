import { defineMiddleware } from 'astro/middleware';
import { getDb } from './db';
import { getTokenFromCookie, createGuestUser, getSessionUser } from './services/auth-service';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies } = context;

  // Check for existing valid session
  const token = getTokenFromCookie(request);
  const user = getSessionUser(token);

  if (user) {
    // Existing valid session — scope DB to this user
    getDb().setCurrentUser(user.id);
  } else {
    // No valid session — create a guest user and set a session cookie
    const guest = createGuestUser();

    getDb().setCurrentUser(guest.user.id);

    // Set the session cookie for the guest
    cookies.set('session_token', guest.token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  // Proceed — all handlers now have a user in scope
  const response = await next();
  return response;
});
