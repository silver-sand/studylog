import { getDb } from '../db';
import type { User } from '../types/auth';
import { getTokenFromCookie } from './auth-service';

export type SafeUser = Omit<User, 'passwordHash'>;

/**
 * Extract the authenticated user from a request cookie.
 * Returns null if no valid session exists.
 * The returned user never exposes the passwordHash field.
 */
export function getSessionUser(request: Request): SafeUser | null {
  const token = getTokenFromCookie(request);
  if (!token) return null;

  const db = getDb();
  const session = db.getSessionByToken(token);
  if (!session) return null;

  const user = db.getUserById(session.userId);
  if (!user) return null;

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
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
