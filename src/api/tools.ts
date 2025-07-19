import apiClient from '../lib/api-client';
import { API_ENDPOINTS } from '../constants';
import type { ToolDto, AssignToolDto } from '../types';

export const toolsApi = {
  getAll: async (): Promise<ToolDto[]> => {
    const response = await apiClient.get<ToolDto[]>(
      API_ENDPOINTS.TOOLS.BASE
    );
    return response.data;
  },

  create: async (tool: ToolDto): Promise<ToolDto> => {
    const response = await apiClient.post<ToolDto>(
      API_ENDPOINTS.TOOLS.BASE,
      tool
    );
    return response.data;
  },

  update: async (tool: ToolDto): Promise<ToolDto> => {
    const response = await apiClient.put<ToolDto>(
      API_ENDPOINTS.TOOLS.BASE,
      tool
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.TOOLS.BY_ID(id));
  },

  assign: async (assignment: AssignToolDto): Promise<AssignToolDto> => {
    const response = await apiClient.post<AssignToolDto>(
      API_ENDPOINTS.TOOLS.ASSIGN,
      assignment
    );
    return response.data;
  },

  unassign: async (assignment: AssignToolDto): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.TOOLS.UNASSIGN, {
      data: assignment,
    });
  },

  getAvailableQuantity: async (toolId: string): Promise<{availableQuantity: number, totalAssigned: number}> => {
    const response = await apiClient.get<{availableQuantity: number, totalAssigned: number}>(
      `${API_ENDPOINTS.TOOLS.BY_ID(toolId)}/available-quantity`
    );
    return response.data;
  },
};