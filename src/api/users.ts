import apiClient from '../lib/api-client';
import type { UserDto } from '../types';

export const usersApi = {
  getCurrentUser: async (): Promise<UserDto> => {
    const response = await apiClient.get<UserDto>('/api/users/me');
    return response.data;
  },

  getUserById: async (id: string): Promise<UserDto> => {
    const response = await apiClient.get<UserDto>(`/api/users/${id}`);
    return response.data;
  },

  getAllUsers: async (): Promise<UserDto[]> => {
    const response = await apiClient.get<UserDto[]>('/api/users');
    return response.data;
  },

  updateUserRole: async (userId: string, role: 'ADMIN' | 'USER' | 'SUPER_USER'): Promise<UserDto> => {
    const response = await apiClient.put<UserDto>(`/api/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/api/users/${userId}`);
  },
};