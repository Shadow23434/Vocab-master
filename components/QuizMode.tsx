import React, { useState, useEffect } from 'react';
import { VocabItem } from '../types';
import { shuffleArray, seededShuffleArray } from '../utils/csvParser';
import confetti from 'canvas-confetti';
import { Check, X, Trophy, RefreshCw, Home, Volume2, Search, ArrowLeft } from 'lucide-react';
import { getTypeStyle } from '../utils/styleUtils';

interface QuizModeProps {
  data: VocabItem[];
  onBack: () => void;
  onComplete?: (score: number) => void;
  initialShuffle?: boolean;
}

const COLORS = [
  'bg-quizizz-red border-b-[6px] border-b-[#b32405]',
  'bg-quizizz-blue border-b-[6px] border-b-[#066dbd]',
  'bg-quizizz-yellow border-b-[6px] border-b-[#dcb160]',
  'bg-quizizz-green border-b-[6px] border-b-[#009476]'
];

const QuizMode: React.FC<QuizModeProps> = ({ data, onBack, onComplete, initialShuffle = false }) => {
  const [questions, setQuestions] = useState<{ target: VocabItem, options: VocabItem[] }[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    initializeQuiz(initialShuffle);
  }, [data, initialShuffle]);

  const initializeQuiz = (shuffle: boolean = false) => {
    // Only shuffle question order when user requests
    const orderedData = shuffle ? shuffleArray(data) : [...data];
    
    const quizQuestions = orderedData.map((target: VocabItem) => {
      // Get other words as distractors
      const others = data.filter((d: VocabItem) => d.id !== target.id);
      
      // Use seeded shuffle with vocab id as seed
      // Ensures each word always has the same 3 fixed distractors
      const seededOthers = seededShuffleArray(others, target.id);
      const distractors = seededOthers.slice(0, 3);
      
      // The order of 4 options is still random each time
      const options = shuffleArray([target, ...distractors]);
      return { target, options };
    });
    setQuestions(quizQuestions);
    setCurrentQIndex(0);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setShowResult(false);
    setIsAnswered(false);
    setSelectedOptionId(null);
  };

  const finishQuiz = (finalCorrect: number) => {
    setShowResult(true);
    fireFinaleConfetti();
    if (onComplete && questions.length > 0) {
      const percentage = Math.round((finalCorrect / questions.length) * 100);
      onComplete(percentage);
    }
  };

  const handleExit = () => {
    // Save partial progress if user exits early
    if (questions.length > 0 && onComplete) {
      const percentage = Math.round((correctCount / questions.length) * 100);
      onComplete(percentage);
    }
    onBack();
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleOptionClick = (option: VocabItem) => {
    if (isAnswered) return;
    
    setSelectedOptionId(option.id);
    setIsAnswered(true);

    const isCorrect = option.id === questions[currentQIndex].target.id;
    let newCorrectCount = correctCount;

    if (isCorrect) {
      setScore(prev => prev + 100 + (streak * 10)); // Base + Streak bonus
      setStreak(prev => prev + 1);
      newCorrectCount = correctCount + 1;
      setCorrectCount(newCorrectCount);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#00b894', '#fdcb6e']
      });
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (currentQIndex < questions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
        setIsAnswered(false);
        setSelectedOptionId(null);
      } else {
        finishQuiz(newCorrectCount);
      }
    }, 1500);
  };

  const fireFinaleConfetti = () => {
    const end = Date.now() + 1000;
    const colors = ['#eb2f06', '#0984e3', '#fdcb6e', '#00b894'];
    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  if (questions.length === 0) return <div className="text-center p-10">Loading Quiz...</div>;

  if (showResult) {
    const accuracy = Math.round((correctCount / questions.length) * 100);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full animate-in fade-in zoom-in duration-500 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-2xl text-center max-w-md w-full border-4 border-quizizz-purple">
          <div className="mb-6 inline-flex p-6 bg-yellow-100 rounded-full text-yellow-500">
            <Trophy size={64} />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Quiz Completed!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Great job practicing your vocabulary.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">Accuracy</p>
              <p className="text-3xl font-black text-quizizz-green">{accuracy}%</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">Score</p>
              <p className="text-3xl font-black text-quizizz-purple">{score}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={initializeQuiz}
              className="w-full py-4 bg-quizizz-green text-white rounded-xl font-bold shadow-[0_4px_0_#009476] active:shadow-none active:translate-y-[4px] transition flex justify-center items-center gap-2"
            >
              <RefreshCw size={20} /> Play Again
            </button>
            <button 
              onClick={onBack}
              className="w-full py-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition flex justify-center items-center gap-2"
            >
              <Home size={20} /> Exit
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-6 flex flex-col h-screen max-h-[900px]">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
        <button onClick={handleExit} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-quizizz-purple dark:hover:text-quizizz-purple font-semibold transition">
          <ArrowLeft className="mr-2" size={20} /> Exit
        </button>
        
        <div className="flex-1 mx-4 md:mx-6 flex items-center">
            <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mr-3 w-12 text-right">
                {currentQIndex + 1} / {questions.length}
            </div>
            <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-quizizz-purple transition-all duration-500"
                    style={{ width: `${((currentQIndex) / questions.length) * 100}%` }}
                />
            </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Streak</span>
                <span className="font-bold text-quizizz-red">🔥 {streak}</span>
            </div>
            <div className="bg-purple-600 text-white px-4 py-2 rounded-lg font-mono font-bold">
            {score}
            </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col justify-center items-center mb-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-quizizz-purple to-quizizz-blue"></div>
            <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm mb-4">Select the correct meaning</p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-2">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white">{currentQ.target.word}</h1>
                <div className="flex gap-2">
                  <button 
                    onClick={() => speak(currentQ.target.word)}
                    className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-quizizz-purple transition hover:scale-110 active:scale-90"
                    title="Listen"
                  >
                    <Volume2 size={28} />
                  </button>
                  <button 
                    onClick={() => window.open(`/?search=${encodeURIComponent(currentQ.target.word)}`, '_blank')}
                    className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-blue-500 transition hover:scale-110 active:scale-90"
                    title="Find in Library (New Tab)"
                  >
                    <Search size={28} />
                  </button>
                </div>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              {currentQ.target.type && currentQ.target.type.split(',').map((t, i) => (
                <span key={i} className={`px-2 py-0.5 text-xs rounded font-mono font-bold lowercase border ${getTypeStyle(t.trim())}`}>
                  {t.trim()}
                </span>
              ))}
              <p className="text-gray-400 dark:text-gray-500 italic font-serif">/{currentQ.target.phonetic?.replace(/\//g, '')}/</p>
            </div>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {currentQ.options.map((option, idx) => {
          let stateStyles = COLORS[idx % COLORS.length]; // Default state
          let icon = null;

          if (isAnswered) {
             if (option.id === currentQ.target.id) {
                 // Correct Answer Style
                 stateStyles = "bg-green-500 border-b-[6px] border-b-green-700 text-white";
                 icon = <Check className="absolute right-4 top-1/2 -translate-y-1/2" size={24} />;
             } else if (option.id === selectedOptionId) {
                 // Selected Wrong Answer
                 stateStyles = "bg-red-500 border-b-[6px] border-b-red-700 text-white";
                 icon = <X className="absolute right-4 top-1/2 -translate-y-1/2" size={24} />;
             } else {
                 // Unselected options fade out
                 stateStyles = "bg-gray-300 dark:bg-gray-700 border-b-[6px] border-b-gray-400 dark:border-b-gray-600 text-gray-500 dark:text-gray-400 opacity-50";
             }
          } else {
              // Default text color
              stateStyles += " text-white hover:brightness-110 active:translate-y-[4px] active:shadow-none transition-all";
          }

          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option)}
              disabled={isAnswered}
              className={`relative p-8 rounded-2xl text-xl font-bold shadow-md text-left transition-all h-32 flex items-center ${stateStyles}`}
            >
              <span className="pr-8">{option.meaning}</span>
              {icon}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizMode;