import React from 'react';
import { useQuote } from '../../context/QuoteContext';
import Input from '../../../../components/common/Input';
import Label from '../../../../components/common/Label';

const ProductionTab: React.FC = () => {
  const { state, dispatch } = useQuote();
  const data = state.production;

  const handleFieldChange = (field: string, value: number) => {
    dispatch({ type: 'SET_TAB_FIELD', tab: 'production', field: field as any, value });
  };

  const handleMarginPercentChange = (value: number) => {
    dispatch({ type: 'SET_TAB_FIELD', tab: 'production', field: 'marginPercent', value });
  };

  const handleMarginPlnChange = (value: number) => {
    const marginPercent = data.price > 0 ? (value / data.price) * 100 : 0;
    dispatch({ type: 'SET_TAB_FIELD', tab: 'production', field: 'marginPln', value });
    dispatch({ type: 'SET_TAB_FIELD', tab: 'production', field: 'marginPercent', value: marginPercent });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="workTime">Czas pracy (h):(mm)</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              min="0"
              value={data.workTimeHours || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                handleFieldChange('workTimeHours', isNaN(value) ? 0 : Math.max(0, value));
              }}
              placeholder="Godziny"
            />
            <span className="text-white">:</span>
            <Input
              type="number"
              min="0"
              max="59"
              value={data.workTimeMinutes || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                handleFieldChange('workTimeMinutes', isNaN(value) ? 0 : Math.max(0, Math.min(59, value)));
              }}
              placeholder="Minuty"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="price">Koszt</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={data.price || ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              handleFieldChange('price', isNaN(value) ? 0 : Math.max(0, parseFloat(value.toFixed(2))));
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="marginPercent">Marża %</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={data.marginPercent || ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              handleMarginPercentChange(isNaN(value) ? 0 : Math.max(0, parseFloat(value.toFixed(2))));
            }}
          />
        </div>

        <div>
          <Label htmlFor="marginPln">Marża PLN</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={data.marginPln || ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              handleMarginPlnChange(isNaN(value) ? 0 : Math.max(0, parseFloat(value.toFixed(2))));
            }}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-lg font-medium text-white mb-4">Koszt Produkcji</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-gray-300">Koszt/h: </span>
            <span className="text-white font-medium">{data.costPerHour.toFixed(2)} PLN</span>
          </div>
          <div>
            <span className="text-gray-300">Suma: </span>
            <span className="text-white font-medium">{data.total.toFixed(2)} PLN</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionTab;