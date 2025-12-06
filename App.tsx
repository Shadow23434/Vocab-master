
import React, { useState, useEffect } from 'react';
import { RAW_CSV_DATA } from './constants';
import { parseCSV } from './utils/csvParser';
import { VocabItem, AppMode, ProgressState } from './types';
import Dashboard from './components/Dashboard';
import FlashcardMode from './components/FlashcardMode';
import QuizMode from './components/QuizMode';
import { useDarkMode } from './hooks/useDarkMode';

const App: React.FC = () => {
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [isLoading, setIsLoading] = useState(true);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  // Game Session State
  const [activeData, setActiveData] = useState<VocabItem[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [activeShuffle, setActiveShuffle] = useState<boolean>(false);
  const [returnToMode, setReturnToMode] = useState<AppMode | null>(null);
  
  // Progress State
  const [progress, setProgress] = useState<ProgressState>({ quiz: {}, flashcard: {} });

  // Initialize Data and Progress
  useEffect(() => {
    // 1. Load Vocab Data
    const savedData = localStorage.getItem('vocabMasterData');
    if (savedData) {
      try {
        setVocabList(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to parse saved vocab data, falling back to default.", e);
        setVocabList(parseCSV(RAW_CSV_DATA));
      }
    } else {
      setVocabList(parseCSV(RAW_CSV_DATA));
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

  // Save Vocab Data whenever it changes (e.g. after import)
  useEffect(() => {
    if (!isLoading && vocabList.length > 0) {
        localStorage.setItem('vocabMasterData', JSON.stringify(vocabList));
    }
  }, [vocabList, isLoading]);

  // Save Progress whenever it changes
  useEffect(() => {
    if (!isLoading) {
        localStorage.setItem('vocabMasterProgress', JSON.stringify(progress));
    }
  }, [progress, isLoading]);

  const handleAddGenerated = (newItems: VocabItem[]) => {
    setVocabList(prev => [...prev, ...newItems]);
  };

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
            data={vocabList}
            progress={progress}
            onStartSession={handleStartSession}
            onAddGenerated={handleAddGenerated}
            returnToMode={returnToMode}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
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
