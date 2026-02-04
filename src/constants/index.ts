export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const BI_SERVICE_URL = import.meta.env.VITE_BI_SERVICE_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    OAUTH2_SUCCESS: '/api/auth/oauth2/success',
    REFRESH: '/api/auth/refresh',
  },
  EMPLOYEES: {
    BASE: '/api/employees',
    BY_ID: (id: string) => `/api/employees/${id}`,
  },
  MACHINES: {
    BASE: '/api/machines',
    BY_ID: (id: string) => `/api/machines/${id}`,
    ASSIGN: (machineId: string, employeeId: string) => `/api/machines/assign/${machineId}/${employeeId}`,
    INSPECTIONS: (machineId: string) => `/api/machine-inspections/${machineId}`,
    MACHINE_INSPECTIONS: (machineId: string) => `/api/machine-inspections/machine/${machineId}`,
    MACHINE_INSPECTION_HISTORY: (machineId: string) => `/api/machine-inspections/machine/${machineId}/history`,
  },
  TOOLS: {
    BASE: '/api/tools',
    BY_ID: (id: string) => `/api/tools/${id}`,
    ASSIGN: (toolId: string, employeeId: string) => `/api/tools/assign/${toolId}/${employeeId}`,
    UNASSIGN: (toolId: string, employeeId: string) => `/api/tools/unassign/${toolId}/${employeeId}`,
    EMPLOYEES: (toolId: string) => `/api/tools/${toolId}/employees`,
    MARK_USED: (employeeToolId: string) => `/api/tools/mark-used/${employeeToolId}`,
  },
  BI: {
    CONTRACTORS: '/api/contractors',
    PRODUCTS: '/api/products',
    EMPLOYEE_HOURS: '/api/employees/hours',
  },
  ORGANIZATIONS: {
    BASE: '/api/organizations',
    BY_ID: (id: string) => `/api/organizations/${id}`,
    ASSIGN_USER: '/api/organizations/assign-user',
    REMOVE_USER: (userEmail: string) => `/api/organizations/remove-user/${userEmail}`,
  },
  USERS: {
    BASE: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
    ME: '/api/users/me',
    UPDATE_ROLE: (id: string) => `/api/users/${id}/role`,
  },
  URLOPY: {
    BASE: '/api/urlopy',
    BY_EMPLOYEE: (employeeId: string) => `/api/urlopy/${employeeId}`,
    BY_ID: (id: string) => `/api/urlopy/${id}`,
    STREAM: '/api/urlopy/stream',
  },
  BADANIA_SZKOLENIA: {
    BASE: '/api/badania-szkolenia',
    BY_EMPLOYEE: (employeeId: string) => `/api/badania-szkolenia/${employeeId}`,
    BY_ID: (id: string) => `/api/badania-szkolenia/${id}`,
    CATEGORIES: '/api/badania-szkolenia/categories',
    STREAM: '/api/badania-szkolenia/stream',
  },
} as const;

export const QUERY_KEYS = {
  EMPLOYEES: 'employees',
  MACHINES: 'machines',
  TOOLS: 'tools',
  USER: 'user',
  PAYROLL: 'payroll',
  CONTRACTORS: 'contractors',
  PRODUCTS: 'products',
  PRODUCT_GROUPS: 'product-groups',
  ORGANIZATIONS: 'organizations',
  USERS: 'users',
  URLOPY: 'urlopy',
  BADANIA_SZKOLENIA: 'badania-szkolenia',
  VACATION_SUMMARY: 'vacation-summary',
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'geartrack_token',
  REFRESH_TOKEN: 'geartrack_refresh_token',
  USER: 'geartrack_user',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  TOOLS: '/tools',
  MACHINES: '/machines',
  EMPLOYEES: '/employees',
  EMPLOYEE_DETAIL: '/employees/:id',
  PAYROLL: '/payroll',
  QUOTES: '/quotes',
} as const;

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

export const UI = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  },
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 300,
} as const;

export const STATUS = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  IDLE: 'idle',
} as const;

export const TOOL_CONDITIONS = [
  'NOWY',
  'DOBRY',
  'SŁABY',
] as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Błąd sieci. Sprawdź połączenie i spróbuj ponownie.',
  UNAUTHORIZED: 'Nie masz uprawnień do wykonania tej akcji.',
  FORBIDDEN: 'Dostęp zabroniony.',
  NOT_FOUND: 'Zasób nie został znaleziony.',
  VALIDATION_ERROR: 'Sprawdź dane wejściowe i spróbuj ponownie.',
  GENERIC_ERROR: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
} as const;

export const SUCCESS_MESSAGES = {
  CREATED: 'Element został pomyślnie utworzony',
  UPDATED: 'Element został pomyślnie zaktualizowany',
  DELETED: 'Element został pomyślnie usunięty',
  ASSIGNED: 'Przypisanie zostało pomyślnie zakończone',
  UNASSIGNED: 'Cofnięcie przypisania zostało pomyślnie zakończone',
} as const;

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