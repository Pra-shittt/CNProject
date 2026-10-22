import api from './api';
import { ApiResponse, NetworkStatus } from '../types';

export const networkService = {
  async getNetworkStatus(): Promise<NetworkStatus> {
    const res = await api.get<ApiResponse<NetworkStatus>>('/network/status');
    return res.data.data;
  },

  async requestScreen(nodeId: string): Promise<void> {
    await api.post(`/network/screen/${encodeURIComponent(nodeId)}`);
  },

  async stopScreen(nodeId: string): Promise<void> {
    await api.delete(`/network/screen/${encodeURIComponent(nodeId)}`);
  },

  async getScreenFrame(nodeId: string): Promise<Blob | null> {
    const response = await api.get(`/network/screen/${encodeURIComponent(nodeId)}/frame`, {
      responseType: 'blob',
      validateStatus: (status) => status === 200 || status === 204,
    });
    return response.status === 204 ? null : response.data;
  },
};
