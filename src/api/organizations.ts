import apiClient from '../lib/api-client';
import type { OrganizationDto, UserDto, CreateOrganizationRequest, AssignUserRequest } from '../types';

export const organizationsApi = {
  getAllOrganizations: async (): Promise<OrganizationDto[]> => {
    const response = await apiClient.get<OrganizationDto[]>('/api/organizations');
    return response.data;
  },

  getOrganizationById: async (id: string): Promise<OrganizationDto> => {
    const response = await apiClient.get<OrganizationDto>(`/api/organizations/${id}`);
    return response.data;
  },

  createOrganization: async (request: CreateOrganizationRequest): Promise<OrganizationDto> => {
    const response = await apiClient.post<OrganizationDto>('/api/organizations', request);
    return response.data;
  },

  updateOrganization: async (id: string, request: CreateOrganizationRequest): Promise<OrganizationDto> => {
    const response = await apiClient.put<OrganizationDto>(`/api/organizations/${id}`, request);
    return response.data;
  },

  deleteOrganization: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/organizations/${id}`);
  },

  assignUserToOrganization: async (request: AssignUserRequest): Promise<UserDto> => {
    const response = await apiClient.post<UserDto>('/api/organizations/assign-user', request);
    return response.data;
  },

  removeUserFromOrganization: async (userEmail: string): Promise<UserDto> => {
    const response = await apiClient.post<UserDto>(`/api/organizations/remove-user/${userEmail}`);
    return response.data;
  },
};