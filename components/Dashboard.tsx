
import React, { useState, useMemo } from 'react';
import { VocabItem, AppMode, ProgressState, DataSource } from '../types';
import { Play, Layers, Database, FileText, Upload, CheckCircle, Search, BookOpen, Volume2, Star, Shuffle, Moon, Sun, Download, Trash2, Plus, X, Edit2, RefreshCw } from 'lucide-react';
import { parseCSV } from '../utils/csvParser';
import { generateCSV, generateJSON, generateTXT, downloadFile } from '../utils/exportUtils';
import { getTypeStyle } from '../utils/styleUtils';

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
}

const Dashboard: React.FC<DashboardProps> = ({ data, dataSources, progress, onStartSession, onImport, onClearData, onRenameSource, returnToMode, isDarkMode, toggleDarkMode }) => {
  const [importText, setImportText] = useState('');
  const [activeTab, setActiveTab] = useState<'play' | 'library' | 'import'>('play');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Import State
  const [selectedSourceId, setSelectedSourceId] = useState<string>(dataSources[0]?.id || 'new');
  const [newSourceName, setNewSourceName] = useState('');
  const [importFormat, setImportFormat] = useState<'csv' | 'json' | 'txt'>('csv');
  const [isDragging, setIsDragging] = useState(false);

  // Rename State
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Selection State
  const [selectionMode, setSelectionMode] = useState<AppMode | null>(returnToMode || null);
  const [chunkSize, setChunkSize] = useState<number>(10);
  const [shuffledSets, setShuffledSets] = useState<Set<string>>(new Set());

  // Auto-open set selector when returning from quiz/flashcard
  React.useEffect(() => {
    if (returnToMode) {
      setSelectionMode(returnToMode);
    }
  }, [returnToMode]);

  // Update selected source if dataSources changes
  React.useEffect(() => {
    if (dataSources.length > 0 && !dataSources.find(s => s.id === selectedSourceId) && selectedSourceId !== 'new') {
        setSelectedSourceId(dataSources[0].id);
    }
  }, [dataSources, selectedSourceId]);

  const processFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') setImportFormat('csv');
    else if (extension === 'json') setImportFormat('json');
    else if (extension === 'txt') setImportFormat('txt');

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImportText(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleImportClick = () => {
    if (!importText.trim()) return;
    
    if (selectedSourceId === 'new' && !newSourceName.trim()) {
        alert("Please enter a name for the new data source.");
        return;
    }

    try {
      let parsed: VocabItem[] = [];

      if (importFormat === 'csv') {
        parsed = parseCSV(importText);
      } else if (importFormat === 'json') {
        parsed = JSON.parse(importText);
        // Basic validation
        if (!Array.isArray(parsed)) throw new Error("JSON must be an array");
      } else if (importFormat === 'txt') {
        // Simple TXT parser: assumes blocks separated by empty lines
        // Format: Word: ... \n Phonetic: ... etc.
        // This is a basic implementation, might need refinement based on exact TXT format
        const blocks = importText.split('-------------------').map(b => b.trim()).filter(b => b);
        parsed = blocks.map((block, idx) => {
            const lines = block.split('\n');
            const getVal = (key: string) => {
                const line = lines.find(l => l.startsWith(key));
                return line ? line.substring(key.length).trim() : '';
            };
            
            // Extract word and type from "Word: word (type)"
            const wordLine = getVal('Word:');
            let word = wordLine;
            let type = '';
            const typeMatch = wordLine.match(/(.*)\s\((.*)\)$/);
            if (typeMatch) {
                word = typeMatch[1];
                type = typeMatch[2];
            }

            return {
                id: `txt-${Date.now()}-${idx}`,
                word: word,
                type: type,
                phonetic: getVal('Phonetic:'),
                description: getVal('Description:'),
                meaning: getVal('Meaning:'),
                example: getVal('Example:'),
                exampleMeaning: getVal('Example Meaning:')
            };
        });
      }

      if (parsed.length === 0) {
        alert("No valid vocabulary items found. Please ensure valid data format.");
        return;
      }
      
      // Assign unique IDs if missing or collision avoidance
      const newItems: VocabItem[] = parsed.map((item, idx) => ({
        ...item,
        id: item.id || `imported-${Date.now()}-${idx}`
      }));
      
      onImport(selectedSourceId, newItems, newSourceName);
      setImportText('');
      setNewSourceName('');
      alert(`Success! Imported ${newItems.length} new words.`);
      setActiveTab('play'); // Switch back to play mode to see new data
    } catch (e) {
      console.error(e);
      alert("Failed to parse data. Please check the format.");
    }
  };

  const startRenaming = (source: DataSource, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSourceId(source.id);
    setEditingName(source.name);
  };

  const saveRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingSourceId && editingName.trim()) {
        onRenameSource(editingSourceId, editingName.trim());
        setEditingSourceId(null);
        setEditingName('');
    }
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSourceId(null);
    setEditingName('');
  };

  const handleExport = (format: 'csv' | 'json' | 'txt') => {
    const timestamp = new Date().toISOString().split('T')[0];
    let content = '';
    let filename = `vocab-export-${timestamp}`;
    let type = '';

    switch (format) {
      case 'csv':
        content = generateCSV(data);
        filename += '.csv';
        type = 'text/csv';
        break;
      case 'json':
        content = generateJSON(data);
        filename += '.json';
        type = 'application/json';
        break;
      case 'txt':
        content = generateTXT(data);
        filename += '.txt';
        type = 'text/plain';
        break;
    }
    
    downloadFile(content, filename, type);
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const toggleShuffle = (setId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling to set card
    setShuffledSets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(setId)) {
        newSet.delete(setId);
      } else {
        newSet.add(setId);
      }
      return newSet;
    });
  };

  const renderSetSelector = () => {
    if (!selectionMode) return null;

    const totalItems = data.length;
    const sets = [];
    const size = chunkSize === -1 ? totalItems : chunkSize;

    for (let i = 0; i < totalItems; i += size) {
      const end = Math.min(i + size, totalItems);
      // Use first vocab ID in the set to create stable setId
      // This ensures progress is not lost when new data is imported
      const firstVocabId = data[i]?.id || String(i);
      const setId = `set-${firstVocabId}-${size}`;
      
      let progressVal = 0;

      if (selectionMode === AppMode.QUIZ) {
        progressVal = progress.quiz[setId] || 0;
      } else {
        progressVal = progress.flashcard[setId] || 0;
      }
      
      sets.push({
        startIndex: i,
        endIndex: end,
        id: setId,
        progressVal
      });
    }

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
            <div>
              <h2 className="text-2xl font-black text-gray-800 dark:text-white">
                {selectionMode === AppMode.QUIZ ? 'Quiz Setup' : 'Flashcard Setup'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold mt-1">Select a question set to begin</p>
            </div>
            <button 
              onClick={() => setSelectionMode(null)}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-quizizz-purple font-semibold transition"
            >
              Close
            </button>
          </div>

          {/* Controls */}
          <div className="p-6 bg-white dark:bg-gray-800">
            <label className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">Questions per Set</label>
            <div className="flex gap-3 flex-wrap">
              {[10, 20, -1].map((size) => (
                <button
                  key={size}
                  onClick={() => setChunkSize(size)}
                  className={`px-6 py-2 rounded-lg font-bold border-2 transition ${
                    chunkSize === size 
                      ? 'bg-quizizz-purple text-white border-quizizz-purple shadow-md' 
                      : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-quizizz-purple'
                  }`}
                >
                  {size === -1 ? 'All Words' : size}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sets.map((set, idx) => {
                const isCompleted = set.progressVal === 100;
                const isInProgress = set.progressVal > 0 && set.progressVal < 100;
                const isShuffled = shuffledSets.has(set.id);
                
                return (
                  <div
                    key={set.id}
                    className={`relative group bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${
                      isCompleted ? 'border-quizizz-green' : (isInProgress ? 'border-quizizz-yellow' : 'border-gray-200 dark:border-gray-700 hover:border-quizizz-blue')
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                        isCompleted ? 'bg-green-100 text-quizizz-green' : (isInProgress ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-quizizz-blue')
                      }`}>
                        {idx + 1}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Shuffle Button */}
                        <button
                          onClick={(e) => toggleShuffle(set.id, e)}
                          className={`p-2 rounded-lg transition-all ${isShuffled ? 'bg-quizizz-purple text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-600 dark:hover:text-gray-300'}`}
                          title={isShuffled ? 'Shuffle enabled' : 'Shuffle question order'}
                        >
                          <Shuffle size={16} />
                        </button>
                        
                        {set.progressVal > 0 && (
                          <div className={`flex items-center gap-1 font-bold ${isCompleted ? 'text-quizizz-green' : 'text-yellow-600'}`}>
                            {selectionMode === AppMode.QUIZ ? (
                                <>
                                    <Star fill={isCompleted ? "#00b894" : "#fdcb6e"} className={isCompleted ? "text-quizizz-green" : "text-yellow-500"} size={16} />
                                    <span>{set.progressVal}%</span>
                                </>
                            ) : (
                                <>
                                    {isCompleted ? <CheckCircle size={16} /> : <BookOpen size={16} />}
                                    <span>{isCompleted ? 'Done' : `${set.progressVal}%`}</span>
                                </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">Set {idx + 1}</h3>
                    <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">
                      Words {set.startIndex + 1} - {set.endIndex}
                    </p>
                    {isShuffled && (
                      <p className="text-quizizz-purple text-xs font-bold mt-1 flex items-center gap-1">
                        <Shuffle size={12} /> Shuffled
                      </p>
                    )}

                    <div className="mt-4 w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isCompleted ? 'bg-quizizz-green' : 'bg-quizizz-yellow'}`} 
                        style={{ width: `${set.progressVal}%` }}
                      ></div>
                    </div>
                    
                    {/* Play Button */}
                    <button
                      onClick={() => {
                        const subset = data.slice(set.startIndex, set.endIndex);
                        onStartSession(subset, selectionMode!, set.id, isShuffled);
                      }}
                      className="mt-4 w-full py-2 bg-quizizz-purple text-white rounded-lg font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                    >
                      <Play size={16} /> Start
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    );
  };

  const renderEmptyState = () => (
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
            onClick={() => setActiveTab('import')}
            className="px-6 py-3 bg-quizizz-purple text-white rounded-xl font-bold shadow-lg hover:bg-purple-700 transition flex items-center gap-2"
        >
            <Upload size={20} /> Go to Import
        </button>
        <button 
            onClick={() => onClearData()}
            className="px-6 py-3 bg-white dark:bg-gray-800 text-quizizz-purple border-2 border-quizizz-purple rounded-xl font-bold shadow-sm hover:bg-purple-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
        >
            <RefreshCw size={20} /> Load Default Data
        </button>
      </div>
    </div>
  );

  const filteredData = useMemo(() => data.filter(item => 
    item.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  ), [data, searchTerm]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 relative">
      {renderSetSelector()}

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
              <span className="font-bold text-gray-700 dark:text-gray-200">{data.length} Words Loaded</span>
            </div>
        </div>
      </header>

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

      <div className={activeTab === 'play' ? 'block' : 'hidden'}>
        {data.length === 0 ? renderEmptyState() : (
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
              <span className="inline-block px-6 py-3 bg-quizizz-blue text-white rounded-full font-bold">Choose Set</span>
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
              <span className="inline-block px-6 py-3 bg-quizizz-green text-white rounded-full font-bold">Choose Set</span>
            </div>
          </div>
        </div>
        )}
      </div>

      <div className={activeTab === 'library' ? 'block' : 'hidden'}>
        {data.length === 0 ? renderEmptyState() : (
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
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
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
                      {item.type && (
                        <span className={`px-2 py-0.5 text-xs rounded font-mono font-bold lowercase border ${getTypeStyle(item.type)}`}>{item.type}</span>
                      )}
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
        </div>
        )}
      </div>

      <div className={activeTab === 'import' ? 'block' : 'hidden'}>
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Export Section */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-xl border border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-4 mb-6">
               <div className="inline-flex justify-center items-center w-12 h-12 bg-green-100 rounded-full text-green-600">
                  <Download size={24} />
               </div>
               <div>
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Export Data</h2>
                 <p className="text-gray-500 dark:text-gray-400 text-sm">Download your vocabulary list to backup or use elsewhere.</p>
               </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <button 
                 onClick={() => handleExport('csv')}
                 className="py-3 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-200 transition flex items-center justify-center gap-2"
               >
                 <FileText size={18} /> Export CSV
               </button>
               <button 
                 onClick={() => handleExport('json')}
                 className="py-3 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-200 transition flex items-center justify-center gap-2"
               >
                 <Database size={18} /> Export JSON
               </button>
               <button 
                 onClick={() => handleExport('txt')}
                 className="py-3 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-200 transition flex items-center justify-center gap-2"
               >
                 <FileText size={18} /> Export TXT
               </button>
             </div>
          </div>

          {/* Import Section */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-xl border border-gray-100 dark:border-gray-700">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="inline-flex justify-center items-center w-12 h-12 bg-purple-100 rounded-full text-quizizz-purple">
                        <Upload size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Import Data</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Add new words to your collection.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {selectedSourceId !== 'new' && (
                        <button 
                            onClick={() => onClearData(selectedSourceId)}
                            className="text-red-500 hover:text-red-700 font-bold text-sm flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            title={selectedSourceId === 'default' ? "Clear items from Default" : "Delete this source"}
                        >
                            <Trash2 size={16} /> {selectedSourceId === 'default' ? 'Clear Default' : 'Delete Source'}
                        </button>
                    )}
                    <button 
                        onClick={() => onClearData()}
                        className="text-red-500 hover:text-red-700 font-bold text-sm flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                        <Trash2 size={16} /> Clear All
                    </button>
                </div>
             </div>

             <div className="space-y-6">
               {/* Source Selection */}
               <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Destination Source</label>
                  <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2">
                        {dataSources.map(source => (
                            <button
                                key={source.id}
                                onClick={() => setSelectedSourceId(source.id)}
                                className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition flex items-center gap-2 ${
                                    selectedSourceId === source.id 
                                    ? 'bg-white dark:bg-gray-800 border-quizizz-purple text-quizizz-purple shadow-sm' 
                                    : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800'
                                }`}
                            >
                                <Database size={14} />
                                {editingSourceId === source.id ? (
                                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        <input 
                                            type="text" 
                                            value={editingName}
                                            onChange={e => setEditingName(e.target.value)}
                                            className="w-32 px-1 py-0.5 text-sm border rounded dark:bg-gray-700 dark:text-white"
                                            autoFocus
                                        />
                                        <span onClick={saveRename} className="cursor-pointer text-green-500 hover:text-green-700"><CheckCircle size={14}/></span>
                                        <span onClick={cancelRename} className="cursor-pointer text-red-500 hover:text-red-700"><X size={14}/></span>
                                    </div>
                                ) : (
                                    <>
                                        {source.name}
                                        <span className="ml-1 text-xs opacity-60">({source.items.length})</span>
                                        <span 
                                            onClick={(e) => startRenaming(source, e)}
                                            className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-quizizz-purple rounded-full"
                                            title="Rename Source"
                                        >
                                            <Edit2 size={12} />
                                        </span>
                                        {source.id !== 'default' && (
                                            <span 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(confirm(`Delete source "${source.name}"?`)) onClearData(source.id);
                                                }}
                                                className="ml-1 p-1 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-full"
                                                title="Delete Source"
                                            >
                                                <Trash2 size={12} />
                                            </span>
                                        )}
                                    </>
                                )}
                            </button>
                        ))}
                        <button
                            onClick={() => setSelectedSourceId('new')}
                            className={`px-4 py-2 rounded-lg font-bold text-sm border-2 border-dashed transition flex items-center gap-2 ${
                                selectedSourceId === 'new'
                                ? 'bg-white dark:bg-gray-800 border-quizizz-purple text-quizizz-purple shadow-sm'
                                : 'border-gray-300 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                            <Plus size={14} /> New Source
                        </button>
                      </div>
                      
                      {selectedSourceId === 'new' && (
                          <input
                            type="text"
                            value={newSourceName}
                            onChange={(e) => setNewSourceName(e.target.value)}
                            placeholder="Enter new source name..."
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-quizizz-purple focus:outline-none transition"
                          />
                      )}
                  </div>
               </div>

               <div>
                 <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Data Format</label>
                    <div className="flex gap-2">
                        {(['csv', 'json', 'txt'] as const).map(fmt => (
                            <button
                                key={fmt}
                                onClick={() => setImportFormat(fmt)}
                                className={`px-3 py-1 rounded text-xs font-bold uppercase transition ${
                                    importFormat === fmt 
                                    ? 'bg-quizizz-purple text-white' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                {fmt}
                            </button>
                        ))}
                    </div>
                 </div>

                 <div 
                    className={`mb-4 p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition cursor-pointer group ${
                        isDragging 
                        ? 'border-quizizz-purple bg-purple-50 dark:bg-purple-900/20' 
                        : 'border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                    onClick={() => document.getElementById('file-upload')?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                 >
                    <input 
                        type="file" 
                        id="file-upload" 
                        className="hidden" 
                        accept=".csv,.json,.txt"
                        onChange={handleFileUpload}
                    />
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition">
                        <Upload size={24} className="text-gray-400 dark:text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">Supports .csv, .json, .txt</p>
                 </div>

                 <textarea 
                   value={importText}
                   onChange={(e) => setImportText(e.target.value)}
                   className="w-full h-48 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-quizizz-purple focus:outline-none transition font-mono text-sm"
                   placeholder={
                       importFormat === 'csv' 
                       ? `id,word,type,phonetic,description,meaning,example,exampleMeaning\n1,wait in line,,,Wait for your turn,xếp hàng,Please wait in line.,Vui lòng xếp hàng.`
                       : importFormat === 'json'
                       ? `[\n  {\n    "word": "hello",\n    "meaning": "xin chào"\n  }\n]`
                       : `Word: hello (noun)\nPhonetic: /həˈləʊ/\nMeaning: xin chào\n-------------------`
                   }
                 />
                 <p className="text-xs text-gray-400 mt-2">
                   {importFormat === 'csv' && '* Ensure the first line is the header row: id,word,type,phonetic,description,meaning,example,exampleMeaning'}
                   {importFormat === 'json' && '* Paste a valid JSON array of objects.'}
                   {importFormat === 'txt' && '* Use the standard export format with "-------------------" separator.'}
                 </p>
               </div>
               <button 
                 onClick={handleImportClick}
                 disabled={!importText || (selectedSourceId === 'new' && !newSourceName)}
                 className="w-full py-4 bg-quizizz-purple text-white rounded-xl font-bold shadow-[0_4px_0_#6c5ce7] active:shadow-none active:translate-y-[4px] disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 transition flex justify-center items-center gap-2"
               >
                 <Upload size={20} />
                 Import Data
               </button>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
