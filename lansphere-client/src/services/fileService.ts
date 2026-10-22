import api from './api';
import { ApiResponse, FileTransfer } from '../types';

export const fileService = {
  async getFileBlob(id: number): Promise<Blob> {
    const res = await api.get<Blob>(`/files/${id}/download`, { responseType: 'blob' });
    return res.data;
  },

  async downloadFile(id: number, filename: string): Promise<void> {
    const blob = await this.getFileBlob(id);
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  },

  async uploadFile(
    file: File,
    onProgress?: (percent: number) => void,
    receiverId?: number,
    conversationId?: number
  ): Promise<FileTransfer> {
    const formData = new FormData();
    formData.append('file', file);
    if (receiverId) formData.append('receiverId', receiverId.toString());
    if (conversationId) formData.append('conversationId', conversationId.toString());

    const res = await api.post<ApiResponse<FileTransfer>>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return res.data.data;
  },

  async getAllFiles(): Promise<FileTransfer[]> {
    const res = await api.get<ApiResponse<FileTransfer[]>>('/files');
    return res.data.data;
  },

  async getRecentFiles(limit = 10): Promise<FileTransfer[]> {
    const res = await api.get<ApiResponse<FileTransfer[]>>(`/files/recent?limit=${limit}`);
    return res.data.data;
  },

  async getFileById(id: number): Promise<FileTransfer> {
    const res = await api.get<ApiResponse<FileTransfer>>(`/files/${id}`);
    return res.data.data;
  },

  getDownloadUrl(id: number): string {
    return `/api/files/${id}/download`;
  },
};
