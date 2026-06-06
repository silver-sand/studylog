import { getDb } from '../db';
import type { AuthResult, User } from '../types/auth';

// ── Password hashing (Web Crypto API) ──

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

// ── Session tokens ──

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getExpiresAt(): string {
  return new Date(Date.now() + SESSION_DURATION_MS).toISOString();
}

// ── Guest user helpers ──

/**
 * Create a guest user and return a session token.
 * Guest users use a UUID-based email and empty password hash.
 */
export function createGuestUser(): { user: Omit<User, 'passwordHash'>; token: string } {
  const db = getDb();
  const crypto = globalThis.crypto;
  const guestId = crypto.randomUUID();
  const guestEmail = `guest-${guestId}@studylog.local`;
  const guestName = 'Guest';

  const user = db.createUser({
    name: guestName,
    email: guestEmail,
    passwordHash: '',
    userType: 'guest',
  });

  const token = generateToken();
  const expiresAt = getExpiresAt();
  db.createSession(user.id, token, expiresAt);

  return { user: { id: user.id, name: user.name, email: user.email, userType: user.userType, stream: user.stream, classLevel: user.classLevel, goal: user.goal, weakSubjects: user.weakSubjects, coaching: user.coaching, targetRank: user.targetRank, weeklyStudyGoal: user.weeklyStudyGoal, studyDaysPerWeek: user.studyDaysPerWeek, createdAt: user.createdAt }, token };
}

/**
 * Convert a guest user to a registered (authenticated) user.
 * Preserves all data — entries, reviews, syllabus progress.
 */
export async function convertGuestToAuthenticated(
  userId: string,
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const db = getDb();

  const existing = db.getUserByEmail(email);
  if (existing) {
    throw new Error('A user with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  db.updateUser(userId, { userType: 'authenticated', name });
  // Update email/password via raw DB since updateUser doesn't support email/password fields
  const typedDb = db as any;
  try {
    typedDb.getDb().run(`UPDATE users SET email = ?, password_hash = ? WHERE id = ?`, [email, passwordHash, userId]);
    typedDb.save();
  } catch { /* ignore */ }

  const user = db.getUserById(userId)!;

  const token = generateToken();
  const expiresAt = getExpiresAt();
  db.createSession(user.id, token, expiresAt);
  return { user: { id: user.id, name: user.name, email: user.email, userType: user.userType, stream: user.stream, classLevel: user.classLevel, goal: user.goal, weakSubjects: user.weakSubjects, coaching: user.coaching, targetRank: user.targetRank, weeklyStudyGoal: user.weeklyStudyGoal, studyDaysPerWeek: user.studyDaysPerWeek, createdAt: user.createdAt }, token };
}

// ── Public API ──

export async function signup(name: string, email: string, password: string, isGuestConversion?: { guestUserId: string }): Promise<AuthResult> {
  const db = getDb();

  if (isGuestConversion) {
    return convertGuestToAuthenticated(isGuestConversion.guestUserId, name, email, password);
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    throw new Error('A user with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = db.createUser({ name, email, passwordHash, userType: 'authenticated' });

  const token = generateToken();
  const expiresAt = getExpiresAt();
  db.createSession(user.id, token, expiresAt);

  return { user: { id: user.id, name: user.name, email: user.email, userType: user.userType, stream: user.stream, classLevel: user.classLevel, goal: user.goal, weakSubjects: user.weakSubjects, coaching: user.coaching, targetRank: user.targetRank, weeklyStudyGoal: user.weeklyStudyGoal, studyDaysPerWeek: user.studyDaysPerWeek, createdAt: user.createdAt }, token };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const db = getDb();

  const user = db.getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  // If guest user somehow logs in, convert them
  if (user.userType === 'guest') {
    db.updateUser(user.id, { userType: 'authenticated' });
  }

  const token = generateToken();
  const expiresAt = getExpiresAt();
  db.createSession(user.id, token, expiresAt);

  return { user: { id: user.id, name: user.name, email: user.email, userType: user.userType, stream: user.stream, classLevel: user.classLevel, goal: user.goal, weakSubjects: user.weakSubjects, coaching: user.coaching, targetRank: user.targetRank, weeklyStudyGoal: user.weeklyStudyGoal, studyDaysPerWeek: user.studyDaysPerWeek, createdAt: user.createdAt }, token };
}

export function logout(token: string): boolean {
  const db = getDb();
  db.deleteSession(token);
  return true;
}

export function getSessionUser(token: string | undefined | null): Omit<User, 'passwordHash'> | null {
  if (!token) return null;
  const db = getDb();

  db.deleteExpiredSessions();

  const session = db.getSessionByToken(token);
  if (!session) return null;

  const user = db.getUserById(session.userId);
  if (!user) return null;

  return { id: user.id, name: user.name, email: user.email, userType: user.userType, stream: user.stream, classLevel: user.classLevel, goal: user.goal, weakSubjects: user.weakSubjects, coaching: user.coaching, targetRank: user.targetRank, weeklyStudyGoal: user.weeklyStudyGoal, studyDaysPerWeek: user.studyDaysPerWeek, createdAt: user.createdAt };
}

export function getTokenFromCookie(request: Request): string | null {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)session_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Exit guest mode: delete the guest's session so they see the landing page.
 * Does NOT delete the guest user or their data — signing up later reconnects.
 */
export function exitGuestMode(token: string): boolean {
  const db = getDb();
  db.deleteSession(token);
  return true;
}
