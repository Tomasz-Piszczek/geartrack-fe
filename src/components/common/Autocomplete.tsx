import React, { useState, useEffect, useRef } from 'react';

export interface AutocompleteOption {
  value: string;
  label: string;
  data?: unknown;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value: string;
  onChange: (value: string, option?: AutocompleteOption) => void;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  loading?: boolean;
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  options,
  value,
  onChange,
  onInputChange,
  placeholder = '',
  label,
  error,
  className = '',
  disabled = false,
  allowCustom = false,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option => {
        const search = inputValue.toLowerCase();
        return (
          option.label.toLowerCase().includes(search) ||
          option.value.toLowerCase().includes(search) ||
          (option.data?.code && option.data.code.toLowerCase().includes(search))
        );
      });
      setFilteredOptions(filtered);
    }
    setHighlightedIndex(-1);
  }, [inputValue, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    onInputChange?.(newValue);
    
    if (allowCustom) {
      onChange(newValue);
    }
  };

  const handleOptionClick = (option: AutocompleteOption) => {
    setInputValue(option.label);
    onChange(option.value, option);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionClick(filteredOptions[highlightedIndex]);
        } else if (allowCustom && inputValue.trim()) {
          onChange(inputValue.trim());
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const baseClasses = 'input-style';
  const errorClasses = error ? 'ring-2 ring-red-500' : '';

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-white mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`${baseClasses} ${errorClasses} ${className} pr-8`}
        />
        
        {/* Dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
          ) : (
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-[rgb(33,37,41)] border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={`${option.value}-${index}`}
                className={`px-3 py-2 cursor-pointer text-white transition-colors ${
                  highlightedIndex === index
                    ? 'bg-[rgb(124,147,87)] text-white'
                    : 'hover:bg-background-light'
                }`}
                onClick={() => handleOptionClick(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400">
              {loading ? 'Loading...' : 'No results found'}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-light text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default Autocomplete;