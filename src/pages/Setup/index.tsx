import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { SetSelector } from '../Dashboard/components/SetSelector';
import { VocabItem, DataSource, ProgressState, AppMode } from '../../types';

interface SetupPageProps {
  data: VocabItem[];
  dataSources: DataSource[];
  progress: ProgressState;
  onStartSession: (items: VocabItem[], mode: AppMode, setId: string | null, shuffle?: boolean) => void;
  onCancel: () => void;
  setupState: {
    chunkSize: number;
    shuffledSets: Set<string>;
    filterSourceId: string;
    setupPage: number;
  };
  setSetupState: React.Dispatch<React.SetStateAction<{
    chunkSize: number;
    shuffledSets: Set<string>;
    filterSourceId: string;
    setupPage: number;
  }>>;
}

const SetupPage: React.FC<SetupPageProps> = ({ data, dataSources, progress, onStartSession, onCancel, setupState, setSetupState }) => {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();

  // Validate mode
  const appMode = mode === 'quiz' ? AppMode.QUIZ : (mode === 'flashcard' ? AppMode.FLASHCARD : null);

  if (!appMode) {
    return <Navigate to="/" replace />;
  }

  const handleSetSelectionMode = (newMode: AppMode | null) => {
    if (!newMode) {
      onCancel();
      navigate('/');
    } else {
      // If switching between modes (e.g. quiz <-> flashcard)
      if (newMode === AppMode.QUIZ) navigate('/setup/quiz');
      if (newMode === AppMode.FLASHCARD) navigate('/setup/flashcard');
    }
  };

  return (
    <SetSelector
      data={data}
      dataSources={dataSources}
      progress={progress}
      selectionMode={appMode}
      setSelectionMode={handleSetSelectionMode}
      onStartSession={onStartSession}
      setupState={setupState}
      setSetupState={setSetupState}
    />
  );
};

export default SetupPage;
