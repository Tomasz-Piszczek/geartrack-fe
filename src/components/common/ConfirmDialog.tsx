import React from 'react';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Potwierdź',
  cancelText = 'Anuluj',
  onConfirm,
  onCancel,
  variant = 'warning'
}) => {
  if (!isOpen) return null;

  const getVariantColors = () => {
    switch (variant) {
      case 'danger':
        return {
          header: 'bg-red-600',
          button: 'failure'
        };
      case 'warning':
        return {
          header: 'bg-yellow-600',
          button: 'warning'
        };
      case 'info':
        return {
          header: 'bg-blue-600',
          button: 'primary'
        };
      default:
        return {
          header: 'bg-yellow-600',
          button: 'warning'
        };
    }
  };

  const colors = getVariantColors();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-light rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className={`${colors.header} text-white px-6 py-4 rounded-t-lg`}>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-white">{message}</p>
        </div>
        
        <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-700">
          <Button
            onClick={onCancel}
            color="gray"
            size="sm"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            color={colors.button as any}
            size="sm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;