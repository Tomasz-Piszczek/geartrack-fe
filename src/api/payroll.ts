import apiClient from '../lib/api-client';

export interface PayrollDeductionDto {
  id?: string;
  category: string;
  note: string;
  amount: number;
  createdAt?: string;
}

export interface DailyBreakdownDto {
  date: string;
  actualHours: number;
  roundedHours: number;
  startTime?: string;
  endTime?: string;
}

export interface UrlopBreakdownDto {
  category: string;
  totalHours: number;
  rate: number;
}

export interface PayrollRecordDto {
  payrollRecordId?: string;
  employeeId: string;
  employeeName: string;
  hourlyRate: number;
  hoursWorked: number;
  bonus: number;
  sickLeavePay: number;
  deductions: number;
  deductionsNote: string | null;
  bankTransfer: number;
  cashAmount: number;
  paid?: boolean;
  payrollDeductions?: PayrollDeductionDto[];
  dailyBreakdown?: DailyBreakdownDto[];
  urlopBreakdown?: UrlopBreakdownDto[];
  hasDiscrepancy?: boolean;
  lastSavedHours?: number;
  lastModifiedAt?: string;
  hasCalculationDiscrepancy?: boolean;
  savedCashAmount?: number;
  calculatedCashAmount?: number;
}

export interface EmployeeWorkingHoursDto {
  totalHours: number;
  dailyBreakdown: DailyBreakdownDto[];
  urlopBreakdown: UrlopBreakdownDto[];
}

export const payrollApi = {
  getPayrollRecords: async (year: number, month: number): Promise<PayrollRecordDto[]> => {
    const response = await apiClient.get(`/api/payroll/${year}/${month}`);
    return response.data;
  },

  savePayrollRecords: async (records: PayrollRecordDto[], year: number, month: number): Promise<void> => {
    await apiClient.post(`/api/payroll/${year}/${month}`, records);
  },

  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get('/api/payroll/categories');
    return response.data;
  },

  deleteCategory: async (category: string): Promise<void> => {
    await apiClient.delete(`/api/payroll/categories/${encodeURIComponent(category)}`);
  },

  getEmployeeDeductions: async (employeeId: string): Promise<PayrollDeductionDto[]> => {
    const response = await apiClient.get(`/api/payroll/employees/${employeeId}/deductions`);
    return response.data;
  },

  getEmployeeWorkingHours: async (employeeName: string, year: number, month: number): Promise<EmployeeWorkingHoursDto> => {
    const response = await apiClient.get(`/api/payroll/employee-hours/${encodeURIComponent(employeeName)}/${year}/${month}`);
    return response.data;
  },
};