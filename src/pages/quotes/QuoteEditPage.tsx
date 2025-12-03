import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { quotesApi } from '../../api/quotes';
import type { CreateQuoteDto, UpdateQuoteDto } from '../../api/quotes';
import { QuoteProvider, useQuote } from './context/QuoteContext';
import QuoteForm from './components/QuoteForm';
import Button from '../../components/common/Button';
import { toast } from '../../lib/toast';

const QuoteFormWithSubmit: React.FC<{ onSubmit: (data: CreateQuoteDto | UpdateQuoteDto) => void; isSubmitting: boolean }> = ({ onSubmit, isSubmitting }) => {
  const { prepareForSubmit } = useQuote();

  const handleSubmit = () => {
    const data = prepareForSubmit() as UpdateQuoteDto;
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
Zapisz        </Button>
      </div>
    </>
  );
};

const QuoteEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => quotesApi.getQuote(id!),
    enabled: !!id,
  });

  const handleSubmit = async (data: CreateQuoteDto | UpdateQuoteDto) => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      await quotesApi.updateQuote(id, { ...data, uuid: id });
      toast.success('Wycena została zaktualizowana pomyślnie');
      navigate('/quotes');
    } catch (error) {
      toast.error('Wystąpił błąd podczas aktualizacji wyceny');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/quotes');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-white">Ładowanie...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-6">
        <div className="text-center text-red-400">Nie znaleziono wyceny</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Edytuj wycenę</h1>
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
        initialQuote={quote}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isEditMode={true}
      >
        <QuoteFormWithSubmit onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </QuoteProvider>
    </div>
  );
};

export default QuoteEditPage;