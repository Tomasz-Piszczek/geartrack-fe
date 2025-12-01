import apiClient from '../lib/api-client';
import { API_ENDPOINTS } from '../constants';
import type { EmployeeDto, PagedResponse, PaginationParams } from '../types';

export const employeesApi = {
  getAll: async (params?: PaginationParams): Promise<PagedResponse<EmployeeDto>> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `${API_ENDPOINTS.EMPLOYEES.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<PagedResponse<EmployeeDto>>(url);
    return response.data;
  },

  getAllNonPaginated: async (): Promise<EmployeeDto[]> => {
    const response = await apiClient.get<PagedResponse<EmployeeDto>>(
      `${API_ENDPOINTS.EMPLOYEES.BASE}?size=1000`
    );
    return response.data.content;
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

  getById: async (id: string): Promise<EmployeeDto> => {
    const response = await apiClient.get<EmployeeDto>(
      API_ENDPOINTS.EMPLOYEES.BY_ID(id)
    );
    return response.data;
  },

  getAssignedTools: async (id: string): Promise<any[]> => {
    const response = await apiClient.get<any[]>(
      `${API_ENDPOINTS.EMPLOYEES.BY_ID(id)}/tools`
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.EMPLOYEES.BY_ID(id));
  },
};