import axios, { AxiosError, type AxiosResponse } from 'axios';
import { BI_SERVICE_URL, STORAGE_KEYS, ERROR_MESSAGES, API_ENDPOINTS } from '../constants';
import type { ApiError } from '../types';

export interface ContractorDto {
  code: string;
  name: string;
}

export interface ProductGroupDto {
  id: number;
  code: string;
  name: string;
  parentId?: number;
  level: number;
  path: string;
}

export interface ProductDto {
  code: string;
  name: string;
  unitOfMeasure: string;
  purchaseDate: string;
  quantity: number;
  price: number;
  group?: ProductGroupDto;
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

export interface DailyHoursDto {
  date: string;
  hours: number;
}

export interface EmployeeHoursDto {
  employeeName: string;
  year: number;
  month: number;
  hours: number;
  dailyHours: DailyHoursDto[];
}

const biServiceClient = axios.create({
  baseURL: BI_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const biServiceApi = {
  getContractors: async (): Promise<ContractorDto[]> => {
    const response = await biServiceClient.get<ContractorDto[]>(
      API_ENDPOINTS.BI.CONTRACTORS
    );
    return response.data;
  },

  getProducts: async (filterQuantity: boolean = true, groupId?: number): Promise<ProductDto[]> => {
    const params = new URLSearchParams({
      filterQuantity: filterQuantity.toString()
    });
    
    if (groupId) {
      params.append('groupId', groupId.toString());
    }
    
    const queryString = params.toString();
    const url = queryString ? `${API_ENDPOINTS.BI.PRODUCTS}?${queryString}` : API_ENDPOINTS.BI.PRODUCTS;
    
    const response = await biServiceClient.get<ProductDto[]>(url);
    return response.data;
  },

  getProductGroups: async (): Promise<ProductGroupDto[]> => {
    const response = await biServiceClient.get<ProductGroupDto[]>(
      `${API_ENDPOINTS.BI.PRODUCTS}/groups`
    );
    return response.data;
  },

  getEmployeeHours: async (employeeNames: string[], year: number, month: number): Promise<EmployeeHoursDto[]> => {
    const response = await biServiceClient.post<EmployeeHoursDto[]>(
      API_ENDPOINTS.BI.EMPLOYEE_HOURS,
      employeeNames,
      {
        params: {
          year,
          month,
        },
      }
    );
    return response.data;
  },
};

export default biServiceClient;