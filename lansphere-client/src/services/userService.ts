import api from './api';
import { ApiResponse, User } from '../types';

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const res = await api.get<ApiResponse<User[]>>('/users');
    return res.data.data;
  },

  async getOnlineUsers(): Promise<User[]> {
    const res = await api.get<ApiResponse<User[]>>('/users/online');
    return res.data.data;
  },

  async searchUsers(query: string): Promise<User[]> {
    const res = await api.get<ApiResponse<User[]>>(`/users/search?q=${encodeURIComponent(query)}`);
    return res.data.data;
  },

  async getUserById(id: number): Promise<User> {
    const res = await api.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },

  async updateProfile(data: {
    displayName?: string;
    email?: string;
    bio?: string;
    avatarUrl?: string;
    status?: string;
  }): Promise<User> {
    const res = await api.put<ApiResponse<User>>('/users/profile', data);
    return res.data.data;
  },
};
