import React, { useState } from 'react';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { useQuote } from '../context/QuoteContext';

const QuoteSummary: React.FC = () => {
  const { getSummary } = useQuote();
  const summary = getSummary();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatPrice = (value: number): string => {
    return value.toFixed(2).replace('.', ',');
  };

  return (
    <div className="bg-background-dark rounded-lg">
      <div className="mb-6">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 text-xl font-bold text-white mb-4 hover:text-gray-300 transition-colors border border-gray-600 rounded-lg p-3 hover:border-gray-500"
        >
          <span>Koszt ilości minimalnej</span>
          {isCollapsed ? (
            <HiChevronDown className="w-6 h-6" />
          ) : (
            <HiChevronUp className="w-6 h-6" />
          )}
        </button>
        
        {!isCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-white border-b border-gray-600 pb-2 text-center">
                Koszt Surowców
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Koszt surowców:</span>
                  <span className="text-white font-medium">{formatPrice(summary.totalMaterialValueForMinQty)} PLN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Marża surowców:</span>
                  <span className="text-white font-medium">{formatPrice(summary.totalMaterialMargin * summary.minQuantity)} PLN</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-2">
                  <span className="text-white font-medium">Suma surowców:</span>
                  <span className="text-white font-bold">{formatPrice(summary.totalMaterialValueForMinQty)} PLN</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-white border-b border-gray-600 pb-2 text-center">
                Koszt Produkcji
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Koszt produkcji:</span>
                  <span className="text-white font-medium">{formatPrice(summary.productionCost * summary.minQuantity)} PLN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Marża produkcji:</span>
                  <span className="text-white font-medium">{formatPrice(summary.productionMargin * summary.minQuantity)} PLN</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-2">
                  <span className="text-white font-medium">Suma produkcji:</span>
                  <span className="text-white font-bold">{formatPrice(summary.totalProductionValueForMinQty)} PLN</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-white border-b border-gray-600 pb-2 text-center">
                Koszt Pakowania
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Koszt pakowania:</span>
                  <span className="text-white font-medium">{formatPrice(summary.packagingCost * summary.minQuantity)} PLN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Marża pakowania:</span>
                  <span className="text-white font-medium">{formatPrice(summary.packagingMargin * summary.minQuantity)} PLN</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-2">
                  <span className="text-white font-medium">Suma pakowania:</span>
                  <span className="text-white font-bold">{formatPrice(summary.totalPackagingValueForMinQty)} PLN</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-white border-b border-gray-600 pb-2 text-center">
                Koszt Wycinania
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Koszt wycinania:</span>
                  <span className="text-white font-medium">{formatPrice(summary.cuttingCost)} PLN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Marża wycinania:</span>
                  <span className="text-white font-medium">{formatPrice(summary.cuttingMargin)} PLN</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-2">
                  <span className="text-white font-medium">Suma wycinania:</span>
                  <span className="text-white font-bold">{formatPrice(summary.totalCuttingValue)} PLN</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 max-w-md">
        <div className="bg-[rgb(223,255,169)] rounded-lg p-4">
          <div className="space-y-2">
            <div className="text-black font-medium">
              Cena za sztukę: {formatPrice(summary.pricePerUnit)} PLN
            </div>
            <div className="text-black font-medium">
              Cena ilość minimalna: {formatPrice(summary.priceForMinQty)} PLN
            </div>
            <div className="text-black font-medium border-t border-black pt-2">
              Cena całkowita: {formatPrice(summary.priceForTotalQty)} PLN
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteSummary;