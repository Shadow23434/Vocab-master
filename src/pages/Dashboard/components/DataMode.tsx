import React, { useState, useEffect } from 'react';
import { VocabItem, DataSource, ProgressExport, ProgressState } from '../../../types';
import { Download, FileText, Database, Upload, Trash2, CheckCircle, X, Edit2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { parseCSV } from '../../../utils/csvParser';
import { generateCSV, generateJSON, generateTXT, downloadFile } from '../../../utils/exportUtils';

interface DataModeProps {
  data: VocabItem[];
  dataSources: DataSource[];
  onImport: (sourceId: string, items: VocabItem[], newSourceName?: string) => void;
  onClearData: (sourceId?: string) => void;
  onRenameSource: (sourceId: string, newName: string) => void;
  progress: ProgressState;
  onProgressImport: (progress: ProgressState, mode: 'merge' | 'replace') => void;
  onImportSuccess: () => void;
}

export const DataMode: React.FC<DataModeProps> = ({ data, dataSources, onImport, onClearData, onRenameSource, progress, onProgressImport, onImportSuccess }) => {
  const [importText, setImportText] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState<string>(dataSources[0]?.id || 'new');
  const [newSourceName, setNewSourceName] = useState('');
  const [importFormat, setImportFormat] = useState<'csv' | 'json' | 'txt'>('csv');
  const [isDragging, setIsDragging] = useState(false);
  const [progressImportText, setProgressImportText] = useState('');
  const [isProgressDragging, setIsProgressDragging] = useState(false);
  const [pendingProgressImport, setPendingProgressImport] = useState<ProgressState | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Update selected source if dataSources changes
  useEffect(() => {
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

  const processProgressFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      toast.error('Progress backup must be a JSON file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProgressImportText(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleProgressFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processProgressFile(file);
  };

  const handleProgressDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsProgressDragging(true);
  };

  const handleProgressDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsProgressDragging(false);
  };

  const handleProgressDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsProgressDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processProgressFile(file);
  };

  const validateProgressRecord = (value: unknown, label: string): Record<string, number> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`${label} progress must be an object.`);
    }

    const result: Record<string, number> = {};
    Object.entries(value).forEach(([setId, rawValue]) => {
      if (typeof rawValue !== 'number' || !Number.isFinite(rawValue) || rawValue < 0 || rawValue > 100) {
        throw new Error(`${label} progress for "${setId}" must be a number from 0 to 100.`);
      }
      result[setId] = Math.round(rawValue);
    });

    return result;
  };

  const parseProgressImport = (text: string): ProgressState => {
    const parsed = JSON.parse(text);
    const rawProgress = parsed.progress || parsed;

    return {
      quiz: validateProgressRecord(rawProgress.quiz || {}, 'Quiz'),
      flashcard: validateProgressRecord(rawProgress.flashcard || {}, 'Flashcard')
    };
  };

  const handleProgressExport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const exportData: ProgressExport = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      app: 'VocabMaster',
      progress
    };

    downloadFile(
      JSON.stringify(exportData, null, 2),
      `vocabmaster-progress-${timestamp}.json`,
      'application/json'
    );
  };

  const handleProgressImportClick = () => {
    if (!progressImportText.trim()) return;

    try {
      setPendingProgressImport(parseProgressImport(progressImportText));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to import progress. Please check the JSON format.');
    }
  };

  const completeProgressImport = (mode: 'merge' | 'replace') => {
    if (!pendingProgressImport) return;

    const quizCount = Object.keys(pendingProgressImport.quiz).length;
    const flashcardCount = Object.keys(pendingProgressImport.flashcard).length;
    onProgressImport(pendingProgressImport, mode);
    setPendingProgressImport(null);
    setProgressImportText('');
    toast.success(`Imported ${quizCount} quiz records and ${flashcardCount} flashcard records.`);
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
      onImportSuccess();
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

  const quizProgressCount = Object.keys(progress.quiz).length;
  const flashcardProgressCount = Object.keys(progress.flashcard).length;
  const pendingQuizProgressCount = pendingProgressImport ? Object.keys(pendingProgressImport.quiz).length : 0;
  const pendingFlashcardProgressCount = pendingProgressImport ? Object.keys(pendingProgressImport.flashcard).length : 0;

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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {pendingProgressImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Import learning progress?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Found {pendingQuizProgressCount} quiz records and {pendingFlashcardProgressCount} flashcard records. Choose how to apply them.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => completeProgressImport('merge')}
                className="w-full py-3 bg-quizizz-blue text-white rounded-xl font-bold hover:bg-blue-700 transition"
              >
                Merge and Keep Highest
              </button>
              <button
                onClick={() => completeProgressImport('replace')}
                className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition"
              >
                Replace Existing Progress
              </button>
              <button
                onClick={() => setPendingProgressImport(null)}
                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
             disabled={!importText.trim()}
             className="w-full py-4 bg-quizizz-purple text-white rounded-xl font-bold shadow-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
           >
             <Upload size={20} /> Import Data
           </button>
         </div>
      </div>

      {/* Progress Backup Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-xl border border-gray-100 dark:border-gray-700">
         <div className="flex items-center gap-4 mb-6">
           <div className="inline-flex justify-center items-center w-12 h-12 bg-blue-100 rounded-full text-quizizz-blue">
              <Database size={24} />
           </div>
           <div>
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Learning Progress Backup</h2>
             <p className="text-gray-500 dark:text-gray-400 text-sm">Download or restore quiz and flashcard progress stored in this browser.</p>
           </div>
         </div>

         <div className="space-y-6">
           <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
             <div>
               <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Current progress</p>
               <p className="text-xs text-gray-400 mt-1">{quizProgressCount} quiz records, {flashcardProgressCount} flashcard records</p>
             </div>
             <button
               onClick={handleProgressExport}
               className="py-3 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-200 transition flex items-center justify-center gap-2"
             >
               <Download size={18} /> Download Progress
             </button>
           </div>

           <div>
             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Restore Progress JSON</label>
             <div
                className={`mb-4 p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition cursor-pointer group ${
                    isProgressDragging
                    ? 'border-quizizz-purple bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
                onClick={() => document.getElementById('progress-file-upload')?.click()}
                onDragOver={handleProgressDragOver}
                onDragLeave={handleProgressDragLeave}
                onDrop={handleProgressDrop}
             >
                <input
                    type="file"
                    id="progress-file-upload"
                    className="hidden"
                    accept=".json"
                    onChange={handleProgressFileUpload}
                />
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition">
                    <Upload size={24} className="text-gray-400 dark:text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">Supports progress backup .json files</p>
             </div>

             <textarea
               value={progressImportText}
               onChange={(e) => setProgressImportText(e.target.value)}
               className="w-full h-40 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-quizizz-purple focus:outline-none transition font-mono text-sm"
               placeholder={`{\n  "progress": {\n    "quiz": {},\n    "flashcard": {}\n  }\n}`}
             />
             <p className="text-xs text-gray-400 mt-2">Import can merge with existing progress or replace it completely.</p>
           </div>

           <button
             onClick={handleProgressImportClick}
             disabled={!progressImportText.trim()}
             className="w-full py-4 bg-quizizz-blue text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
           >
             <Upload size={20} /> Import Progress
           </button>
         </div>
      </div>
    </div>
  );
};
