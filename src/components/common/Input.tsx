import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'input-style';
  const errorClasses = error ? 'ring-2 ring-red-500' : '';
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          className={`${baseClasses} ${errorClasses} ${Icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-red-light text-sm mt-1">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;