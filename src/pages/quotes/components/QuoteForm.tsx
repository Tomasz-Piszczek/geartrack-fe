import React from 'react';
import { QuoteProvider } from '../context/QuoteContext';
import QuoteHeader from './QuoteHeader';
import QuoteTabs from './QuoteTabs';
import QuoteSummary from './QuoteSummary';

const QuoteForm: React.FC = () => {
  return (
    <QuoteProvider>
      <div className="bg-background-light rounded-lg p-6 space-y-6">
        <QuoteHeader />
        <QuoteTabs />
        <QuoteSummary />
      </div>
    </QuoteProvider>
  );
};

export default QuoteForm;