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

// ─── Profitability ───────────────────────────────────────────────────────────

export interface DocumentElementDto {
  dokNumer: string;
  twrKod: string;
  ilosc: number;
  wartoscNetto: number;
}

export interface JobProfitabilityWorkerDto {
  workerId: string;
  resourceId: string;
  minutes: number;
  hours: number;
  laborCost: number;
  shareOfProfit: number;
  sharePct: number;
}

export interface JobProfitabilityRowDto {
  cznId: number;
  numerZlecenia: string;
  productTypeId: string;
  orderQuantity: number;
  orderDate: string;
  invoiceNumber: string;
  invoiceDate: string;
  roNumer: string;
  coBundledZpCount: number;
  revenueAttributionConfidence: 'HIGH' | 'NO_INVOICE' | 'HIDDEN' | 'LOW';
  revenue: number;
  materialCost: number;
  laborMinutes: number;
  laborHours: number;
  laborCost: number;
  profit: number;
  marginPct: number;
  workers: JobProfitabilityWorkerDto[];
  rwElements: DocumentElementDto[];
  hasMaterialCost: boolean;
  hasLaborTime: boolean;
  fskorAdjustmentApplied: boolean;
}

export interface JobProfitabilitySummaryDto {
  totalJobs: number;
  withInvoiceJobs: number;
  noInvoiceJobs: number;
  hiddenUninvoicedJobs: number;
  totalRevenue: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalProfit: number;
  avgMarginPct: number;
  top5: JobProfitabilityRowDto[];
  bottom5: JobProfitabilityRowDto[];
}

export interface JobProfitabilityResponseDto {
  rows: JobProfitabilityRowDto[];
  summary: JobProfitabilitySummaryDto;
}

export type ConfidenceFilter = 'ALL' | 'WITH_INVOICE' | 'NO_INVOICE' | 'HIDDEN';

export interface JobProfitabilityRequestDto {
  dateFrom?: string;
  dateTo?: string;
  hourlyRate: number;
  selectedProducts?: string[];
  excludedWorkers?: string[];
  ignoreInternalWork?: boolean;
  /** Preferred. */
  confidenceFilter?: ConfidenceFilter;
  /** @deprecated use confidenceFilter. Server still accepts it for backwards compat. */
  minConfidence?: 'HIGH' | 'LOW';
  sortBy?: 'PROFIT_DESC' | 'PROFIT_ASC' | 'MARGIN_DESC' | 'MARGIN_ASC' | 'REVENUE_DESC' | 'INVOICE_DESC' | 'INVOICE_ASC';
}

export interface WorkerCashTopJobDto {
  numerZlecenia: string;
  productTypeId: string;
  invoiceNumber: string;
  myMinutes: number;
  myShareOfProfit: number;
}

export interface WorkerCashRowDto {
  workerId: string;
  resourceId: string;
  totalMinutes: number;
  totalHours: number;
  jobsTouched: number;
  attributedRevenue: number;
  attributedMaterialCost: number;
  attributedLaborCost: number;
  attributedProfit: number;
  profitPerHour: number;
  topJobs: WorkerCashTopJobDto[];
  worstJobs: WorkerCashTopJobDto[];
}

export interface WorkerCashResponseDto {
  rows: WorkerCashRowDto[];
  totalAttributedProfit: number;
  totalAttributedRevenue: number;
  totalJobsAnalyzed: number;
}

export interface WorkerCashRequestDto {
  dateFrom?: string;
  dateTo?: string;
  hourlyRate: number;
  selectedProducts?: string[];
  excludedWorkers?: string[];
  ignoreInternalWork?: boolean;
  confidenceFilter?: ConfidenceFilter;
  /** @deprecated use confidenceFilter. */
  minConfidence?: 'HIGH' | 'LOW';
}

// ─── Grafik produkcji (per-worker production schedule) ───────────────────────

export interface GrafikEntryDto {
  /** dbo.CtiZasobDok.CZS_ID — primary key used to update hours. */
  czsId: number;
  workerName: string;
  resourceId: number;
  orderId: number;
  orderNumber: string;
  /** Contractor/customer name (odbiorca on the linked RO doc); may be null/empty. */
  contractorName?: string | null;
  productCode: string;
  quantity: number;
  /** CZN_Status: 0 draft, 1/2 in progress, 3 closed. */
  orderStatus: number;
  plannedHours: number;
  plannedMinutes: number;
  timeUnit: number;
  startTime: string;
  endTime: string;
  finished: number;
}

