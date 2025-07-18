import React from 'react';

interface NavbarProps {
  children: React.ReactNode;
  fluid?: boolean;
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ children, fluid = false, className = '' }) => {
  const baseClasses = 'px-2 py-2.5 bg-transparent';
  const fluidClasses = fluid ? 'w-full' : 'container mx-auto';
  
  return (
    <nav className={`${baseClasses} ${className}`}>
      <div className={fluidClasses}>
        {children}
      </div>
    </nav>
  );
};

export default Navbar;