import React from 'react';
import { useQuote } from '../context/QuoteContext';
import ProductionTab from './tabs/ProductionTab';
import CuttingTab from './tabs/CuttingTab';
import PackagingTab from './tabs/PackagingTab';
import MaterialsTab from './tabs/MaterialsTab';

const QuoteTabs: React.FC = () => {
  const { state, dispatch } = useQuote();

  const tabs = [
    { id: 'production', label: 'Produkcja' },
    { id: 'cutting', label: 'Wycinanie' },
    { id: 'packaging', label: 'Pakowanie' },
    { id: 'materials', label: 'Surowce' },
  ] as const;

  const renderTabContent = () => {
    switch (state.activeTab) {
      case 'production':
        return <ProductionTab />;
      case 'cutting':
        return <CuttingTab />;
      case 'packaging':
        return <PackagingTab />;
      case 'materials':
        return <MaterialsTab />;
    }
  };

  return (
    <div>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', tab: tab.id })}
              className={`${
                state.activeTab === tab.id
                  ? 'border-main text-main'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default QuoteTabs;