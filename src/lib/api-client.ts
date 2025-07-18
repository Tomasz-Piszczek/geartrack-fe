import axios, { AxiosError, type AxiosResponse } from 'axios';
import { API_BASE_URL, STORAGE_KEYS, ERROR_MESSAGES } from '../constants';
import type { ApiError } from '../types';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: ERROR_MESSAGES.GENERIC_ERROR,
      status: error.response?.status,
    };

    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
      apiError.message = ERROR_MESSAGES.UNAUTHORIZED;
    } else if (error.response?.status === 403) {
      apiError.message = ERROR_MESSAGES.FORBIDDEN;
    } else if (error.response?.status === 404) {
      apiError.message = ERROR_MESSAGES.NOT_FOUND;
    } else if (error.response?.status === 400) {
      apiError.message = ERROR_MESSAGES.VALIDATION_ERROR;
    } else if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      apiError.message = ERROR_MESSAGES.NETWORK_ERROR;
    } else if (error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
      apiError.message = error.response.data.message as string;
    }

    return Promise.reject(apiError);
  }
);

export default apiClient;