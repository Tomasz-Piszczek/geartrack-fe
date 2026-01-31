import apiClient from '../lib/api-client';
import { API_ENDPOINTS } from '../constants';
import type { BadanieSzkolenieDto } from '../types/index';

export const badaniaSzkoleniaApi = {
  getByEmployeeId: async (employeeId: string): Promise<BadanieSzkolenieDto[]> => {
    const response = await apiClient.get<BadanieSzkolenieDto[]>(
      API_ENDPOINTS.BADANIA_SZKOLENIA.BY_EMPLOYEE(employeeId)
    );
    return response.data;
  },

  create: async (employeeId: string, badanie: Omit<BadanieSzkolenieDto, 'id' | 'status'>): Promise<BadanieSzkolenieDto> => {
    const response = await apiClient.post<BadanieSzkolenieDto>(
      API_ENDPOINTS.BADANIA_SZKOLENIA.BY_EMPLOYEE(employeeId),
      badanie
    );
    return response.data;
  },

  update: async (id: string, badanie: BadanieSzkolenieDto): Promise<BadanieSzkolenieDto> => {
    const response = await apiClient.put<BadanieSzkolenieDto>(
      API_ENDPOINTS.BADANIA_SZKOLENIA.BY_ID(id),
      badanie
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.BADANIA_SZKOLENIA.BY_ID(id));
  },

  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>(
      API_ENDPOINTS.BADANIA_SZKOLENIA.CATEGORIES
    );
    return response.data;
  },
};
