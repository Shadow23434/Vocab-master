
import React, { useState, useEffect, useMemo } from 'react';
import defaultData from './normalize.json';
import { loadTopics } from './utils/dataLoader';
import { VocabItem, AppMode, ProgressState, DataSource } from './types';
import Dashboard from './components/Dashboard';
import FlashcardMode from './components/FlashcardMode';
import QuizMode from './components/QuizMode';
import { useDarkMode } from './hooks/useDarkMode';

const App: React.FC = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [isLoading, setIsLoading] = useState(true);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  // Game Session State
  const [activeData, setActiveData] = useState<VocabItem[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [activeShuffle, setActiveShuffle] = useState<boolean>(false);
  const [returnToMode, setReturnToMode] = useState<AppMode | null>(null);
  const [initialSearchTerm, setInitialSearchTerm] = useState<string>('');
  
  // Progress State
  const [progress, setProgress] = useState<ProgressState>({ quiz: {}, flashcard: {} });

  // Check for URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    if (search) {
        setInitialSearchTerm(search);
    }
  }, []);

  // Initialize Data and Progress
  useEffect(() => {
    // 1. Load Vocab Data
    const savedSources = localStorage.getItem('vocabMasterSources');
    const savedLegacyData = localStorage.getItem('vocabMasterData');
    
    // Always load fresh topics from code to ensure we have latest images/thumbnails
    const freshTopics = loadTopics();

    if (savedSources) {
      try {
        const parsedSources = JSON.parse(savedSources) as DataSource[];
        
        // Keep user-created sources (including default), but replace static topics with fresh ones
        // This ensures thumbnails and new content in topics.json are always reflected
        const userSources = parsedSources.filter(s => !s.id.startsWith('topic-'));
        
        setDataSources([...userSources, ...freshTopics]);
      } catch (e) {
        console.error("Failed to parse saved sources", e);
        // Fallback to default
        setDataSources([{
          id: 'default',
          name: 'Default Vocabulary',
          items: defaultData as VocabItem[],
          createdAt: Date.now()
        }, ...freshTopics]);
      }
    } else if (savedLegacyData) {
      // Migrate legacy data
      try {
        const legacyItems = JSON.parse(savedLegacyData);
        setDataSources([{
          id: 'migrated-legacy',
          name: 'Imported Data',
          items: legacyItems,
          createdAt: Date.now()
        }, ...freshTopics]);
        // Clear legacy key
        localStorage.removeItem('vocabMasterData');
      } catch (e) {
        console.error("Failed to migrate legacy data", e);
        setDataSources([{
          id: 'default',
          name: 'Default Vocabulary',
          items: defaultData as VocabItem[],
          createdAt: Date.now()
        }, ...freshTopics]);
      }
    } else {
      // First time load
      setDataSources([{
        id: 'default',
        name: 'Default Vocabulary',
        items: defaultData as VocabItem[],
        createdAt: Date.now()
      }, ...freshTopics]);
    }

    // 2. Load Progress
    const savedProgress = localStorage.getItem('vocabMasterProgress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        
        // Data Migration: Convert old boolean flashcard progress to number
        const flashcardData = parsed.flashcard || {};
        const migratedFlashcard: Record<string, number> = {};
        
        Object.keys(flashcardData).forEach(key => {
            const val = flashcardData[key];
            if (typeof val === 'boolean') {
                migratedFlashcard[key] = val ? 100 : 0;
            } else {
                migratedFlashcard[key] = val;
            }
        });

        setProgress({
            quiz: parsed.quiz || {},
            flashcard: migratedFlashcard
        });
      } catch (e) {
        console.error("Failed to load progress", e);
      }
    }

    setIsLoading(false);
  }, []);

  // Save Sources whenever they change
  useEffect(() => {
    if (!isLoading && dataSources.length > 0) {
        localStorage.setItem('vocabMasterSources', JSON.stringify(dataSources));
    }
  }, [dataSources, isLoading]);

  // Save Progress whenever it changes
  useEffect(() => {
    if (!isLoading) {
        localStorage.setItem('vocabMasterProgress', JSON.stringify(progress));
    }
  }, [progress, isLoading]);

  const handleImport = (sourceId: string, newItems: VocabItem[], newSourceName?: string) => {
    setDataSources(prev => {
      if (sourceId === 'new' && newSourceName) {
        // Create new source
        const newSource: DataSource = {
          id: `source-${Date.now()}`,
          name: newSourceName,
          items: newItems,
          createdAt: Date.now()
        };
        return [...prev, newSource];
      } else {
        // Append to existing source
        return prev.map(source => {
          if (source.id === sourceId) {
            return {
              ...source,
              items: [...source.items, ...newItems]
            };
          }
          return source;
        });
      }
    });
  };

  const handleRenameSource = (sourceId: string, newName: string) => {
    setDataSources(prev => prev.map(source => {
      if (source.id === sourceId) {
        return { ...source, name: newName };
      }
      return source;
    }));
  };

  const handleClearData = (sourceId?: string) => {
    if (sourceId) {
      if (sourceId === 'default') {
        // Don't delete default source, just empty it
        if (window.confirm("Clear all items from Default Vocabulary?")) {
            setDataSources(prev => prev.map(s => s.id === 'default' ? { ...s, items: [] } : s));
        }
      } else {
        // Delete custom source
        if (window.confirm("Are you sure you want to delete this source?")) {
            setDataSources(prev => prev.filter(s => s.id !== sourceId));
        }
      }
    } else {
      // Clear all custom data, reset to default
      if (window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
         setDataSources([{
            id: 'default',
            name: 'Default Vocabulary',
            items: defaultData as VocabItem[],
            createdAt: Date.now()
         }]);
         setProgress({ quiz: {}, flashcard: {} });
      }
    }
  };

  // Flatten all items for display in Dashboard (Play/Library)
  // We could also pass sources to Dashboard if we want to filter there
  const allVocab = useMemo(() => {
    return dataSources.flatMap(s => s.items);
  }, [dataSources]);

  const handleStartSession = (selectedItems: VocabItem[], targetMode: AppMode, setId: string | null, shuffle: boolean = false) => {
    setActiveData(selectedItems);
    setActiveSetId(setId);
    setActiveShuffle(shuffle);
    setReturnToMode(null); // Clear return mode when starting new session
    setMode(targetMode);
  };

  const handleQuizComplete = (score: number) => {
    if (activeSetId) {
      setProgress(prev => ({
        ...prev,
        quiz: {
            ...prev.quiz,
            [activeSetId]: Math.max(score, prev.quiz[activeSetId] || 0)
        }
      }));
    }
  };

  const handleFlashcardComplete = (completionPercentage: number) => {
    if (activeSetId) {
        setProgress(prev => ({
            ...prev,
            flashcard: {
                ...prev.flashcard,
                [activeSetId]: Math.max(completionPercentage, prev.flashcard[activeSetId] || 0)
            }
        }));
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col h-screen items-center justify-center bg-[#f2f2f2] dark:bg-gray-900 transition-colors duration-500">
          <div className="mb-8 relative">
             <div className="absolute inset-0 bg-quizizz-purple blur-2xl opacity-20 rounded-full animate-pulse"></div>
             <h1 className="relative text-5xl font-black text-gray-800 dark:text-white tracking-tight">
              Vocab<span className="text-quizizz-purple">Master</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-quizizz-red rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-4 h-4 bg-quizizz-blue rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-4 h-4 bg-quizizz-green rounded-full animate-bounce"></div>
          </div>
          
          <p className="mt-6 text-gray-500 dark:text-gray-400 font-medium animate-pulse">Preparing your learning space...</p>
        </div>
      );
    }

    switch (mode) {
      case AppMode.FLASHCARD:
        return (
          <FlashcardMode 
            data={activeData} 
            onBack={() => {
              setReturnToMode(AppMode.FLASHCARD);
              setMode(AppMode.HOME);
            }} 
            onComplete={handleFlashcardComplete}
          />
        );
      case AppMode.QUIZ:
        return (
          <QuizMode 
            data={activeData} 
            onBack={() => {
              setReturnToMode(AppMode.QUIZ);
              setMode(AppMode.HOME);
            }}
            onComplete={handleQuizComplete}
            initialShuffle={activeShuffle}
          />
        );
      case AppMode.HOME:
      default:
        return (
          <Dashboard 
            data={allVocab}
            dataSources={dataSources}
            progress={progress}
            onStartSession={handleStartSession}
            onImport={handleImport}
            onClearData={handleClearData}
            onRenameSource={handleRenameSource}
            returnToMode={returnToMode}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            initialSearchTerm={initialSearchTerm}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f2f2] dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans selection:bg-quizizz-purple selection:text-white">
      {renderContent()}
    </div>
  );
};

export default App;
