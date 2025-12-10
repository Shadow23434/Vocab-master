import React from 'react';
import { AppMode } from '../../../types';
import { Layers, Play } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface PlayModeProps {
  dataLength: number;
  setSelectionMode: (mode: AppMode) => void;
  onNavigateToImport: () => void;
  onClearData: () => void;
}

export const PlayMode: React.FC<PlayModeProps> = ({ dataLength, setSelectionMode, onNavigateToImport, onClearData }) => {
  if (dataLength === 0) {
    return <EmptyState onNavigateToImport={onNavigateToImport} onClearData={onClearData} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Flashcard Card */}
      <div 
        onClick={() => setSelectionMode(AppMode.FLASHCARD)}
        className="group relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer border-b-[8px] border-b-quizizz-blue overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition duration-500">
          <Layers size={140} />
        </div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-quizizz-blue mb-6">
            <Layers size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">Flashcards</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Study efficiently with flip cards. Review meanings, phonetics, and examples.</p>
          <span className="inline-block px-6 py-3 bg-quizizz-blue text-white rounded-full font-bold hover:bg-quizizz-blue/70 hover:text-white/80">Choose Set</span>
        </div>
      </div>

      {/* Quiz Card */}
      <div 
        onClick={() => setSelectionMode(AppMode.QUIZ)}
        className="group relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer border-b-[8px] border-b-quizizz-green overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition duration-500">
          <Play size={140} />
        </div>
        <div className="relative z-10">
           <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-quizizz-green mb-6">
            <Play size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">Take Quiz</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Test your knowledge with gamified multiple choice questions and earn points.</p>
          <span className="inline-block px-6 py-3 bg-quizizz-green text-white rounded-full font-bold hover:bg-quizizz-green/70 hover:text-white/80">Choose Set</span>
        </div>
      </div>
    </div>
  );
};
