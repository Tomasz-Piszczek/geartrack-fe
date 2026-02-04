import apiClient from '../lib/api-client';

export interface PayrollDeductionDto {
  id?: string;
  category: string;
  note: string;
  amount: number;
  createdAt?: string;
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
}

export interface DailyHoursDto {
  date: string;
  hours: number;
}

export interface DailyUrlopDto {
  date: string;
  urlopName: string;
  hours: number;
  rate: number;
}

export interface EmployeeWorkingHoursDto {
  employeeName: string;
  year: number;
  month: number;
  hours: number;
  dailyHours: DailyHoursDto[];
  dailyUrlopy: DailyUrlopDto[];
  conflictDates: string[];
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

  getWorkingHours: async (employeeNames: string[], year: number, month: number): Promise<EmployeeWorkingHoursDto[]> => {
    const response = await apiClient.post<EmployeeWorkingHoursDto[]>(
      '/api/payroll/working-hours',
      employeeNames,
      { params: { year, month } }
    );
    return response.data;
  },
};