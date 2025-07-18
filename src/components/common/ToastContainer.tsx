import React, { useEffect, useState } from 'react';
import { toastManager } from '../../lib/toast';
import { HiX, HiCheckCircle, HiXCircle, HiExclamationCircle, HiInformationCircle } from 'react-icons/hi';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const getToastIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <HiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <HiXCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <HiExclamationCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <HiInformationCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <HiInformationCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getToastClassName = (type: Toast['type']) => {
    const baseClasses = 'flex items-center gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300';
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-500/10 border-green-500/20 text-green-100`;
      case 'error':
        return `${baseClasses} bg-red-500/10 border-red-500/20 text-red-100`;
      case 'warning':
        return `${baseClasses} bg-yellow-500/10 border-yellow-500/20 text-yellow-100`;
      case 'info':
        return `${baseClasses} bg-blue-500/10 border-blue-500/20 text-blue-100`;
      default:
        return `${baseClasses} bg-gray-500/10 border-gray-500/20 text-gray-100`;
    }
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={getToastClassName(toast.type)}
          style={{
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {getToastIcon(toast.type)}
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => toastManager.remove(toast.id)}
            className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <HiX className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;