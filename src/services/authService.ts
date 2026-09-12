import { apiClient } from './apiClient';
import type { User, StudentUser, TeacherUser, PersonalUser, LoginCredentials, ApiResponse } from '../types';
import { mockStudent, mockTeacher, mockPersonal } from './mockData';

const AUTH_STORAGE_KEY = 'devclash_user';
const TOKEN_STORAGE_KEY = 'devclash_token';

interface MockAuthResponse {
  user: User;
  token: string;
}

function generateMockToken(role: string): string {
  return `mock-jwt-${role}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

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

export const authService = {
  async login(credentials: LoginCredentials): Promise<MockAuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const roleMap: Record<string, { user: User }> = {
      'student@devclash.demo': { user: mockStudent },
      'teacher@devclash.demo': { user: mockTeacher },
      'personal@devclash.demo': { user: mockPersonal },
    };

    // Accept any password for demo accounts (just match email)
    const match = roleMap[credentials.email];
    if (match) {
      const token = generateMockToken(match.user.role);
      apiClient.setToken(token);
      setStoredUser(match.user);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      return { user: match.user, token };
    }

    throw new Error('Invalid credentials. Use student@devclash.demo, teacher@devclash.demo, or personal@devclash.demo');
  },

  async demoLogin(role: 'student' | 'teacher' | 'personal'): Promise<MockAuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let user: User;
    switch (role) {
      case 'student':
        user = mockStudent;
        break;
      case 'teacher':
        user = mockTeacher;
        break;
      case 'personal':
        user = mockPersonal;
        break;
    }
    
    const token = generateMockToken(role);
    apiClient.setToken(token);
    setStoredUser(user);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return { user, token };
  },

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    apiClient.setToken(null);
    setStoredUser(null);
  },

  getCurrentUser(): User | null {
    return getStoredUser();
  },

  isAuthenticated(): boolean {
    return !!getStoredUser();
  },

  async initializeAuth(): Promise<User | null> {
    const storedUser = getStoredUser();
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    
    if (storedUser && storedToken) {
      apiClient.setToken(storedToken);
      return storedUser;
    }
    
    return null;
  },

  async refreshUser(): Promise<User | null> {
    const currentUser = getStoredUser();
    if (!currentUser) return null;
    
    switch (currentUser.role) {
      case 'student':
        return mockStudent;
      case 'teacher':
        return mockTeacher;
      case 'personal':
        return mockPersonal;
    }
  },
};

export async function loginUser(role: 'student' | 'teacher' | 'personal'): Promise<User> {
  const { user } = await authService.demoLogin(role);
  setStoredUser(user);
  return user;
}

export function logoutUser(): void {
  authService.logout();
}

export function getCurrentUser(): User | null {
  return authService.getCurrentUser();
}