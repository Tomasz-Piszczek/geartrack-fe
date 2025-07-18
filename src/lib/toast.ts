interface ToastOptions {
  duration?: number;
  type?: 'success' | 'error' | 'warning' | 'info';
}

class ToastManager {
  private toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;
  }> = [];

  private listeners: Array<(toasts: typeof this.toasts) => void> = [];

  show(message: string, options: ToastOptions = {}) {
    const toast = {
      id: Date.now().toString(),
      message,
      type: options.type || 'info',
      duration: options.duration || 4000,
    };

    this.toasts.push(toast);
    this.notifyListeners();

    // Auto remove toast after duration
    setTimeout(() => {
      this.remove(toast.id);
    }, toast.duration);
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }

  subscribe(listener: (toasts: typeof this.toasts) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }
}

export const toastManager = new ToastManager();

export const toast = {
  success: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    toastManager.show(message, { ...options, type: 'success' }),
  error: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    toastManager.show(message, { ...options, type: 'error' }),
  warning: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    toastManager.show(message, { ...options, type: 'warning' }),
  info: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    toastManager.show(message, { ...options, type: 'info' }),
};