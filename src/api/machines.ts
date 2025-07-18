import apiClient from '../lib/api-client';
import { API_ENDPOINTS } from '../constants';
import type { MachineDto, AssignMachineDto } from '../types';

export const machinesApi = {
  getAll: async (): Promise<MachineDto[]> => {
    const response = await apiClient.get<MachineDto[]>(
      API_ENDPOINTS.MACHINES.BASE
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