import api from './api';
import { ApiResponse, DashboardData } from '../types';

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const res = await api.get<ApiResponse<DashboardData>>('/dashboard');
    return res.data.data;
  },
};
