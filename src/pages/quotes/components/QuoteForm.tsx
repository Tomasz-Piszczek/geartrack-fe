import React from 'react';
import QuoteHeader from './QuoteHeader';
import QuoteTabs from './QuoteTabs';
import QuoteSummary from './QuoteSummary';

const QuoteForm: React.FC = () => {
  return (
    <div className="bg-background-light rounded-lg p-6 space-y-6">
      <QuoteHeader />
      <QuoteTabs />
      <QuoteSummary />
    </div>
  );
};

export default QuoteForm;