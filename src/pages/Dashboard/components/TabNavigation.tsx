import React from 'react';
import { BookOpen, Database } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'play' | 'library' | 'import';
  setActiveTab: (tab: 'play' | 'library' | 'import') => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex justify-center mb-8">
      <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex flex-wrap gap-1">
         <button 
           onClick={() => setActiveTab('play')}
           className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === 'play' ? 'bg-quizizz-purple text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
         >
           Play & Learn
         </button>
         <button 
           onClick={() => setActiveTab('library')}
           className={`px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 ${activeTab === 'library' ? 'bg-quizizz-purple text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
         >
           <BookOpen size={16} /> Library
         </button>
         <button 
           onClick={() => setActiveTab('import')}
           className={`px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 ${activeTab === 'import' ? 'bg-quizizz-purple text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
         >
           <Database size={16} /> Data
         </button>
      </div>
    </div>
  );
};
