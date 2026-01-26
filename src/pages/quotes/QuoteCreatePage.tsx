import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { quotesApi } from '../../api/quotes';
import type { CreateQuoteDto } from '../../api/quotes';
import { QuoteProvider } from './context/QuoteContext';
import QuoteFormWithActions from './components/QuoteFormWithActions';
import Button from '../../components/common/Button';
import { toast } from '../../lib/toast';

const QuoteCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: nextQuoteNumber } = useQuery({
    queryKey: ['nextQuoteNumber'],
    queryFn: quotesApi.getNextQuoteNumber,
  });

  const handleSubmit = async (data: CreateQuoteDto) => {
    setIsSubmitting(true);
    try {
      await quotesApi.createQuote(data);
      toast.success('Wycena została utworzona pomyślnie');
      navigate('/quotes');
    } catch {
      toast.error('Wystąpił błąd podczas tworzenia wyceny');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/quotes');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Nowa wycena</h1>
        <div className="flex gap-4">
          <Button
            color="gray"
            onClick={handleCancel}
          >
            Anuluj
          </Button>
        </div>
      </div>

      <QuoteProvider
        initialDocumentNumber={nextQuoteNumber?.nextQuoteNumber}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isEditMode={false}
      >
        <QuoteFormWithActions onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </QuoteProvider>
    </div>
  );
};

export default QuoteCreatePage;