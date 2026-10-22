import { create } from 'zustand';
import { Notification } from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,

  setIsOpen: (open) => set({ isOpen: open }),

  fetchNotifications: async () => {
    try {
      const data = await notificationService.getNotifications();
      const count = data.filter((n) => !n.isRead).length;
      set({ notifications: data, unreadCount: count });
    } catch (err) {
      // Keep existing state on transient error
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationService.markAsRead(id);
      const updated = get().notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      set({
        notifications: updated,
        unreadCount: Math.max(0, get().unreadCount - 1),
      });
    } catch (err) {}
  },

  markAllRead: async () => {
    try {
      await notificationService.markAllAsRead();
      const updated = get().notifications.map((n) => ({ ...n, isRead: true }));
      set({ notifications: updated, unreadCount: 0 });
    } catch (err) {}
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
