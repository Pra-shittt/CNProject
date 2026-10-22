import api from './api';
import { ApiResponse, Notification } from '../types';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const res = await api.get<ApiResponse<Notification[]>>('/notifications');
    return res.data.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await api.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
    return res.data.data.unreadCount;
  },

  async markAsRead(id: number): Promise<void> {
    await api.post(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/read-all');
  },
};
