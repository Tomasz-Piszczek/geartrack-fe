import React from 'react';
import { useQuote } from '../context/QuoteContext';
import NoteModal from './NoteModal';

const NoteButtonWrapper: React.FC = () => {
  const { state, dispatch } = useQuote();

  const handleNoteChange = (note: string) => {
    dispatch({ type: 'SET_FIELD', field: 'note', value: note });
  };

  return <NoteModal note={state.note} onNoteChange={handleNoteChange} />;
};

export default NoteButtonWrapper;
