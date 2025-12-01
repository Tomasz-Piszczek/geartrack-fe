// API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const BI_SERVICE_URL = import.meta.env.VITE_BI_SERVICE_URL || 'http://localhost:8080';

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
    INSPECTIONS: '/api/machine-inspections',
    MACHINE_INSPECTIONS: (machineId: string) => `/api/machine-inspections/machine/${machineId}`,
    MACHINE_INSPECTION_HISTORY: (machineId: string) => `/api/machine-inspections/machine/${machineId}/history`,
  },
  TOOLS: {
    BASE: '/api/tools',
    BY_ID: (id: string) => `/api/tools/${id}`,
    ASSIGN: '/api/tools/assign',
    UNASSIGN: '/api/tools/unassign',
    EMPLOYEES: (toolId: string) => `/api/tools/${toolId}/employees`,
  },
  BI: {
    CONTRACTORS: '/api/contractors',
    PRODUCTS: '/api/products',
  },
} as const;

// Query keys for React Query
export const QUERY_KEYS = {
  EMPLOYEES: 'employees',
  MACHINES: 'machines',
  TOOLS: 'tools',
  USER: 'user',
  PAYROLL: 'payroll',
  CONTRACTORS: 'contractors',
  PRODUCTS: 'products',
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
  PAYROLL: '/payroll',
  QUOTES: '/quotes',
  SETTINGS: '/settings',
} as const;

// Form validation constants
export const VALIDATION = {
  EMAIL: {
    REQUIRED: 'Email jest wymagany',
    INVALID: 'Wprowadź prawidłowy adres email',
  },
  PASSWORD: {
    REQUIRED: 'Hasło jest wymagane',
    MIN_LENGTH: 'Hasło musi mieć co najmniej 6 znaków',
  },
  REQUIRED: 'To pole jest wymagane',
  POSITIVE_NUMBER: 'Musi być liczbą dodatnią',
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
  'NOWY',
  'DOBRY',
  'SŁABY',
] as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Błąd sieci. Sprawdź połączenie i spróbuj ponownie.',
  UNAUTHORIZED: 'Nie masz uprawnień do wykonania tej akcji.',
  FORBIDDEN: 'Dostęp zabroniony.',
  NOT_FOUND: 'Zasób nie został znaleziony.',
  VALIDATION_ERROR: 'Sprawdź dane wejściowe i spróbuj ponownie.',
  GENERIC_ERROR: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Element został pomyślnie utworzony',
  UPDATED: 'Element został pomyślnie zaktualizowany',
  DELETED: 'Element został pomyślnie usunięty',
  ASSIGNED: 'Przypisanie zostało pomyślnie zakończone',
  UNASSIGNED: 'Cofnięcie przypisania zostało pomyślnie zakończone',
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