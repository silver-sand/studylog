export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  stream?: string;
  goal?: string;
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
  stream?: string;
  goal?: string;
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  token: string;
}
