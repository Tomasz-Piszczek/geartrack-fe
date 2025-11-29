import apiClient from '../lib/api-client';

export interface PayrollRecordDto {
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
}

export const payrollApi = {
  getPayrollRecords: async (year: number, month: number): Promise<PayrollRecordDto[]> => {
    const response = await apiClient.get(`/api/payroll/${year}/${month}`);
    return response.data;
  },
  
  savePayrollRecords: async (records: PayrollRecordDto[], year: number, month: number): Promise<void> => {
    await apiClient.post(`/api/payroll/${year}/${month}`, records);
  },
};