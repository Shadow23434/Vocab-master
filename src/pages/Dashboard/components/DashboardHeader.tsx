import React from 'react';
import { Sun, Moon, Database } from 'lucide-react';

interface DashboardHeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  dataLength: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ isDarkMode, toggleDarkMode, dataLength }) => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center mb-12">
      <div className="mb-4 md:mb-0">
          <h1 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight">
            Vocab<span className="text-quizizz-purple">Master</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Gamified learning for English Vocabulary</p>
      </div>
      <div className="flex items-center gap-3">
          <button
              onClick={toggleDarkMode}
              className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-quizizz-purple dark:hover:text-quizizz-purple transition"
              aria-label="Toggle Dark Mode"
          >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <Database size={18} className="text-quizizz-blue" />
            <span className="font-bold text-gray-700 dark:text-gray-200">{dataLength} Words Loaded</span>
          </div>
      </div>
    </header>
  );
};
