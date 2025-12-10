import React from 'react';
import { Database, Upload, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  onNavigateToImport: () => void;
  onClearData: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onNavigateToImport, onClearData }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 text-gray-300 dark:text-gray-600">
        <Database size={48} />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No Vocabulary Data</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        Your library is empty. Import data from the Data tab to start learning.
      </p>
      <div className="flex gap-3">
        <button 
            onClick={onNavigateToImport}
            className="px-6 py-3 bg-quizizz-purple text-white rounded-xl font-bold shadow-lg hover:bg-purple-700 transition flex items-center gap-2"
        >
            <Upload size={20} /> Go to Import
        </button>
        <button 
            onClick={onClearData}
            className="px-6 py-3 bg-white dark:bg-gray-800 text-quizizz-purple border-2 border-quizizz-purple rounded-xl font-bold shadow-sm hover:bg-purple-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
        >
            <RefreshCw size={20} /> Load Default Data
        </button>
      </div>
    </div>
  );
};
