import { getDb } from '../db';
import type { User } from '../types/auth';
import { getTokenFromCookie } from './auth-service';

/**
 * Extract the authenticated user from a request cookie.
 * Returns null if no valid session exists.
 */
export function getSessionUser(request: Request): User | null {
  const token = getTokenFromCookie(request);
  if (!token) return null;

  const db = getDb();
  const session = db.getSessionByToken(token);
  if (!session) return null;

  const user = db.getUserById(session.userId);
  return user;
}

/**
 * Set the DB user context for the current request scope.
 * Call this at the top of every API route and SSR page that needs user data.
 */
export function scopeDbToUser(request: Request): void {
  const user = getSessionUser(request);
  if (user) {
    getDb().setCurrentUser(user.id);
  } else {
    getDb().clearCurrentUser();
  }
}
