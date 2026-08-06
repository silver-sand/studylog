import type { StreamKey } from '../utils/stream-map';
import type { ClassLevel } from './profile';

export type UserType = 'authenticated' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  stream?: string;
  classLevel?: string;
  goal?: string;
  weakSubjects: string[];
  coaching: 'coaching_only' | 'self_study' | 'both' | null;
  targetRank: string | null;
  weeklyStudyGoal?: number;
  studyDaysPerWeek?: number;
  createdAt: string;
}

/**
 * Create a user profile row. `id` is the provider uid (Firebase Auth uid for
 * the Firestore adapter; the database auto-assigns it for the sqlite adapter).
 */
export interface CreateUserData {
  id?: string;
  name: string;
  email: string;
  userType?: UserType;
  stream?: string;
  classLevel?: string;
  goal?: string;
  weakSubjects?: string[];
  coaching?: 'coaching_only' | 'self_study' | 'both' | null;
  targetRank?: string | null;
  weeklyStudyGoal?: number;
  studyDaysPerWeek?: number;
}

export interface AuthResult {
  user: User;
  /** Admin SDK session cookie value; the caller sets it HttpOnly on the client. */
  sessionCookie: string;
  /** Firebase refresh token — set as `sl_refresh_token` so guest accounts can later be upgraded. */
  refreshToken?: string;
}
