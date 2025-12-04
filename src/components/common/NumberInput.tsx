import React, { useState, useEffect } from 'react';
import { formatPrice, parseNumberInput } from '../../utils/formatting';

interface NumberInputProps {
  value?: number;
  onChange: (value: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value = 0,
  onChange,
  placeholder,
  min = 0,
  max,
  step = 0.01,
  className = '',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState<string>(() => 
    value === 0 ? '' : formatPrice(value)
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(value === 0 ? '' : formatPrice(value));
    }
  }, [value, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (newValue === '' || newValue === '.') {
      setInputValue(newValue);
      onChange(0);
      return;
    }

    const regex = /^\d*\.?\d*$/;
    if (regex.test(newValue)) {
      setInputValue(newValue);
      const numericValue = parseNumberInput(newValue);
      
      let finalValue = numericValue;
      if (min !== undefined) {
        finalValue = Math.max(min, finalValue);
      }
      if (max !== undefined) {
        finalValue = Math.min(max, finalValue);
      }
      
      onChange(finalValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numericValue = parseNumberInput(inputValue);
    let finalValue = numericValue;
    
    if (min !== undefined) {
      finalValue = Math.max(min, finalValue);
    }
    if (max !== undefined) {
      finalValue = Math.min(max, finalValue);
    }
    
    if (finalValue !== numericValue) {
      onChange(finalValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && inputValue === '') {
      e.preventDefault();
    }
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`input-style ${className}`}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
    />
  );
};

export default NumberInput;