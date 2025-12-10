import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { VocabItem, AppMode, ProgressState, DataSource } from '../../types';
import { DashboardHeader } from './components/DashboardHeader';
import { TabNavigation } from './components/TabNavigation';
import { PlayMode } from './components/PlayMode';
import { LibraryMode } from './components/LibraryMode';
import { DataMode } from './components/DataMode';

interface DashboardProps {
  data: VocabItem[];
  dataSources: DataSource[];
  progress: ProgressState;
  onStartSession: (items: VocabItem[], mode: AppMode, setId: string | null, shuffle?: boolean) => void;
  onImport: (sourceId: string, items: VocabItem[], newSourceName?: string) => void;
  onClearData: (sourceId?: string) => void;
  onRenameSource: (sourceId: string, newName: string) => void;
  returnToMode?: AppMode | null;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  initialSearchTerm?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ data, dataSources, progress, onStartSession, onImport, onClearData, onRenameSource, returnToMode, isDarkMode, toggleDarkMode, initialSearchTerm }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tabParam = searchParams.get('tab');
  const activeTab = (tabParam === 'play' || tabParam === 'library' || tabParam === 'data') 
    ? tabParam 
    : (initialSearchTerm ? 'library' : 'play');

  const setActiveTab = (tab: 'play' | 'library' | 'data') => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab);
      return newParams;
    });
  };

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');

  // Auto-open set selector when returning from quiz/flashcard
  React.useEffect(() => {
    if (returnToMode) {
      if (returnToMode === AppMode.QUIZ) navigate('/setup/quiz');
      if (returnToMode === AppMode.FLASHCARD) navigate('/setup/flashcard');
    }
  }, [returnToMode, navigate]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 relative">
      <DashboardHeader 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        dataLength={data.length} 
      />

      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className={activeTab === 'play' ? 'block' : 'hidden'}>
        <PlayMode 
          dataLength={data.length} 
          setSelectionMode={(mode) => {
             if (mode === AppMode.QUIZ) navigate('/setup/quiz');
             if (mode === AppMode.FLASHCARD) navigate('/setup/flashcard');
          }}
          onNavigateToImport={() => setActiveTab('data')}
          onClearData={() => onClearData()}
        />
      </div>

      <div className={activeTab === 'library' ? 'block' : 'hidden'}>
        <LibraryMode 
          data={data} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm}
          onNavigateToImport={() => setActiveTab('data')}
          onClearData={() => onClearData()}
        />
      </div>

      <div className={activeTab === 'data' ? 'block' : 'hidden'}>
        <DataMode 
          data={data}
          dataSources={dataSources}
          onImport={onImport}
          onClearData={onClearData}
          onRenameSource={onRenameSource}
          onImportSuccess={() => setActiveTab('play')}
        />
      </div>
    </div>
  );
};

export default Dashboard;
