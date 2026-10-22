import api from './api';
import { ApiResponse, Conversation, Message } from '../types';

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const res = await api.get<ApiResponse<Conversation[]>>('/chats');
    return res.data.data;
  },

  async getConversation(id: number): Promise<Conversation> {
    const res = await api.get<ApiResponse<Conversation>>(`/chats/${id}`);
    return res.data.data;
  },

  async getMessages(conversationId: number): Promise<Message[]> {
    const res = await api.get<ApiResponse<Message[]>>(`/chats/${conversationId}/messages`);
    return res.data.data;
  },

  async startDirectChat(targetUserId: number): Promise<Conversation> {
    const res = await api.post<ApiResponse<Conversation>>(`/chats/direct/${targetUserId}`);
    return res.data.data;
  },

  async sendMessage(params: {
    conversationId: number;
    content: string;
    type?: string;
    replyToId?: number;
    fileTransferId?: number;
  }): Promise<Message> {
    const res = await api.post<ApiResponse<Message>>('/chats/messages', params);
    return res.data.data;
  },

  async markAsRead(conversationId: number): Promise<void> {
    await api.post(`/chats/${conversationId}/read`);
  },

  async searchMessages(conversationId: number, query: string): Promise<Message[]> {
    const res = await api.get<ApiResponse<Message[]>>(`/chats/${conversationId}/search?q=${encodeURIComponent(query)}`);
    return res.data.data;
  },
};
