import React from 'react';
import { useQuote } from '../context/QuoteContext';

const QuoteSummary: React.FC = () => {
  const { getSummary } = useQuote();
  const summary = getSummary();

  const formatPrice = (value: number): string => {
    return value.toFixed(2).replace('.', ',');
  };

  return (
    <div className="bg-background-dark rounded-lg ">

      <div className="grid border-t border-white-600 pt-6 grid-cols-1 md:grid-cols-2 gap-6">

        <div className="space-y-4 ">
          <h4 className="text-lg font-medium text-white border-b border-gray-600 pb-2 text-center">
            Surowce
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Suma cen zakupu surowców:</span>
              <span className="text-white font-medium">{formatPrice(summary.totalMaterialPurchase)} PLN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Suma marży na surowcach:</span>
              <span className="text-white font-medium">{formatPrice(summary.totalMaterialMargin)} PLN</span>
            </div>
            <div className="flex justify-between border-t border-gray-600 pt-2">
              <span className="text-white font-medium">Suma wartości surowców:</span>
              <span className="text-white font-bold">{formatPrice(summary.totalMaterialValue)} PLN</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white border-b border-gray-600 pb-2 text-center">
            Produkcja
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Koszt produkcji:</span>
              <span className="text-white font-medium">{formatPrice(summary.productionCost)} PLN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Marża produkcji:</span>
              <span className="text-white font-medium">{formatPrice(summary.productionMargin)} PLN</span>
            </div>
            <div className="flex justify-between border-t border-gray-600 pt-2">
              <span className="text-white font-medium">Wartość produkcji (suma):</span>
              <span className="text-white font-bold">{formatPrice(summary.totalProductionValue)} PLN</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 max-w-sm">
        <div className="bg-[rgb(223,255,169)] rounded-lg p-4">
          <div className="space-y-2">
            <div className="text-black font-medium">
              Ilość: {summary.quantity}
            </div>
            <div className="text-black font-medium">
              Cena za sztukę: {formatPrice((summary.totalMaterialValue + summary.totalProductionValue) / Math.max(summary.quantity, 1))} PLN
            </div>
            <div className="text-black font-medium border-t border-black pt-2">
              Suma: {formatPrice(summary.totalMaterialValue + summary.totalProductionValue)} PLN
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteSummary;