import React from 'react';
import { useQuote, type QuoteState } from '../context/QuoteContext';
import Input from '../../../components/common/Input';
import NumberInput from '../../../components/common/NumberInput';
import Label from '../../../components/common/Label';
import ContractorSelect from '../../../components/common/ContractorSelect';
import ProductSelect from '../../../components/common/ProductSelect';

const QuoteHeader: React.FC = () => {
  const { state, dispatch } = useQuote();

  const handleFieldChange = (field: keyof QuoteState, value: string | number) => {
    dispatch({ type: 'SET_FIELD', field, value });
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
            <ContractorSelect
              value={state.contractorCode}
              onCodeChange={(code) => handleFieldChange('contractorCode', code)}
              onNameChange={(name) => handleFieldChange('contractorName', name)}
              searchBy="code"
            />
          </div>
          <div>
            <Label htmlFor="productCode">Kod Produktu</Label>
            <ProductSelect
              value={state.productCode}
              onCodeChange={(code) => handleFieldChange('productCode', code)}
              onNameChange={(name) => handleFieldChange('productName', name)}
              searchBy="code"
              showPrice={false}
              filterQuantity={false}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="contractorName">Nazwa Kontrahenta</Label>
            <ContractorSelect
              value={state.contractorName}
              onCodeChange={(code) => handleFieldChange('contractorCode', code)}
              onNameChange={(name) => handleFieldChange('contractorName', name)}
              searchBy="name"
            />
          </div>
          <div>
            <Label htmlFor="productName">Nazwa Produktu</Label>
            <ProductSelect
              value={state.productName}
              onCodeChange={(code) => handleFieldChange('productCode', code)}
              onNameChange={(name) => handleFieldChange('productName', name)}
              searchBy="name"
              showPrice={false}
              filterQuantity={false}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="minQuantity">Ilość minimalna</Label>
          <NumberInput
            value={state.minQuantity}
            onChange={(value) => handleFieldChange('minQuantity', Math.max(0, Math.round(value)))}
            min={0}
            className="max-w-xs"
          />
        </div>
        <div>
          <Label htmlFor="totalQuantity">Ilość całkowita</Label>
          <NumberInput
            value={state.totalQuantity}
            onChange={(value) => handleFieldChange('totalQuantity', Math.max(0, Math.round(value)))}
            min={0}
            className="max-w-xs"
          />
        </div>
      </div>
    </div>
  );
};

export default QuoteHeader;