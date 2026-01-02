import apiClient from '../lib/api-client';
import type { PaginationParams, PagedResponse } from '../types';

export interface PayrollDeductionDto {
  id?: string;
  payrollRecordId: string;
  category: string;
  note: string;
  amount: number;
}

export const payrollDeductionsApi = {
  create: async (deduction: PayrollDeductionDto): Promise<PayrollDeductionDto> => {
    const response = await apiClient.post('/api/payroll-deductions', deduction);
    return response.data;
  },

  update: async (id: string, deduction: Partial<PayrollDeductionDto>): Promise<PayrollDeductionDto> => {
    const response = await apiClient.put(`/api/payroll-deductions/${id}`, deduction);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/payroll-deductions/${id}`);
  },

  getEmployeeDeductions: async (
    employeeId: string,
    category?: string
  ): Promise<PayrollDeductionDto[]> => {
    const searchParams = new URLSearchParams();

    if (category) {
      searchParams.append('category', category);
    }

    const response = await apiClient.get(
      `/api/payroll-deductions/employee/${employeeId}${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    );
    return response.data;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get('/api/payroll-deductions/categories');
    return response.data;
  },
};