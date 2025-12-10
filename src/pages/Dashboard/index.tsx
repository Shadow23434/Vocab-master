import React, { useState } from 'react';
import { VocabItem, AppMode, ProgressState, DataSource } from '../../types';
import { DashboardHeader } from './components/DashboardHeader';
import { TabNavigation } from './components/TabNavigation';
import { PlayMode } from './components/PlayMode';
import { LibraryMode } from './components/LibraryMode';
import { DataMode } from './components/DataMode';
import { SetSelector } from './components/SetSelector';

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
  const [activeTab, setActiveTab] = useState<'play' | 'library' | 'import'>(initialSearchTerm ? 'library' : 'play');
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
  const [selectionMode, setSelectionMode] = useState<AppMode | null>(returnToMode || null);

  // Auto-open set selector when returning from quiz/flashcard
  React.useEffect(() => {
    if (returnToMode) {
      setSelectionMode(returnToMode);
    }
  }, [returnToMode]);

  if (selectionMode) {
    return (
      <SetSelector 
        data={data}
        dataSources={dataSources}
        progress={progress}
        selectionMode={selectionMode}
        setSelectionMode={setSelectionMode}
        onStartSession={onStartSession}
      />
    );
  }

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
          setSelectionMode={setSelectionMode}
          onNavigateToImport={() => setActiveTab('import')}
          onClearData={() => onClearData()}
        />
      </div>

      <div className={activeTab === 'library' ? 'block' : 'hidden'}>
        <LibraryMode 
          data={data} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm}
          onNavigateToImport={() => setActiveTab('import')}
          onClearData={() => onClearData()}
        />
      </div>

      <div className={activeTab === 'import' ? 'block' : 'hidden'}>
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
