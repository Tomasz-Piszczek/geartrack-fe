import React, { useState, useRef, useEffect } from 'react';
import { HiDotsVertical } from 'react-icons/hi';

interface DropdownAction {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  destructive?: boolean;
}

interface DropdownActionsProps {
  actions: DropdownAction[];
  className?: string;
}

const DropdownActions: React.FC<DropdownActionsProps> = ({ actions, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleActionClick = (action: DropdownAction) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-surface-grey-dark hover:text-white hover:bg-section-grey-light rounded-lg transition-colors"
        title="Actions"
      >
        <HiDotsVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-section-grey border border-lighter-border rounded-lg shadow-lg z-10">
          <div className="py-1">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-section-grey-light transition-colors ${
                  action.destructive
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-white hover:text-white'
                }`}
              >
                {action.icon && (
                  <action.icon className={`w-4 h-4 ${action.destructive ? 'text-red-400' : 'text-surface-grey-dark'}`} />
                )}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownActions;