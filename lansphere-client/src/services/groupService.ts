import api from './api';
import { ApiResponse, Group } from '../types';

export const groupService = {
  async getPublicGroups(): Promise<Group[]> {
    const res = await api.get<ApiResponse<Group[]>>('/groups/public');
    return res.data.data;
  },

  async getMyGroups(): Promise<Group[]> {
    const res = await api.get<ApiResponse<Group[]>>('/groups/my');
    return res.data.data;
  },

  async getGroupById(id: number): Promise<Group> {
    const res = await api.get<ApiResponse<Group>>(`/groups/${id}`);
    return res.data.data;
  },

  async createGroup(data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    maxMembers?: number;
    memberIds?: number[];
  }): Promise<Group> {
    const res = await api.post<ApiResponse<Group>>('/groups', data);
    return res.data.data;
  },

  async joinGroup(id: number): Promise<Group> {
    const res = await api.post<ApiResponse<Group>>(`/groups/${id}/join`);
    return res.data.data;
  },

  async leaveGroup(id: number): Promise<void> {
    await api.post(`/groups/${id}/leave`);
  },
};
