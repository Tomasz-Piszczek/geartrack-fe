// API endpoints
export const API_BASE_URL = 'http://localhost:8080';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    OAUTH2_SUCCESS: '/api/auth/oauth2/success',
  },
  EMPLOYEES: {
    BASE: '/api/employees',
    BY_ID: (id: string) => `/api/employees/${id}`,
  },
  MACHINES: {
    BASE: '/api/machines',
    BY_ID: (id: string) => `/api/machines/${id}`,
    ASSIGN: '/api/machines/assign',
  },
  TOOLS: {
    BASE: '/api/tools',
    BY_ID: (id: string) => `/api/tools/${id}`,
    ASSIGN: '/api/tools/assign',
    UNASSIGN: '/api/tools/unassign',
  },
} as const;

// Query keys for React Query
export const QUERY_KEYS = {
  EMPLOYEES: 'employees',
  MACHINES: 'machines',
  TOOLS: 'tools',
  USER: 'user',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'geartrack_token',
  USER: 'geartrack_user',
} as const;

// Navigation paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  TOOLS: '/tools',
  MACHINES: '/machines',
  EMPLOYEES: '/employees',
  EMPLOYEE_DETAIL: '/employees/:id',
  SETTINGS: '/settings',
} as const;

// Form validation constants
export const VALIDATION = {
  EMAIL: {
    REQUIRED: 'Email is required',
    INVALID: 'Please enter a valid email address',
  },
  PASSWORD: {
    REQUIRED: 'Password is required',
    MIN_LENGTH: 'Password must be at least 6 characters',
  },
  REQUIRED: 'This field is required',
  POSITIVE_NUMBER: 'Must be a positive number',
} as const;

// UI constants
export const UI = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  },
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 300,
} as const;

// Status constants
export const STATUS = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  IDLE: 'idle',
} as const;

// Tool conditions
export const TOOL_CONDITIONS = [
  'Excellent',
  'Good',
  'Fair',
  'Poor',
  'Needs Repair',
] as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Item created successfully',
  UPDATED: 'Item updated successfully',
  DELETED: 'Item deleted successfully',
  ASSIGNED: 'Assignment completed successfully',
  UNASSIGNED: 'Unassignment completed successfully',
} as const;

// Theme constants
export const THEME = {
  COLORS: {
    PRIMARY: '#7c9357',
    SECONDARY: '#DFFFA9',
    SUCCESS: '#27C300',
    ERROR: '#FF4A4A',
    WARNING: '#FF7A00',
    INFO: '#18689A',
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
  },
} as const;