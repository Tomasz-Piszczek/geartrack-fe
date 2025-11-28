// Auth types
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  token: string;
  email: string;
  userId: string;
}

// Employee types
export interface EmployeeDto {
  uuid?: string;
  firstName: string;
  lastName: string;
  hourlyRate: number;
}

// Machine types
export interface MachineDto {
  uuid?: string;
  name: string;
  factoryNumber: string;
  employeeId?: string;
  employeeName?: string;
  nextInspectionDate?: string;
  lastInspectionDate?: string;
  totalInspections?: number;
}

export interface AssignMachineDto {
  machineId: string;
  employeeId: string;
}

export interface MachineInspectionDto {
  uuid?: string;
  machineId: string;
  machineName?: string;
  machineFactoryNumber?: string;
  inspectionDate: string;
  notes?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMachineInspectionDto {
  machineId: string;
  inspectionDate: string;
  notes?: string;
  status?: string;
}

// Tool condition enum
export const ToolCondition = {
  NEW: 'NEW',
  GOOD: 'GOOD', 
  POOR: 'POOR',
} as const;

export type ToolCondition = typeof ToolCondition[keyof typeof ToolCondition];

// Tool types
export interface ToolDto {
  uuid?: string;
  name: string;
  factoryNumber?: string;
  quantity: number;
  value: number;
  availableQuantity?: number;
}

export interface AssignToolDto {
  uuid?: string;
  employeeId: string;
  toolId: string;
  quantity: number;
  condition: ToolCondition;
  assignedAt?: string;
  employeeName?: string;
  toolName?: string;
  toolPrice?: number;
  toolFactoryNumber?: string;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  errorCode?: string;
}

// UI state types
export interface User {
  userId: string;
  email: string;
  token: string;
}

export interface AuthContextType {
  user: User | null;
  login: (token: string, email: string, userId: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Form types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface PaginationData {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

// Table types
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// Modal types
export interface ModalProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

// Card types
export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

// Navigation types
export interface NavigationItem {
  label: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
}

// Pagination types
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
}