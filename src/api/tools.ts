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

  assign: async (toolId: string, employeeId: string, assignment: AssignToolDto): Promise<AssignToolDto> => {
    const response = await apiClient.post<AssignToolDto>(
      API_ENDPOINTS.TOOLS.ASSIGN(toolId, employeeId),
      assignment
    );
    return response.data;
  },

  unassign: async (toolId: string, employeeId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.TOOLS.UNASSIGN(toolId, employeeId));
  },

  getEmployeesAssignedToTool: async (toolId: string): Promise<AssignToolDto[]> => {
    const response = await apiClient.get<AssignToolDto[]>(
      API_ENDPOINTS.TOOLS.EMPLOYEES(toolId)
    );
    return response.data;
  },
};