import axios, { AxiosError, type AxiosResponse } from 'axios';
import { BI_SERVICE_URL, STORAGE_KEYS, ERROR_MESSAGES, API_ENDPOINTS } from '../constants';
import type { ApiError } from '../types';

export interface ContractorDto {
  code: string;
  name: string;
}

export interface ProductDto {
  code: string;
  name: string;
  unitOfMeasure: string;
  purchaseDate: string;
  quantity: number;
  price: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Create axios instance for BI service
const biServiceClient = axios.create({
  baseURL: BI_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
biServiceClient.interceptors.request.use(
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
biServiceClient.interceptors.response.use(
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

// API functions
export const biServiceApi = {
  // Get all contractors (without pagination for client-side filtering)
  getContractors: async (): Promise<ContractorDto[]> => {
    // Fetch with large page size to get all contractors
    const response = await biServiceClient.get<PageResponse<ContractorDto>>(
      `${API_ENDPOINTS.BI.CONTRACTORS}?size=10000`
    );
    return response.data.content;
  },

  // Get all products (without pagination for client-side filtering)
  getProducts: async (): Promise<ProductDto[]> => {
    // Fetch with large page size to get all products
    const response = await biServiceClient.get<PageResponse<ProductDto>>(
      `${API_ENDPOINTS.BI.PRODUCTS}?size=10000`
    );
    return response.data.content;
  },
};

export default biServiceClient;