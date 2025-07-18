import apiClient from '../lib/api-client';
import { API_ENDPOINTS } from '../constants';
import type { EmployeeDto } from '../types';

export const employeesApi = {
  getAll: async (): Promise<EmployeeDto[]> => {
    const response = await apiClient.get<EmployeeDto[]>(
      API_ENDPOINTS.EMPLOYEES.BASE
    );
    return response.data;
  },

  create: async (employee: EmployeeDto): Promise<EmployeeDto> => {
    const response = await apiClient.post<EmployeeDto>(
      API_ENDPOINTS.EMPLOYEES.BASE,
      employee
    );
    return response.data;
  },

  update: async (employee: EmployeeDto): Promise<EmployeeDto> => {
    const response = await apiClient.put<EmployeeDto>(
      API_ENDPOINTS.EMPLOYEES.BASE,
      employee
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.EMPLOYEES.BY_ID(id));
  },
};