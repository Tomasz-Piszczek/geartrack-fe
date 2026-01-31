import apiClient from '../lib/api-client';
import { API_ENDPOINTS } from '../constants';
import type { UrlopDto } from '../types/index';

export const urlopyApi = {
  getByEmployeeId: async (employeeId: string): Promise<UrlopDto[]> => {
    const response = await apiClient.get<UrlopDto[]>(
      API_ENDPOINTS.URLOPY.BY_EMPLOYEE(employeeId)
    );
    return response.data;
  },

  create: async (employeeId: string, urlop: Omit<UrlopDto, 'id'>): Promise<UrlopDto> => {
    const response = await apiClient.post<UrlopDto>(
      API_ENDPOINTS.URLOPY.BY_EMPLOYEE(employeeId),
      urlop
    );
    return response.data;
  },

  update: async (id: string, urlop: UrlopDto): Promise<UrlopDto> => {
    const response = await apiClient.put<UrlopDto>(
      API_ENDPOINTS.URLOPY.BY_ID(id),
      urlop
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.URLOPY.BY_ID(id));
  },
};
