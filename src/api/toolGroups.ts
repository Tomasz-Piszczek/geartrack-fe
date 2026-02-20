import apiClient from '../lib/api-client';
import { API_ENDPOINTS } from '../constants';
import type { ToolGroupDto } from '../types';

export const toolGroupsApi = {
  getAll: async (): Promise<ToolGroupDto[]> => {
    const response = await apiClient.get<ToolGroupDto[]>(
      API_ENDPOINTS.TOOL_GROUPS.BASE
    );
    return response.data;
  },

  create: async (group: ToolGroupDto): Promise<ToolGroupDto> => {
    const response = await apiClient.post<ToolGroupDto>(
      API_ENDPOINTS.TOOL_GROUPS.BASE,
      group
    );
    return response.data;
  },

  update: async (group: ToolGroupDto): Promise<ToolGroupDto> => {
    const response = await apiClient.put<ToolGroupDto>(
      API_ENDPOINTS.TOOL_GROUPS.BASE,
      group
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.TOOL_GROUPS.BY_ID(id));
  },
};
