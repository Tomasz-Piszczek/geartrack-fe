import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { quotesApi } from '../../api/quotes';
import type { CreateQuoteDto } from '../../api/quotes';
import { QuoteProvider, useQuote } from './context/QuoteContext';
import QuoteForm from './components/QuoteForm';
import Button from '../../components/common/Button';
import { toast } from '../../lib/toast';

const QuoteFormWithSubmit: React.FC<{ onSubmit: (data: CreateQuoteDto) => void; isSubmitting: boolean }> = ({ onSubmit, isSubmitting }) => {
  const { prepareForSubmit } = useQuote();

  const handleSubmit = () => {
    const data = prepareForSubmit() as CreateQuoteDto;
    onSubmit(data);
  };

  return (
    <>
      <QuoteForm />
      <div className="mt-6 flex justify-end">
        <Button
          color="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
        >
          Zapisz
        </Button>
      </div>
    </>
  );
};

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
        <QuoteFormWithSubmit onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </QuoteProvider>
    </div>
  );
};

export default QuoteCreatePage;