import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string, email?: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: localStorage.getItem('lansphere_user')
    ? JSON.parse(localStorage.getItem('lansphere_user')!)
    : null,
  token: localStorage.getItem('lansphere_token') || null,
  isAuthenticated: !!localStorage.getItem('lansphere_token'),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(username, password);
      localStorage.setItem('lansphere_token', data.token);
      localStorage.setItem('lansphere_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  register: async (username, password, displayName, email) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(username, password, displayName, email);
      localStorage.setItem('lansphere_token', data.token);
      localStorage.setItem('lansphere_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('lansphere_token');
    localStorage.removeItem('lansphere_user');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('lansphere_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    try {
      const user = await authService.getCurrentUser();
      localStorage.setItem('lansphere_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (err) {
      localStorage.removeItem('lansphere_token');
      localStorage.removeItem('lansphere_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  setUser: (user) => {
    localStorage.setItem('lansphere_user', JSON.stringify(user));
    set({ user });
  },
}));
