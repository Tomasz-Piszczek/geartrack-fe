import React from 'react';
import { useQuote } from '../context/QuoteContext';
import Input from '../../../components/common/Input';
import Label from '../../../components/common/Label';

const QuoteHeader: React.FC = () => {
  const { state, dispatch } = useQuote();

  const handleFieldChange = (field: string, value: string | number) => {
    dispatch({ type: 'SET_FIELD', field: field as any, value });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="documentNumber">Numer Dokumentu</Label>
        <Input
          id="documentNumber"
          value={state.documentNumber}
          onChange={(e) => handleFieldChange('documentNumber', e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="contractorCode">Kontrahent kod</Label>
            <Input
              id="contractorCode"
              value={state.contractorCode}
              onChange={(e) => handleFieldChange('contractorCode', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="productCode">Kod Produktu</Label>
            <Input
              id="productCode"
              value={state.productCode}
              onChange={(e) => handleFieldChange('productCode', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="contractorName">Nazwa Kontrahenta</Label>
            <Input
              id="contractorName"
              value={state.contractorName}
              onChange={(e) => handleFieldChange('contractorName', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="productName">Nazwa Produktu</Label>
            <Input
              id="productName"
              value={state.productName}
              onChange={(e) => handleFieldChange('productName', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="minQuantity">Ilość minimalna</Label>
        <Input
          id="minQuantity"
          type="number"
          min="0"
          value={state.minQuantity}
          onChange={(e) => handleFieldChange('minQuantity', Math.max(0, parseInt(e.target.value) || 0))}
          className="max-w-xs"
        />
      </div>
    </div>
  );
};

export default QuoteHeader;