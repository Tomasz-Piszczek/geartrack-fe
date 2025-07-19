import apiClient from '../lib/api-client';
import { API_ENDPOINTS } from '../constants';
import type { MachineDto, AssignMachineDto, PagedResponse, PaginationParams } from '../types';

export const machinesApi = {
  getAll: async (params?: PaginationParams): Promise<PagedResponse<MachineDto>> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    
    const url = `${API_ENDPOINTS.MACHINES.BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<PagedResponse<MachineDto>>(url);
    return response.data;
  },

  getAllNonPaginated: async (): Promise<MachineDto[]> => {
    const response = await apiClient.get<MachineDto[]>(
      `${API_ENDPOINTS.MACHINES.BASE}/all`
    );
    return response.data;
  },

  create: async (machine: MachineDto): Promise<MachineDto> => {
    const response = await apiClient.post<MachineDto>(
      API_ENDPOINTS.MACHINES.BASE,
      machine
    );
    return response.data;
  },

  update: async (machine: MachineDto): Promise<MachineDto> => {
    const response = await apiClient.put<MachineDto>(
      API_ENDPOINTS.MACHINES.BASE,
      machine
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.MACHINES.BY_ID(id));
  },

  assign: async (assignment: AssignMachineDto): Promise<MachineDto> => {
    const response = await apiClient.post<MachineDto>(
      API_ENDPOINTS.MACHINES.ASSIGN,
      assignment
    );
    return response.data;
  },
};