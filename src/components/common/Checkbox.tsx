import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  className = '',
  ...props
}) => {
  const baseClasses = 'w-4 h-4 text-dark-green bg-gray-100 border-gray-300 rounded focus:ring-dark-green focus:ring-2';
  
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        className={`${baseClasses} ${className}`}
        {...props}
      />
      {label && (
        <label className="ml-2 text-sm font-medium text-white">
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;