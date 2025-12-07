
import React, { useState, useEffect, useRef } from 'react';
import { VocabItem } from '../types';
import { ArrowLeft, ArrowRight, RotateCcw, Volume2, CheckCircle } from 'lucide-react';
import { getTypeStyle } from '../utils/styleUtils';

interface FlashcardModeProps {
  data: VocabItem[];
  onBack: () => void;
  onComplete?: (progress: number) => void;
}

const FlashcardMode: React.FC<FlashcardModeProps> = ({ data, onBack, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Track visited cards using a Set of indices
  const visitedRef = useRef<Set<number>>(new Set([0]));
  const [visitedCount, setVisitedCount] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Add current index to visited
    if (!visitedRef.current.has(currentIndex)) {
        visitedRef.current.add(currentIndex);
        setVisitedCount(visitedRef.current.size);
    }
    
    // Check if all cards visited
    if (visitedRef.current.size === data.length && !isCompleted) {
        setIsCompleted(true);
        if (onComplete) onComplete(100);
    }
  }, [currentIndex, data.length, isCompleted, onComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        setIsFlipped(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, data.length]);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % data.length);
    }, 200);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + data.length) % data.length);
    }, 200);
  };

  const handleExit = () => {
    // Calculate and save partial progress
    const percentage = Math.round((visitedRef.current.size / data.length) * 100);
    if (onComplete) onComplete(percentage);
    onBack();
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const currentItem = data[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto px-4">
      
      {/* Header Controls */}
      <div className="w-full flex justify-between items-center py-4">
        <button 
          onClick={handleExit}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-quizizz-purple dark:hover:text-quizizz-purple font-semibold transition"
        >
          <ArrowLeft className="mr-2" size={20} /> Exit
        </button>
        <div className="flex items-center gap-4">
            {isCompleted && (
                <span className="flex items-center text-green-500 font-bold text-sm bg-green-100 px-3 py-1 rounded-full animate-in fade-in">
                    <CheckCircle size={14} className="mr-1"/> Set Completed
                </span>
            )}
            <div className="text-gray-500 dark:text-gray-400 font-bold text-lg">
            {currentIndex + 1} / {data.length}
            </div>
        </div>
      </div>

      {/* Progress Bar for Flashcards */}
      <div className="w-full max-w-2xl h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8 overflow-hidden">
        <div 
            className="h-full bg-quizizz-blue transition-all duration-300"
            style={{ width: `${(visitedCount / data.length) * 100}%` }}
        ></div>
      </div>

      {/* Card Container */}
      <div className="w-full h-[400px] card-perspective cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`card-inner ${isFlipped ? 'card-flipped' : ''}`}>
          
          {/* Front */}
          <div className="card-front bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center gap-4 p-8">
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Term</span>
              <h2 className="text-5xl font-bold text-quizizz-dark dark:text-white text-center">{currentItem.word}</h2>
              
              <div className="flex items-center gap-2 mt-2">
                {currentItem.type && currentItem.type.split(',').map((t, i) => (
                  <span key={i} className={`px-3 py-1 rounded-full text-sm font-mono border ${getTypeStyle(t.trim())}`}>
                    {t.trim()}
                  </span>
                ))}
                {currentItem.phonetic && (
                  <span className="text-gray-500 dark:text-gray-400 font-serif italic text-xl">
                    /{currentItem.phonetic.replace(/\//g, '')}/
                  </span>
                )}
                 <button 
                  onClick={(e) => { e.stopPropagation(); speak(currentItem.word); }}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-quizizz-purple transition ml-2"
                >
                  <Volume2 size={24} />
                </button>
              </div>
              
              <p className="mt-8 text-gray-400 dark:text-gray-500 text-sm animate-pulse">Click to flip</p>
            </div>
          </div>

          {/* Back */}
          <div className="card-back bg-quizizz-purple border-2 border-quizizz-purple">
            <div className="flex flex-col items-center gap-6 p-8 text-white h-full justify-center overflow-y-auto w-full">
              <div className="text-center">
                <span className="text-xs font-bold text-purple-200 uppercase tracking-widest">Definition</span>
                <h3 className="text-3xl font-bold mt-2">{currentItem.meaning}</h3>
              </div>

              {(currentItem.example) && (
                <div className="w-full bg-white/10 p-4 rounded-xl backdrop-blur-sm mt-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <p className="text-lg italic">"{currentItem.example}"</p>
                    <button 
                        onClick={(e) => { e.stopPropagation(); speak(currentItem.example); }}
                        className="p-2 rounded-full hover:bg-white/20 text-white transition flex-shrink-0"
                        title="Listen to example"
                    >
                        <Volume2 size={20} />
                    </button>
                  </div>
                  {currentItem.exampleMeaning && (
                    <p className="text-sm text-purple-100">{currentItem.exampleMeaning}</p>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center gap-6 mt-8">
        <button 
          onClick={handlePrev}
          className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition text-gray-600 dark:text-gray-300"
        >
          <ArrowLeft size={24} />
        </button>

        <button 
          onClick={() => setIsFlipped(!isFlipped)}
          className="px-8 py-3 bg-quizizz-blue text-white rounded-full font-bold shadow-[0_4px_0_rgb(5,116,200)] active:shadow-none active:translate-y-[4px] transition"
        >
          Flip Card
        </button>

        <button 
          onClick={handleNext}
          className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition text-gray-600 dark:text-gray-300"
        >
          <ArrowRight size={24} />
        </button>
      </div>

    </div>
  );
};

export default FlashcardMode;
