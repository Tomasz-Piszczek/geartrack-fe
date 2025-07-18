import apiClient from '../lib/api-client';
import { API_ENDPOINTS } from '../constants';
import type { LoginDto, RegisterDto, AuthResponseDto } from '../types';

export const authApi = {
  login: async (credentials: LoginDto): Promise<AuthResponseDto> => {
    const response = await apiClient.post<AuthResponseDto>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    return response.data;
  },

  register: async (userData: RegisterDto): Promise<AuthResponseDto> => {
    const response = await apiClient.post<AuthResponseDto>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData
    );
    return response.data;
  },

  oauth2Success: async (): Promise<AuthResponseDto> => {
    const response = await apiClient.get<AuthResponseDto>(
      API_ENDPOINTS.AUTH.OAUTH2_SUCCESS
    );
    return response.data;
  },
};