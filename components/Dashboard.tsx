
import React, { useState, useMemo } from 'react';
import { VocabItem, AppMode, ProgressState, DataSource } from '../types';
import { Play, Layers, Database, FileText, Upload, CheckCircle, Search, BookOpen, Volume2, Star, Shuffle, Moon, Sun, Download, Trash2, Plus, X, Edit2, RefreshCw, ArrowLeft } from 'lucide-react';
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
  initialSearchTerm?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ data, dataSources, progress, onStartSession, onImport, onClearData, onRenameSource, returnToMode, isDarkMode, toggleDarkMode, initialSearchTerm }) => {
  const [importText, setImportText] = useState('');
  const [activeTab, setActiveTab] = useState<'play' | 'library' | 'import'>(initialSearchTerm ? 'library' : 'play');
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
  
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
  const [filterSourceId, setFilterSourceId] = useState<string>('all');
  const [showSourcesGrid, setShowSourcesGrid] = useState(true);

  // Pagination State
  const [libraryPage, setLibraryPage] = useState(1);
  const [setupPage, setSetupPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const SETS_PER_PAGE = 12;

  // Auto-open set selector when returning from quiz/flashcard
  React.useEffect(() => {
    if (returnToMode) {
      setSelectionMode(returnToMode);
    }
  }, [returnToMode]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setLibraryPage(1);
  }, [searchTerm]);

  React.useEffect(() => {
    setSetupPage(1);
  }, [filterSourceId, chunkSize]);

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
        const rawParsed = JSON.parse(importText);
        // Basic validation
        if (!Array.isArray(rawParsed)) throw new Error("JSON must be an array");

        // Check if it's a list of topics (like topics.json) or a flat list of words
        if (rawParsed.length > 0 && 'words' in rawParsed[0] && Array.isArray(rawParsed[0].words)) {
            // Flatten topics into a single list of words
            parsed = rawParsed.flatMap((topic: any) => topic.words);
        } else {
            parsed = rawParsed;
        }
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
      
      // Assign unique IDs to avoid collisions
      const timestamp = Date.now();
      const newItems: VocabItem[] = parsed.map((item, idx) => ({
        ...item,
        // Always generate a new ID for imported items to prevent collisions with existing data
        id: `imported-${timestamp}-${idx}`
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

    // Group sources
    const topicSources = dataSources.filter(s => s.id.startsWith('topic-'));
    const otherSources = dataSources.filter(s => !s.id.startsWith('topic-'));

    // Determine sets based on filter
    let sets: { startIndex: number; endIndex: number; id: string; progressVal: number; title?: string; itemCount?: number; sourceId?: string; imageUrl?: string }[] = [];
    
    if (filterSourceId === 'topics') {
        const toeicSource = topicSources.find(s => s.id === 'topic-toeic-600');
        
        if (toeicSource) {
            const groups: Record<string, { items: VocabItem[], thumbnail?: string }> = {};
            
            toeicSource.items.forEach(item => {
                const t = item.topic || 'Unknown';
                if (!groups[t]) {
                    groups[t] = { items: [], thumbnail: item.topicThumbnail || item.imageUrl };
                }
                groups[t].items.push(item);
            });

            sets = Object.entries(groups).map(([topicName, group]) => {
                const setId = `topic-set-${topicName.replace(/\s+/g, '-').toLowerCase()}`;
                let progressVal = 0;
                if (selectionMode === AppMode.QUIZ) {
                    progressVal = progress.quiz[setId] || 0;
                } else {
                    progressVal = progress.flashcard[setId] || 0;
                }
                
                return {
                    startIndex: 0,
                    endIndex: group.items.length,
                    id: setId,
                    progressVal,
                    title: topicName,
                    itemCount: group.items.length,
                    sourceId: toeicSource.id,
                    imageUrl: group.thumbnail
                };
            });
        } else {
            sets = topicSources.map(topic => {
                let progressVal = 0;
                if (selectionMode === AppMode.QUIZ) {
                    progressVal = progress.quiz[topic.id] || 0;
                } else {
                    progressVal = progress.flashcard[topic.id] || 0;
                }
                return {
                    startIndex: 0,
                    endIndex: topic.items.length,
                    id: topic.id,
                    progressVal,
                    title: topic.name,
                    itemCount: topic.items.length,
                    sourceId: topic.id,
                    imageUrl: topic.thumbnail
                };
            });
        }
    } else {
        const filteredDataForSets = filterSourceId === 'all' 
            ? data 
            : dataSources.find(s => s.id === filterSourceId)?.items || [];

        const totalItems = filteredDataForSets.length;
        const size = chunkSize === -1 ? totalItems : chunkSize;

        for (let i = 0; i < totalItems; i += size) {
            const end = Math.min(i + size, totalItems);
            const firstVocabId = filteredDataForSets[i]?.id || String(i);
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
                progressVal,
                itemCount: end - i
            });
        }
    }

    // Pagination Logic
    const totalSetPages = Math.ceil(sets.length / SETS_PER_PAGE);
    const paginatedSets = sets.slice((setupPage - 1) * SETS_PER_PAGE, setupPage * SETS_PER_PAGE);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-in fade-in duration-200">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-gray-800 dark:text-white">
                {selectionMode === AppMode.QUIZ ? 'Quiz Setup' : 'Flashcard Setup'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold mt-1">Select a question set to begin</p>
            </div>
            <button 
              onClick={() => {
                  setSelectionMode(null);
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-bold transition flex items-center gap-2"
            >
              <ArrowLeft size={18} /> Back
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-4">
            {/* Controls */}
            <div className="bg-gray-800 text-white rounded-2xl p-6 shadow-lg mb-8">
                <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
                    {/* Source Selection */}
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Source</label>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setFilterSourceId('all')}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                                    filterSourceId === 'all' 
                                    ? 'bg-quizizz-purple text-white shadow-lg' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                All Sources
                            </button>
                            
                            {topicSources.length > 0 && (
                                <button
                                    onClick={() => setFilterSourceId('topics')}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                                        filterSourceId === 'topics' 
                                        ? 'bg-quizizz-purple text-white shadow-lg' 
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Topics
                                </button>
                            )}

                            {otherSources.map(source => (
                                <button
                                    key={source.id}
                                    onClick={() => setFilterSourceId(source.id)}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                                        filterSourceId === source.id 
                                        ? 'bg-quizizz-purple text-white shadow-lg' 
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {source.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Questions Per Set Selection */}
                    {filterSourceId !== 'topics' && (
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Questions per Set</label>
                            <div className="flex gap-2">
                                {[10, 20, -1].map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setChunkSize(size)}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                                    chunkSize === size 
                                        ? 'bg-quizizz-purple text-white shadow-lg' 
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {size === -1 ? 'All Words' : size}
                                </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedSets.map((set, idx) => {
                const actualIdx = (setupPage - 1) * SETS_PER_PAGE + idx;
                const isCompleted = set.progressVal === 100;
                const isInProgress = set.progressVal > 0 && set.progressVal < 100;
                const isShuffled = shuffledSets.has(set.id);
                
                return (
                    <div
                    key={set.id}
                    className={`relative group bg-white dark:bg-gray-800 p-0 rounded-2xl border-2 text-left transition-all hover:-translate-y-1 hover:shadow-xl overflow-hidden flex flex-col ${
                        isCompleted ? 'border-quizizz-green' : (isInProgress ? 'border-quizizz-yellow' : 'border-gray-200 dark:border-gray-700 hover:border-quizizz-blue')
                    }`}
                    >
                    {set.imageUrl && (
                        <div className="h-36 w-full overflow-hidden bg-gray-100 dark:bg-gray-900 relative shrink-0">
                            <img src={set.imageUrl} alt={set.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-40"></div>
                        </div>
                    )}
                    
                    <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg shadow-sm ${
                            isCompleted ? 'bg-green-100 text-quizizz-green' : (isInProgress ? 'bg-yellow-100 text-yellow-600' : 'bg-white dark:bg-gray-700 text-quizizz-blue dark:text-white border border-gray-100 dark:border-gray-600')
                            }`}>
                            {actualIdx + 1}
                            </div>
                            
                            <div className="flex items-center gap-2">
                            {set.progressVal > 0 && (
                                <div className={`flex items-center gap-1 font-bold text-xs ${isCompleted ? 'text-quizizz-green' : 'text-yellow-600'}`}>
                                    <span>{set.progressVal}%</span>
                                </div>
                            )}
                            <button
                                onClick={(e) => toggleShuffle(set.id, e)}
                                className={`p-2 rounded-lg transition-all ${isShuffled ? 'bg-quizizz-purple text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                title={isShuffled ? 'Shuffle enabled' : 'Shuffle question order'}
                            >
                                <Shuffle size={18} />
                            </button>
                            </div>
                        </div>
                        
                        <div className="mb-4">
                            <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1 line-clamp-1" title={set.title || `Set ${actualIdx + 1}`}>
                                {set.title || `Set ${actualIdx + 1}`}
                            </h3>
                            <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wide">
                                {set.itemCount} words
                            </p>
                        </div>

                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-5 mt-auto">
                            <div 
                            className={`h-full ${isCompleted ? 'bg-quizizz-green' : 'bg-quizizz-yellow'}`} 
                            style={{ width: `${set.progressVal}%` }}
                            ></div>
                        </div>
                        
                        <button
                            onClick={() => {
                                let subset: VocabItem[] = [];
                                if (filterSourceId === 'topics') {
                                    if (set.id.startsWith('topic-set-')) {
                                        const topicSource = dataSources.find(s => s.id === 'topic-toeic-600');
                                        if (topicSource) {
                                            subset = topicSource.items.filter(item => item.topic === set.title);
                                        }
                                    } else {
                                        const topicSource = dataSources.find(s => s.id === set.id);
                                        subset = topicSource ? topicSource.items : [];
                                    }
                                } else {
                                    const filteredDataForSets = filterSourceId === 'all' 
                                        ? data 
                                        : dataSources.find(s => s.id === filterSourceId)?.items || [];
                                    subset = filteredDataForSets.slice(set.startIndex, set.endIndex);
                                }
                                onStartSession(subset, selectionMode!, set.id, isShuffled);
                            }}
                            className="w-full py-3 bg-quizizz-purple text-white rounded-xl font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-200 dark:shadow-none"
                        >
                            <Play size={18} /> Start
                        </button>
                    </div>
                    </div>
                );
                })}
            </div>

          {/* Pagination Controls */}
          {totalSetPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <button
                onClick={() => setSetupPage(p => Math.max(1, p - 1))}
                disabled={setupPage === 1}
                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Previous
              </button>
              <span className="text-gray-600 dark:text-gray-400 font-bold">
                Page {setupPage} of {totalSetPages}
              </span>
              <button
                onClick={() => setSetupPage(p => Math.min(totalSetPages, p + 1))}
                disabled={setupPage === totalSetPages}
                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Next
              </button>
            </div>
          )}
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

  const totalLibraryPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedLibraryItems = filteredData.slice((libraryPage - 1) * ITEMS_PER_PAGE, libraryPage * ITEMS_PER_PAGE);

  if (selectionMode) {
    return renderSetSelector();
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 relative">
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
