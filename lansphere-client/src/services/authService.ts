import api from './api';
import { ApiResponse, User } from '../types';

export interface AuthResponseData {
  token: string;
  tokenType: string;
  user: User;
}

export const authService = {
  async login(username: string, password: string):Promise<AuthResponseData> {
    const res = await api.post<ApiResponse<AuthResponseData>>('/auth/login', { username, password });
    return res.data.data;
  },

  async register(username: string, password: string, displayName?: string, email?: string): Promise<AuthResponseData> {
    const res = await api.post<ApiResponse<AuthResponseData>>('/auth/register', {
      username,
      password,
      displayName,
      email,
    });
    return res.data.data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
};
