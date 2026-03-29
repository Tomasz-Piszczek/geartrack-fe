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
  year: number | null;
  month: number | null;
  hours: number;
  dailyHours: DailyHoursDto[];
}

export interface WorkerTimeDto {
  workerId: string;
  resourceId: string;
  minutesWorked: number;
  speedIndexContributionPercentage?: number;
}

export interface JobDto {
  id: number;
  numerZlecenia: string;
  date: string;
  productTypeId: string;
  quantity: number;
  workers: WorkerTimeDto[];
  totalMinutes: number;
}

export interface DailyWorkerDetailDto {
  date: string;
  productionHours: number;
  internalHours: number;
  idleHours: number;
  attendanceHours: number;
  wasCapped: boolean;
}

export interface WorkerStatsDto {
  workerId: string;
  resourceId: string;
  speedIndex: number | null;
  presence: number;
  production: number;
  internalWork: number;
  idle: number;
  jobCount: number;
  dailyDetails: DailyWorkerDetailDto[];
}

export interface WorkerAnalyticsRequestDto {
  dateFrom?: string;
  dateTo?: string;
  selectedProducts?: string[];
  excludedWorkers?: string[];
  soloOnly?: boolean;
  ignoreInternalWork?: boolean;
}

export interface CappedDayDto {
  workerId: string;
  date: string;
  originalHours: number;
  cappedHours: number;
}

export interface WorkerAnalyticsResponseDto {
  jobs: JobDto[];
  workerStats: WorkerStatsDto[];
  benchmarks: Record<string, number>;
  allWorkerIds: string[];
  allProductIds: string[];
  cappedDays: CappedDayDto[];
}

export interface SessionDto {
  timeFrom: string | null;
  timeTo: string | null;
  minutesWorked: number;
}

export interface WorkerDailyJobEntryDto {
  numerZlecenia: string;
  productTypeId: string;
  minutesWorked: number;
  sessions: SessionDto[];
}

export interface MaterialAuditRequestDto {
  dateFrom: string;
  dateTo: string;
  offsetPercent?: number;
  offsetNumber?: number;
}

export interface AuditMaterialEntryDto {
  twrKod: string;
  expectedIlosc: number | null;
  actualIlosc: number | null;
  ok: boolean;
}

export interface WorkerTimeEntryDto {
  workerId: string;
  minutesWorked: number;
}

export interface AuditOrderDto {
  numerZlecenia: string;
  dataZlecenia: string;
  productTypeId: string;
  materials: AuditMaterialEntryDto[];
  orderOk: boolean;
  workerTimeEntries?: WorkerTimeEntryDto[];
}

export interface WorkerAuditDto {
  workerId: string;
  correctOrders: AuditOrderDto[];
  incorrectOrders: AuditOrderDto[];
  totalOrders: number;
  correctCount: number;
  incorrectCount: number;
}

export interface MaterialAuditResponseDto {
  workers: WorkerAuditDto[];
  totalOrders: number;
  totalCorrect: number;
  totalIncorrect: number;
}

const biServiceClient = axios.create({
  baseURL: BI_SERVICE_URL,
  timeout: 30000,
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

  getEmployeeHours: async (employeeNames: string[], year?: number, month?: number): Promise<EmployeeHoursDto[]> => {
    const params: Record<string, string> = {};
    if (year !== undefined) params.year = year.toString();
    if (month !== undefined) params.month = month.toString();

    const response = await biServiceClient.post<EmployeeHoursDto[]>(
      API_ENDPOINTS.BI.EMPLOYEE_HOURS,
      employeeNames,
      { params }
    );
    return response.data;
  },

  getWorkerAnalytics: async (request: WorkerAnalyticsRequestDto): Promise<WorkerAnalyticsResponseDto> => {
    const response = await biServiceClient.post<WorkerAnalyticsResponseDto>(
      API_ENDPOINTS.BI.WORKER_ANALYTICS,
      request
    );
    return response.data;
  },

  getWorkerDailyJobs: async (workerId: string, date: string): Promise<WorkerDailyJobEntryDto[]> => {
    const response = await biServiceClient.get<WorkerDailyJobEntryDto[]>(
      API_ENDPOINTS.BI.WORKER_DAILY_JOBS,
      { params: { workerId, date } }
    );
    return response.data;
  },

  getMaterialAudit: async (request: MaterialAuditRequestDto): Promise<MaterialAuditResponseDto> => {
    const response = await biServiceClient.post<MaterialAuditResponseDto>(
      API_ENDPOINTS.BI.MATERIAL_AUDIT,
      request
    );
    return response.data;
  },
};

export default biServiceClient;