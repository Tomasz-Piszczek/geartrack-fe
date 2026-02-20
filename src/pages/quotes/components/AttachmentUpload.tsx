import React, { useState } from 'react';
import { HiPaperClip, HiDownload, HiTrash } from 'react-icons/hi';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import { quotesApi } from '../../../api/quotes';
import type { QuoteAttachmentDto } from '../../../api/quotes';
import { toast } from '../../../lib/toast';

interface AttachmentUploadProps {
  quoteId?: string;
  attachments: QuoteAttachmentDto[];
  onAttachmentsChange: (attachments: QuoteAttachmentDto[]) => void;
  pendingFiles: File[];
  onPendingFilesChange: (files: File[]) => void;
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  quoteId,
  attachments,
  onAttachmentsChange,
  pendingFiles,
  onPendingFilesChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Typ pliku nie jest obsługiwany. Dozwolone typy: PDF, obrazy (PNG, JPG, GIF, BMP, WEBP), Word, Excel, pliki tekstowe.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Plik jest za duży. Maksymalny rozmiar to 10MB.';
    }
    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!quoteId) {
      // Store as pending file for later upload
      onPendingFilesChange([...pendingFiles, file]);
      toast.success('Załącznik dodany. Zostanie przesłany po zapisaniu wyceny.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);
    try {
      const newAttachment = await quotesApi.uploadAttachment(quoteId, file);
      onAttachmentsChange([...attachments, newAttachment]);
      toast.success('Załącznik został dodany');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Błąd podczas dodawania załącznika');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenInNewTab = async (attachment: QuoteAttachmentDto) => {
    if (!quoteId) return;

    try {
      const blob = await quotesApi.downloadAttachment(quoteId, attachment.uuid);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Don't revoke immediately - let the browser load it first
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error('Błąd podczas otwierania załącznika');
      console.error('Open error:', error);
    }
  };

  const handleDownload = async (attachment: QuoteAttachmentDto) => {
    if (!quoteId) return;

    try {
      const blob = await quotesApi.downloadAttachment(quoteId, attachment.uuid);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Załącznik został pobrany');
    } catch (error) {
      toast.error('Błąd podczas pobierania załącznika');
      console.error('Download error:', error);
    }
  };

  const handleDelete = async (attachment: QuoteAttachmentDto) => {
    if (!quoteId) return;

    if (!confirm(`Czy na pewno chcesz usunąć załącznik "${attachment.fileName}"?`)) {
      return;
    }

    try {
      await quotesApi.deleteAttachment(quoteId, attachment.uuid);
      onAttachmentsChange(attachments.filter(a => a.uuid !== attachment.uuid));
      toast.success('Załącznik został usunięty');
    } catch (error) {
      toast.error('Błąd podczas usuwania załącznika');
      console.error('Delete error:', error);
    }
  };

  const handleRemovePendingFile = (index: number) => {
    const file = pendingFiles[index];
    if (!confirm(`Czy na pewno chcesz usunąć "${file.name}"?`)) {
      return;
    }
    onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
    toast.success('Załącznik został usunięty');
  };

  const totalCount = attachments.length + pendingFiles.length;

  return (
    <>
      <Button
        color="gray"
        onClick={() => setIsModalOpen(true)}
        className="bg-green-900 hover:bg-green-800 text-green-300"
      >
        <HiPaperClip className="w-4 h-4 mr-2" />
        Załącznik
        {totalCount > 0 && (
          <span className="ml-2 bg-green-700 px-2 py-0.5 rounded-full text-xs">
            {totalCount}
          </span>
        )}
      </Button>

      <Modal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="2xl"
      >
        <Modal.Header>Załączniki</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.doc,.docx,.xls,.xlsx,.txt"
                className="hidden"
                disabled={isUploading}
              />
              <Button
                color="primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                loading={isUploading}
                className="w-full"
              >
                <HiPaperClip className="w-4 h-4 mr-2" />
                Wybierz plik
              </Button>
              <p className="text-xs text-gray-400 mt-2">
                Dozwolone: PDF, obrazy, Word, Excel, pliki tekstowe (max 10MB)
              </p>
              {!quoteId && pendingFiles.length > 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  Załączniki zostaną przesłane po zapisaniu wyceny
                </p>
              )}
            </div>

            {pendingFiles.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-yellow-300">
                  Do przesłania ({pendingFiles.length})
                </h3>
                {pendingFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-yellow-900/20 p-3 rounded border border-yellow-700"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm text-yellow-300 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-yellow-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRemovePendingFile(index)}
                        className="p-2 hover:bg-red-900/30 rounded text-red-400 hover:text-red-300 transition-colors"
                        title="Usuń"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {attachments.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-green-300">
                  Przesłane ({attachments.length})
                </h3>
                {attachments.map((attachment) => (
                  <div
                    key={attachment.uuid}
                    className="flex items-center justify-between bg-[#232323] p-3 rounded border border-gray-700"
                  >
                    <button
                      onClick={() => handleOpenInNewTab(attachment)}
                      className="flex-1 min-w-0 mr-3 text-left hover:bg-gray-700/30 rounded p-2 -m-2 transition-colors"
                    >
                      <p className="text-sm text-blue-400 hover:text-blue-300 truncate cursor-pointer underline">
                        {attachment.fileName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(attachment.fileSize)} • {new Date(attachment.createdAt).toLocaleDateString('pl-PL')}
                      </p>
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(attachment)}
                        className="p-2 hover:bg-blue-900/30 rounded text-blue-400 hover:text-blue-300 transition-colors"
                        title="Pobierz"
                      >
                        <HiDownload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(attachment)}
                        className="p-2 hover:bg-red-900/30 rounded text-red-400 hover:text-red-300 transition-colors"
                        title="Usuń"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {attachments.length === 0 && pendingFiles.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                Brak załączników
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={() => setIsModalOpen(false)}>
            Zamknij
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AttachmentUpload;
