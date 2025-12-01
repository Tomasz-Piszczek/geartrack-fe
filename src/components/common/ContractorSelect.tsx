import React, { useMemo } from 'react';
import Autocomplete, { type AutocompleteOption } from './Autocomplete';
import { useContractors, findContractorByCode, findContractorByName } from '../../hooks/useBiService';

interface ContractorSelectProps {
  value: string;
  onCodeChange: (code: string) => void;
  onNameChange: (name: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  searchBy?: 'code' | 'name';
}

const ContractorSelect: React.FC<ContractorSelectProps> = ({
  value,
  onCodeChange,
  onNameChange,
  label,
  placeholder = 'Search contractors...',
  error,
  className = '',
  disabled = false,
  searchBy = 'name',
}) => {
  void placeholder;
  const { data: contractors = [], isLoading, error: apiError } = useContractors();

  const options: AutocompleteOption[] = useMemo(() => {
    return contractors.map(contractor => ({
      value: searchBy === 'code' ? contractor.code : contractor.name,
      label: searchBy === 'code' ? contractor.code : contractor.name,
      data: contractor,
    }));
  }, [contractors, searchBy]);

  const displayValue = value;

  const handleChange = (selectedValue: string, option?: AutocompleteOption) => {
    if (option?.data) {
      onCodeChange(option.data.code);
      onNameChange(option.data.name);
    } else {
      const contractor = searchBy === 'code'
        ? findContractorByCode(contractors, selectedValue)
        : findContractorByName(contractors, selectedValue);
      
      if (contractor) {
        onCodeChange(contractor.code);
        onNameChange(contractor.name);
      } else {
        // For custom values, only update the field being typed in
        if (searchBy === 'code') {
          onCodeChange(selectedValue);
          // Don't clear the name field - preserve existing custom name
        } else {
          onNameChange(selectedValue);
          // Don't clear the code field - preserve existing custom code
        }
      }
    }
  };

  return (
    <Autocomplete
      options={options}
      value={displayValue}
      onChange={handleChange}
      label={label}
      error={error || (apiError ? 'Failed to load contractors' : undefined)}
      className={className}
      disabled={disabled}
      allowCustom={true}
      loading={isLoading}
    />
  );
};

export default ContractorSelect;