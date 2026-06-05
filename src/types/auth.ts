import type { StreamKey } from '../utils/stream-map';
import type { ClassLevel } from './profile';

export type UserType = 'authenticated' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  userType: UserType;
  stream?: string;
  classLevel?: string;
  goal?: string;
  weeklyStudyGoal?: number;
  studyDaysPerWeek?: number;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  userType?: UserType;
  stream?: string;
  classLevel?: string;
  goal?: string;
  weeklyStudyGoal?: number;
  studyDaysPerWeek?: number;
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  token: string;
}
