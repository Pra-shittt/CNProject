import api from './api';
import { ActivityLog, ApiResponse } from '../types';

export const activityService = {
  async getRecentActivities(limit = 20): Promise<ActivityLog[]> {
    const res = await api.get<ApiResponse<ActivityLog[]>>(`/activities/recent?limit=${limit}`);
    return res.data.data;
  },
};