export interface AvailabilityIntervalDto {
  from: string; // "HH:mm"
  to: string;   // "HH:mm" ("24:00" = end of day)
}

export interface GrafikWorkerDto {
  workerName: string;
  totalHours: number;
  entryCount: number;
  entries: GrafikEntryDto[];
  /** Availability windows on the viewed day; empty = unavailable all day. */
  available: AvailabilityIntervalDto[];
}

export interface GrafikResponseDto {
  from: string;
  to: string;
  workerCount: number;
  orderCount: number;
  totalHours: number;
  workers: GrafikWorkerDto[];
}

/** One search hit: an order on a specific day, with the workers assigned that day. */
export interface GrafikSearchResultDto {
  date: string; // yyyy-MM-dd — jump target
  orderId: number;
  orderNumber: string;
  contractorName?: string | null;
  productCode: string;
  orderStatus: number;
  quantity: number;
  startTime: string; // "HH:mm"
  workers: string[];
  czsIds: number[];
}

export interface GrafikOrderWorkerDto {
  workerName: string;
  minutes: number;
}
export interface GrafikOrderMaterialDto {
  twrKod: string;
  ilosc: number;
  wartoscNetto: number;
}
export interface GrafikOrderDetailDto {
  orderId: number;
  orderNumber: string;
  contractorName?: string | null;
  productCode: string;
  quantity: number;
  status: number;
  workers: GrafikOrderWorkerDto[];
  materials: GrafikOrderMaterialDto[];
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

  getJobProfitability: async (request: JobProfitabilityRequestDto): Promise<JobProfitabilityResponseDto> => {
    const response = await biServiceClient.post<JobProfitabilityResponseDto>(
      API_ENDPOINTS.BI.JOB_PROFITABILITY,
      request
    );
    return response.data;
  },

  getWorkerCashContribution: async (request: WorkerCashRequestDto): Promise<WorkerCashResponseDto> => {
    const response = await biServiceClient.post<WorkerCashResponseDto>(
      API_ENDPOINTS.BI.WORKER_CASH,
      request
    );
    return response.data;
  },

  getGrafik: async (from: string, to?: string): Promise<GrafikResponseDto> => {
    const response = await biServiceClient.get<GrafikResponseDto>(
      API_ENDPOINTS.BI.GRAFIK,
      { params: { from, to: to ?? from } }
    );
    return response.data;
  },

  /** ACTUAL (rzeczywisty) grafik — how orders were really executed. */
  getGrafikActual: async (from: string, to?: string): Promise<GrafikResponseDto> => {
    const response = await biServiceClient.get<GrafikResponseDto>(
      API_ENDPOINTS.BI.GRAFIK_ACTUAL,
      { params: { from, to: to ?? from } }
    );
    return response.data;
  },

  /** Order detail (actual view): who worked on it + materials issued. */
  getGrafikOrderDetail: async (orderId: number): Promise<GrafikOrderDetailDto> => {
    const response = await biServiceClient.get<GrafikOrderDetailDto>(
      API_ENDPOINTS.BI.GRAFIK_ORDER(orderId)
    );
    return response.data;
  },

  /** Search the grafik by contractor name or order number. */
  searchGrafik: async (q: string): Promise<GrafikSearchResultDto[]> => {
    const response = await biServiceClient.get<GrafikSearchResultDto[]>(
      API_ENDPOINTS.BI.GRAFIK_SEARCH,
      { params: { q } }
    );
    return response.data;
  },

  getGrafikDay: async (date: string): Promise<GrafikResponseDto> => {
    const response = await biServiceClient.get<GrafikResponseDto>(
      API_ENDPOINTS.BI.GRAFIK,
      { params: { date } }
    );
    return response.data;
  },

  /** Move/resize an assignment. start/end are ISO local datetimes ('yyyy-MM-ddTHH:mm:ss'). */
  updateGrafikAssignment: async (
    czsId: number,
    startTime: string,
    endTime: string
  ): Promise<GrafikEntryDto> => {
    const response = await biServiceClient.put<GrafikEntryDto>(
      API_ENDPOINTS.BI.GRAFIK_ITEM(czsId),
      { startTime, endTime }
    );
    return response.data;
  },
};

export default biServiceClient;