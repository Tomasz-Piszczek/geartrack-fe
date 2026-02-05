import apiClient from '../lib/api-client';
import { API_ENDPOINTS } from '../constants';
import type { MachineDto, PagedResponse, PaginationParams, MachineInspectionDto, CreateMachineInspectionDto } from '../types';

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
    const response = await apiClient.get<PagedResponse<MachineDto>>(
      `${API_ENDPOINTS.MACHINES.BASE}?size=1000`
    );
    return response.data.content;
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

  assign: async (machineId: string, employeeId: string): Promise<MachineDto> => {
    const response = await apiClient.post<MachineDto>(
      API_ENDPOINTS.MACHINES.ASSIGN(machineId, employeeId)
    );
    return response.data;
  },

  getMachineInspectionHistory: async (machineId: string): Promise<MachineInspectionDto[]> => {
    const response = await apiClient.get<MachineInspectionDto[]>(
      API_ENDPOINTS.MACHINES.MACHINE_INSPECTION_HISTORY(machineId)
    );
    return response.data;
  },

  createInspection: async (machineId: string, inspection: CreateMachineInspectionDto): Promise<MachineInspectionDto> => {
    const response = await apiClient.post<MachineInspectionDto>(
      API_ENDPOINTS.MACHINES.INSPECTIONS(machineId),
      inspection
    );
    return response.data;
  },

  updateInspection: async (inspectionId: string, inspection: CreateMachineInspectionDto): Promise<MachineInspectionDto> => {
    const response = await apiClient.put<MachineInspectionDto>(
      API_ENDPOINTS.MACHINES.INSPECTION_BY_ID(inspectionId),
      inspection
    );
    return response.data;
  },

  getScheduledInspections: async (): Promise<MachineInspectionDto[]> => {
    const response = await apiClient.get<MachineInspectionDto[]>(
      API_ENDPOINTS.MACHINES.SCHEDULED_INSPECTIONS
    );
    return response.data;
  },

  deleteInspection: async (inspectionId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.MACHINES.INSPECTION_BY_ID(inspectionId));
  },
};