import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { quotesApi } from '../../api/quotes';
import type { CreateQuoteDto, QuoteAttachmentDto, QuoteDetailsDto } from '../../api/quotes';
import { QuoteProvider } from './context/QuoteContext';
import QuoteFormWithActions from './components/QuoteFormWithActions';
import AttachmentUpload from './components/AttachmentUpload';
import NoteButtonWrapper from './components/NoteButtonWrapper';
import Button from '../../components/common/Button';
import { toast } from '../../lib/toast';

const QuoteCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sourceQuote = location.state?.sourceQuote as QuoteDetailsDto | undefined;
  const locationPendingFiles = location.state?.pendingFiles as File[] | undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<QuoteAttachmentDto[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>(locationPendingFiles ?? []);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | undefined>();

  const { data: nextQuoteNumber } = useQuery({
    queryKey: ['nextQuoteNumber'],
    queryFn: quotesApi.getNextQuoteNumber,
    enabled: !sourceQuote,
  });

  const handleSubmit = async (data: CreateQuoteDto) => {
    setIsSubmitting(true);
    try {
      const createdQuote = await quotesApi.createQuote(data);
      setCreatedQuoteId(createdQuote.uuid);

      // Upload pending files after creating the quote
      if (pendingFiles.length > 0) {
        const uploadPromises = pendingFiles.map(file =>
          quotesApi.uploadAttachment(createdQuote.uuid, file)
        );
        await Promise.all(uploadPromises);
        setPendingFiles([]);
      }

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
      <QuoteProvider
        initialDocumentNumber={!sourceQuote ? nextQuoteNumber?.nextQuoteNumber : undefined}
        initialQuote={sourceQuote}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isEditMode={false}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Nowa wycena</h1>
          <div className="flex gap-4">
            <AttachmentUpload
              quoteId={createdQuoteId}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              pendingFiles={pendingFiles}
              onPendingFilesChange={setPendingFiles}
            />
            <NoteButtonWrapper />
            <Button
              color="gray"
              onClick={handleCancel}
            >
              Anuluj
            </Button>
          </div>
        </div>
        <QuoteFormWithActions onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </QuoteProvider>
    </div>
  );
};

export default QuoteCreatePage;