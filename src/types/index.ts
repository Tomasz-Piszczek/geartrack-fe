export interface LoginDto {
  email: string;
  password: string;
}


export interface AuthResponseDto {
  token: string;
  refreshToken: string;
  email: string;
  userId: string;
}

export interface EmployeeDto {
  uuid?: string;
  firstName: string;
  lastName: string;
  hourlyRate: number;
}

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

export const ToolCondition = {
  NEW: 'NOWY',
  GOOD: 'DOBRY', 
  POOR: 'SŁABY',
} as const;

export type ToolCondition = typeof ToolCondition[keyof typeof ToolCondition];

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

export interface User {
  userId: string;
  email: string;
  token: string;
  role: 'ADMIN' | 'USER' | 'SUPER_USER';
  organization?: {
    id: string;
    organizationName: string;
  };
}

export interface AuthContextType {
  user: User | null;
  login: (token: string, refreshToken: string, email: string, userId: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: 'ADMIN' | 'USER' | 'SUPER_USER') => boolean;
  isAdmin: () => boolean;
  isUserOrSuperUser: () => boolean;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

export interface PaginationData {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

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

export interface ModalProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export interface NavigationItem {
  label: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
}

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

export interface OrganizationDto {
  id: string;
  organizationName: string;
  createdAt: string;
  updatedAt: string;
  users?: UserDto[];
}

export interface UserDto {
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'SUPER_USER';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    organizationName: string;
  };
}

export interface CreateOrganizationRequest {
  organizationName: string;
}

export interface AssignUserRequest {
  userEmail: string;
  organizationId: string;
  role?: 'ADMIN' | 'USER' | 'SUPER_USER';
}