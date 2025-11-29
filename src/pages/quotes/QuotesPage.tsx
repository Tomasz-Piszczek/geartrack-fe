import React from 'react';
import QuoteForm from './components/QuoteForm';

const QuotesPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Wyceny</h1>
      </div>
      <QuoteForm />
    </div>
  );
};

export default QuotesPage;