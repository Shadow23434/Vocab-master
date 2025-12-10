import React, { useState, useEffect } from 'react';
import { VocabItem, DataSource } from '../../../types';
import { Download, FileText, Database, Upload, Trash2, CheckCircle, X, Edit2, Plus } from 'lucide-react';
import { parseCSV } from '../../../utils/csvParser';
import { generateCSV, generateJSON, generateTXT, downloadFile } from '../../../utils/exportUtils';

interface DataModeProps {
  data: VocabItem[];
  dataSources: DataSource[];
  onImport: (sourceId: string, items: VocabItem[], newSourceName?: string) => void;
  onClearData: (sourceId?: string) => void;
  onRenameSource: (sourceId: string, newName: string) => void;
  onImportSuccess: () => void;
}

export const DataMode: React.FC<DataModeProps> = ({ data, dataSources, onImport, onClearData, onRenameSource, onImportSuccess }) => {
  const [importText, setImportText] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState<string>(dataSources[0]?.id || 'new');
  const [newSourceName, setNewSourceName] = useState('');
  const [importFormat, setImportFormat] = useState<'csv' | 'json' | 'txt'>('csv');
  const [isDragging, setIsDragging] = useState(false);
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
    </div>
  );
};
