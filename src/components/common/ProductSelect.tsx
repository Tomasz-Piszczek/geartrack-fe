import React, { useMemo } from 'react';
import Autocomplete, { type AutocompleteOption } from './Autocomplete';
import { useProducts, formatPrice, formatDate, shouldShowPrice, shouldShowDate, findProductByCode, findProductByName } from '../../hooks/useBiService';
import type { ProductDto } from '../../api/bi-service';

interface ProductSelectProps {
  value: string;
  onCodeChange: (code: string) => void;
  onNameChange: (name: string) => void;
  onProductSelect?: (product: ProductDto | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  searchBy?: 'code' | 'name';
  showPrice?: boolean;
  loading?: boolean;
  filterQuantity?: boolean;
}

const ProductSelect: React.FC<ProductSelectProps> = ({
  value,
  onCodeChange,
  onNameChange,
  onProductSelect,
  label,
  placeholder = 'Search products...',
  error,
  className = '',
  disabled = false,
  searchBy = 'name',
  showPrice = true,
  loading: externalLoading = false,
  filterQuantity = true,
}) => {
  void placeholder;
  const { data: products = [], isLoading, error: apiError } = useProducts(filterQuantity);
  const loading = isLoading || externalLoading;

  const options: AutocompleteOption<ProductDto>[] = useMemo(() => {
    return products.map(product => {
      let label = searchBy === 'code' ? product.code : product.name;
      
      if (showPrice) {
        const parts = [];
        
        if (shouldShowPrice(product.price)) {
          parts.push(`Cena ${formatPrice(product.price)} PLN`);
        }
        
        if (shouldShowDate(product.purchaseDate)) {
          parts.push(`Data zakupu ${formatDate(product.purchaseDate)}`);
        }
        
        parts.push(`Kod ${product.code}`);
        
        if (parts.length > 0) {
          label += ` - ${parts.join(' - ')}`;
        }
      }
      
      return {
        value: searchBy === 'code' ? product.code : product.name,
        label,
        data: product,
      };
    });
  }, [products, searchBy, showPrice]);

  const displayValue = useMemo(() => {
    if (searchBy === 'name') {
      const product = findProductByName(products, value);
      if (product) {
        return product.name;
      }
      return value;
    } else {
      const product = findProductByCode(products, value);
      if (product) {
        return product.code;
      }
      return value;
    }
  }, [value, products, searchBy]);

  const handleChange = (selectedValue: string, option?: AutocompleteOption<ProductDto>) => {
    if (option?.data) {
      onCodeChange(option.data.code);
      onNameChange(option.data.name);
      onProductSelect?.(option.data);
    } else {
      const product = searchBy === 'code'
        ? findProductByCode(products, selectedValue)
        : findProductByName(products, selectedValue);
      
      if (product) {
        onCodeChange(product.code);
        onNameChange(product.name);
        onProductSelect?.(product);
      } else {
        if (searchBy === 'code') {
          onCodeChange(selectedValue);
        } else {
          onNameChange(selectedValue);
        }
        onProductSelect?.(null);
      }
    }
  };

  return (
    <Autocomplete
      options={options}
      value={displayValue}
      onChange={handleChange}
      label={label}
      error={error || (apiError ? 'Failed to load products' : undefined)}
      className={className}
      disabled={disabled}
      allowCustom={true}
      loading={loading}
    />
  );
};

export default ProductSelect;