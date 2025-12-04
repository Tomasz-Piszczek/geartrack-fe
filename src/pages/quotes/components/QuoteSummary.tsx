import React, { useState } from 'react';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { useQuote } from '../context/QuoteContext';
import { formatPrice } from '../../../utils/formatting';

const formatPriceRounded = (price: number): string => {
  return price.toFixed(2);
};

const QuoteSummary: React.FC = () => {
  const { getSummary } = useQuote();
  const summary = getSummary();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-background-dark rounded-lg">
      <div className="mb-6 border border-gray-600 rounded-lg bg-section-grey-dark overflow-hidden transition-all duration-500">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 text-xl font-bold text-white p-3 hover:text-gray-300 transition-colors hover:bg-gray-700/30"
        >
          <span>Koszt ilości minimalnej</span>
          {isCollapsed ? (
            <HiChevronDown className="w-6 h-6" />
          ) : (
            <HiChevronUp className="w-6 h-6" />
          )}
        </button>
        
        <div className={`transition-all duration-500 ${isCollapsed ? 'max-h-0' : 'max-h-[1000px]'}`}>
          <div className="border-t border-gray-600 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white border-b border-gray-600 pb-2 text-center">
                  Koszt Surowców
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Zakup surowców:</span>
                    <span className="text-white font-medium">{formatPrice(summary.materials.reduce((sum, m) => sum + m.totalForMinQty - (m.margin * m.quantity * (m.ignoreMinQuantity ? 1 : summary.minQuantity)), 0))} PLN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Marża surowców:</span>
                    <span className="text-white font-medium">{formatPrice(summary.materials.reduce((sum, m) => sum + (m.margin * m.quantity * (m.ignoreMinQuantity ? 1 : summary.minQuantity)), 0))} PLN</span>
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
                  {summary.productionActivities.map((activity) => (
                    <div key={activity.id} className="border border-gray-600 rounded p-3 bg-section-grey-light">
                      <div className="mb-2">
                        <span className="text-white font-medium">{activity.name}</span>
                        {activity.ignoreMinQuantity && (
                          <span className="text-yellow-400 text-xs ml-2">ilość min. wyłączona</span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Koszt:</span>
                          <span className="text-white">{formatPrice(activity.cost)} PLN</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Marża:</span>
                          <span className="text-white">{formatPrice(activity.margin)} PLN</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-600 pt-1">
                          <span className="text-gray-300">Suma za min. ilość:</span>
                          <span className="text-white font-medium">{formatPrice(activity.totalForMinQty)} PLN</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-gray-600 pt-2 font-medium">
                    <span className="text-white">Suma produkcji:</span>
                    <span className="text-white font-bold">{formatPrice(summary.totalProductionValueForMinQty)} PLN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 max-w-md">
        <div className="bg-[rgb(223,255,169)] rounded-lg p-4">
          <div className="space-y-2">
            <div className="text-black font-medium">
              Cena za sztukę: {formatPriceRounded(summary.pricePerUnit)} PLN
            </div>
            <div className="text-black font-medium">
              Cena ilość minimalna ({summary.minQuantity} szt.): {formatPriceRounded(summary.priceForMinQty)} PLN
            </div>
            <div className="text-black font-medium border-t border-black pt-2">
              Cena całkowita ({summary.totalQuantity} szt.): {formatPriceRounded(summary.priceForTotalQty)} PLN
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteSummary;