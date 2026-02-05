import React from 'react';
import { HiX } from 'react-icons/hi';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> & {
  Header: React.FC<ModalHeaderProps>;
  Body: React.FC<ModalBodyProps>;
  Footer: React.FC<ModalFooterProps>;
} = ({ show, onClose, children, className = '', size = 'md' }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`relative w-full ${sizeClasses[size]} mx-4 max-h-full`}>
        <div className={`relative bg-section-grey rounded-lg shadow ${className}`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-black hover:bg-gray-700  rounded-lg p-1.5 ml-auto inline-flex items-center"
          >
            <HiX className="w-5 h-5" />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex items-start justify-between p-4 border-b border-lighter-border rounded-t ${className}`}>
      <h3 className="text-xl font-semibold text-black">
        {children}
      </h3>
    </div>
  );
};

const ModalBody: React.FC<ModalBodyProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {children}
    </div>
  );
};

const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center p-6 space-x-2 border-t border-lighter-border rounded-b ${className}`}>
      {children}
    </div>
  );
};

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;