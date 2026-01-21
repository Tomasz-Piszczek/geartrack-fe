import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  color?: 'primary' | 'gray' | 'failure' | 'info' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  color = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const colorClasses = {
    primary: 'bg-[#dfffa9] text-black hover:bg-[#dfffa9]/90 focus:ring-[#dfffa9]/50',
    gray: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    failure: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    info: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    success: 'bg-green-600 text-black hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-black hover:bg-yellow-700 focus:ring-yellow-500',
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  const classes = `${baseClasses} ${sizeClasses[size]} ${colorClasses[color]} ${disabledClasses} ${className}`;
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="spinner w-4 h-4 mr-2"></div>
      )}
      {children}
    </button>
  );
};

export default Button;