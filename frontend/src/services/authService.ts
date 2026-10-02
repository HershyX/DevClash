import { apiClient } from './apiClient';
import type { User, LoginCredentials } from '../types';

/**
 * Real backend authentication.
 * The backend issues a JWT and returns the full user object; the token is
 * stored by apiClient (localStorage) and sent as a Bearer header. Demo login
 * buttons call POST /api/auth/demo-login, which authenticates against the
 * seeded demo accounts in MongoDB.
 */

interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    token: string;
  };
}

const AUTH_STORAGE_KEY = 'devclash_user';
const TOKEN_STORAGE_KEY = 'devclash_token';

function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: User | null) {
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function persistAuth(user: User, token: string): { user: User; token: string } {
  apiClient.setToken(token);
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  setStoredUser(user);
  return { user, token };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const res = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return persistAuth(res.data.user, res.data.token);
  },

  async demoLogin(role: 'student' | 'teacher' | 'personal'): Promise<{ user: User; token: string }> {
    const res = await apiClient.post<AuthResponse>('/auth/demo-login', { role });
    return persistAuth(res.data.user, res.data.token);
  },

  async register(input: { name: string; email: string; password: string; role: User['role'] }): Promise<{ user: User; token: string }> {
    const res = await apiClient.post<AuthResponse>('/auth/register', input);
    return persistAuth(res.data.user, res.data.token);
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Token may already be expired/invalid — local cleanup still proceeds.
    }
    apiClient.setToken(null);
    setStoredUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },

  getCurrentUser(): User | null {
    return getStoredUser();
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  /**
   * On app boot: if a token exists, verify it against the backend.
   * A stored user snapshot is shown immediately; GET /auth/me refreshes it
   * with live Mongo data. Invalid/expired tokens are cleared.
   */
  async initializeAuth(): Promise<User | null> {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      apiClient.setToken(null);
      setStoredUser(null);
      return null;
    }

    apiClient.setToken(storedToken);

    try {
      const res = await apiClient.get<{ success: boolean; data: { user: User } }>('/auth/me');
      setStoredUser(res.data.user);
      return res.data.user;
    } catch {
      apiClient.setToken(null);
      setStoredUser(null);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
  },

  /** Fetch the fresh user object from the backend (ratings, stats, etc.). */
  async refreshUser(): Promise<User | null> {
    if (!localStorage.getItem(TOKEN_STORAGE_KEY)) return null;
    try {
      const res = await apiClient.get<{ success: boolean; data: { user: User } }>('/auth/me');
      setStoredUser(res.data.user);
      return res.data.user;
    } catch {
      return getStoredUser();
    }
  },
};

export async function loginUser(role: 'student' | 'teacher' | 'personal'): Promise<User> {
  const { user } = await authService.demoLogin(role);
  return user;
}

export function logoutUser(): void {
  authService.logout();
}

export function getCurrentUser(): User | null {
  return authService.getCurrentUser();
}
