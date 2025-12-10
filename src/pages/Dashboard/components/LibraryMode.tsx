import React, { useState, useMemo } from 'react';
import { VocabItem } from '../../../types';
import { Search, Volume2 } from 'lucide-react';
import { getTypeStyle } from '../../../utils/styleUtils';
import { EmptyState } from './EmptyState';

interface LibraryModeProps {
  data: VocabItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onNavigateToImport: () => void;
  onClearData: () => void;
}

export const LibraryMode: React.FC<LibraryModeProps> = ({ data, searchTerm, setSearchTerm, onNavigateToImport, onClearData }) => {
  const [libraryPage, setLibraryPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Reset pagination when filters change
  React.useEffect(() => {
    setLibraryPage(1);
  }, [searchTerm]);

  const filteredData = useMemo(() => data.filter(item => 
    item.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  ), [data, searchTerm]);

  const totalLibraryPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedLibraryItems = filteredData.slice((libraryPage - 1) * ITEMS_PER_PAGE, libraryPage * ITEMS_PER_PAGE);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (data.length === 0) {
    return <EmptyState onNavigateToImport={onNavigateToImport} onClearData={onClearData} />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 sticky top-4 z-20">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by word or meaning..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 dark:text-white border-transparent focus:bg-white dark:focus:bg-gray-600 focus:border-quizizz-purple border-2 rounded-xl outline-none transition font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {paginatedLibraryItems.length > 0 ? (
          paginatedLibraryItems.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">{item.word}</h3>
                  <button 
                     onClick={() => speak(item.word)}
                     className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-quizizz-purple transition"
                  >
                    <Volume2 size={18} />
                  </button>
                  {item.type && item.type.split(',').map((t, i) => (
                    <span key={i} className={`px-2 py-0.5 text-xs rounded font-mono font-bold lowercase border ${getTypeStyle(t.trim())}`}>{t.trim()}</span>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">{item.meaning}</p>
                {item.phonetic && <p className="text-gray-400 text-sm italic serif mt-1">/{item.phonetic.replace(/\//g, '')}/</p>}
                {item.description && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{item.description}</p>}
              </div>
              
              {item.example && (
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm text-gray-600 dark:text-gray-300 border-l-4 border-quizizz-purple max-w-md flex flex-col gap-1">
                  <div className="flex items-center gap-2 italic">
                     <span className="flex-1">"{item.example}"</span>
                     <button 
                        onClick={() => speak(item.example)}
                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-quizizz-purple transition flex-shrink-0"
                        title="Listen to example"
                     >
                       <Volume2 size={16} />
                     </button>
                  </div>
                  {item.exampleMeaning && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs not-italic">{item.exampleMeaning}</p>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-400">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">No words found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Library Pagination */}
      {totalLibraryPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pb-8">
          <button
            onClick={() => setLibraryPage(p => Math.max(1, p - 1))}
            disabled={libraryPage === 1}
            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Previous
          </button>
          <span className="text-gray-600 dark:text-gray-400 font-bold">
            Page {libraryPage} of {totalLibraryPages}
          </span>
          <button
            onClick={() => setLibraryPage(p => Math.min(totalLibraryPages, p + 1))}
            disabled={libraryPage === totalLibraryPages}
            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
