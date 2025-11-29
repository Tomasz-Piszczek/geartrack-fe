import React from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

interface PaginationProps {
  currentPage: number;
  totalElements: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  adjustablePage?: boolean;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalElements,
  perPage,
  onPageChange,
  onPerPageChange,
  adjustablePage = true,
  className = '',
}) => {
  const totalPages = Math.ceil(totalElements / perPage);
  const perPageOptions = [10, 20, 50, 100];

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
    }

    return rangeWithDots;
  };

  const renderPageButton = (page: number | string, index: number) => {
    if (page === '...') {
      return (
        <span key={index} className="px-3 py-2 text-surface-grey-dark">
          {page}
        </span>
      );
    }

    const pageNumber = page as number;
    const isActive = pageNumber === currentPage;

    return (
      <button
        key={index}
        onClick={() => onPageChange(pageNumber)}
        className={`px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-dark-green text-white'
            : 'text-surface-grey hover:bg-section-grey-light hover:text-white'
        }`}
      >
        {pageNumber}
      </button>
    );
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-surface-grey hover:bg-section-grey-light hover:text-white"
        >
          <HiChevronLeft className="w-5 h-5" />
        </button>

        {getVisiblePages().map((page, index) => renderPageButton(page, index))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-surface-grey hover:bg-section-grey-light hover:text-white"
        >
          <HiChevronRight className="w-5 h-5" />
        </button>
      </div>

      {adjustablePage && onPerPageChange && (
        <div className="flex items-center space-x-2">
          <label className="text-sm text-surface-grey">Wierszy na stronę:</label>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="px-3 py-1 bg-section-grey-light border border-lighter-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-dark-green"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="text-sm text-surface-grey text-center">
        Wyświetlane{' '}
        <span className="text-white font-medium">
          {Math.max((currentPage - 1) * perPage + 1, 1)}
        </span>{' '}
        do{' '}
        <span className="text-white font-medium">
          {Math.min(currentPage * perPage, totalElements)}
        </span>{' '}
        z{' '}
        <span className="text-white font-medium">{totalElements}</span> wyników
      </div>
    </div>
  );
};

export default Pagination;