import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      const top = triggerRect.top - tooltipRect.height - 10;
      const left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);

      const adjustedLeft = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
      const adjustedTop = top < 10 ? triggerRect.bottom + 10 : top;

      setPosition({ top: adjustedTop, left: adjustedLeft });
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 200);
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 ${className}`}
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-[#343434] border border-white/10 rounded shadow-lg p-4 max-w-md">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};
