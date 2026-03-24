import React, { useState } from 'react';
import { HiDocumentText } from 'react-icons/hi';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';

interface NoteModalProps {
  note?: string;
  onNoteChange: (note: string) => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ note, onNoteChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempNote, setTempNote] = useState(note || '');

  const handleOpen = () => {
    setTempNote(note || '');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    onNoteChange(tempNote);
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setTempNote(note || '');
    setIsModalOpen(false);
  };

  const hasNote = note && note.trim().length > 0;

  return (
    <>
      <Button
        color="gray"
        onClick={handleOpen}
        className={hasNote ? "bg-blue-900 hover:bg-blue-800 text-blue-300" : ""}
      >
        <HiDocumentText className="w-4 h-4 mr-2" />
        Notatki
        {hasNote && (
          <span className="ml-2 bg-blue-700 px-2 py-0.5 rounded-full text-xs">
            1
          </span>
        )}
      </Button>

      <Modal
        show={isModalOpen}
        onClose={handleCancel}
        size="lg"
      >
        <Modal.Header>Notatka</Modal.Header>
        <Modal.Body>
          <div>
            <textarea
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              rows={8}
              className="w-full p-3 bg-section-grey-light border border-lighter-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-green resize-none"
              placeholder="Wprowadź notatkę..."
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex justify-end gap-2 w-full">
            <Button color="gray" onClick={handleCancel}>
              Anuluj
            </Button>
            <Button color="primary" onClick={handleSave}>
              Zapisz
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default NoteModal;
