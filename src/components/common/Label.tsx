import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

const Label: React.FC<LabelProps> = ({ children, className = '', ...props }) => {
  const baseClasses = 'block text-sm font-medium text-white mb-1';
  
  return (
    <label className={`${baseClasses} ${className}`} {...props}>
      {children}
    </label>
  );
};

export default Label;