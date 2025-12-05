
import React, { useState } from 'react';
import { VocabItem, AppMode, ProgressState } from '../types';
import { Play, Layers, Database, FileText, Upload, CheckCircle, Search, BookOpen, Volume2, Star } from 'lucide-react';
import { parseCSV } from '../utils/csvParser';

interface DashboardProps {
  data: VocabItem[];
  progress: ProgressState;
  onStartSession: (items: VocabItem[], mode: AppMode, setId: string | null) => void;
  onAddGenerated: (items: VocabItem[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, progress, onStartSession, onAddGenerated }) => {
  const [importText, setImportText] = useState('');
  const [activeTab, setActiveTab] = useState<'play' | 'library' | 'import'>('play');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection State
  const [selectionMode, setSelectionMode] = useState<AppMode | null>(null);
  const [chunkSize, setChunkSize] = useState<number>(10);

  const handleImport = () => {
    if (!importText.trim()) return;
    try {
      const parsed = parseCSV(importText);
      if (parsed.length === 0) {
        alert("No valid vocabulary items found. Please ensure you include the header row and valid data.");
        return;
      }
      
      // Assign unique IDs to avoid collision with static data
      const newItems: VocabItem[] = parsed.map((item, idx) => ({
        ...item,
        id: `imported-${Date.now()}-${idx}`
      }));
      
      onAddGenerated(newItems);
      setImportText('');
      alert(`Success! Imported ${newItems.length} new words.`);
      setActiveTab('play'); // Switch back to play mode to see new data
    } catch (e) {
      alert("Failed to parse CSV data. Please check the format.");
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const getSetId = (startIndex: number, size: number) => `set-${startIndex}-${size}`;

  const renderSetSelector = () => {
    if (!selectionMode) return null;

    const totalItems = data.length;
    const sets = [];
    const size = chunkSize === -1 ? totalItems : chunkSize;

    for (let i = 0; i < totalItems; i += size) {
      const end = Math.min(i + size, totalItems);
      const setId = getSetId(i, size);
      
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
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div>
              <h2 className="text-2xl font-black text-gray-800">
                {selectionMode === AppMode.QUIZ ? 'Quiz Setup' : 'Flashcard Setup'}
              </h2>
              <p className="text-gray-500 text-sm font-bold mt-1">Select a question set to begin</p>
            </div>
            <button 
              onClick={() => setSelectionMode(null)}
              className="p-2 hover:bg-gray-200 rounded-full transition"
            >
              Close
            </button>
          </div>

          {/* Controls */}
          <div className="p-6 bg-white">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 block">Questions per Set</label>
            <div className="flex gap-3 flex-wrap">
              {[10, 20, -1].map((size) => (
                <button
                  key={size}
                  onClick={() => setChunkSize(size)}
                  className={`px-6 py-2 rounded-lg font-bold border-2 transition ${
                    chunkSize === size 
                      ? 'bg-quizizz-purple text-white border-quizizz-purple shadow-md' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-quizizz-purple'
                  }`}
                >
                  {size === -1 ? 'All Words' : size}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sets.map((set, idx) => {
                const isCompleted = set.progressVal === 100;
                const isInProgress = set.progressVal > 0 && set.progressVal < 100;
                
                return (
                  <button
                    key={set.id}
                    onClick={() => {
                      const subset = data.slice(set.startIndex, set.endIndex);
                      onStartSession(subset, selectionMode, set.id);
                    }}
                    className={`relative group bg-white p-6 rounded-2xl border-2 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${
                      isCompleted ? 'border-quizizz-green' : (isInProgress ? 'border-quizizz-yellow' : 'border-gray-200 hover:border-quizizz-blue')
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                        isCompleted ? 'bg-green-100 text-quizizz-green' : (isInProgress ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-quizizz-blue')
                      }`}>
                        {idx + 1}
                      </div>
                      
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
                    
                    <h3 className="font-bold text-gray-800 text-lg">Set {idx + 1}</h3>
                    <p className="text-gray-400 text-sm font-medium">
                      Words {set.startIndex + 1} - {set.endIndex}
                    </p>

                    <div className="mt-4 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isCompleted ? 'bg-quizizz-green' : 'bg-quizizz-yellow'}`} 
                        style={{ width: `${set.progressVal}%` }}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    );
  };

  const filteredData = data.filter(item => 
    item.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 relative">
      {renderSetSelector()}

      <header className="flex flex-col md:flex-row justify-between items-center mb-12">
        <div className="mb-4 md:mb-0">
            <h1 className="text-4xl font-black text-gray-800 tracking-tight">
              Vocab<span className="text-quizizz-purple">Master</span>
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Gamified learning for English Vocabulary</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-full shadow-sm border border-gray-200 flex items-center gap-3">
          <Database size={18} className="text-quizizz-blue" />
          <span className="font-bold text-gray-700">{data.length} Words Loaded</span>
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
             <Upload size={16} /> Import
           </button>
        </div>
      </div>

      {activeTab === 'play' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Flashcard Card */}
          <div 
            onClick={() => setSelectionMode(AppMode.FLASHCARD)}
            className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer border-b-[8px] border-b-quizizz-blue overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition duration-500">
              <Layers size={140} />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-quizizz-blue mb-6">
                <Layers size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Flashcards</h2>
              <p className="text-gray-500 mb-8">Study efficiently with flip cards. Review meanings, phonetics, and examples.</p>
              <span className="inline-block px-6 py-3 bg-quizizz-blue text-white rounded-full font-bold">Choose Set</span>
            </div>
          </div>

          {/* Quiz Card */}
          <div 
            onClick={() => setSelectionMode(AppMode.QUIZ)}
            className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer border-b-[8px] border-b-quizizz-green overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition duration-500">
              <Play size={140} />
            </div>
            <div className="relative z-10">
               <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-quizizz-green mb-6">
                <Play size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Take Quiz</h2>
              <p className="text-gray-500 mb-8">Test your knowledge with gamified multiple choice questions and earn points.</p>
              <span className="inline-block px-6 py-3 bg-quizizz-green text-white rounded-full font-bold">Choose Set</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 sticky top-4 z-20">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by word or meaning..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-quizizz-purple border-2 rounded-xl outline-none transition font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-gray-800">{item.word}</h3>
                      <button 
                         onClick={() => speak(item.word)}
                         className="p-1.5 rounded-full hover:bg-gray-100 text-quizizz-purple transition"
                      >
                        <Volume2 size={18} />
                      </button>
                      {item.type && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded font-mono font-bold uppercase">{item.type}</span>
                      )}
                    </div>
                    <p className="text-gray-600 font-medium">{item.meaning}</p>
                    {item.phonetic && <p className="text-gray-400 text-sm italic serif mt-1">/{item.phonetic.replace(/\//g, '')}/</p>}
                  </div>
                  
                  {item.example && (
                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 border-l-4 border-quizizz-purple max-w-md flex flex-col gap-1">
                      <div className="flex items-center gap-2 italic">
                         <span className="flex-1">"{item.example}"</span>
                         <button 
                            onClick={() => speak(item.example)}
                            className="p-1.5 rounded-full hover:bg-gray-200 text-quizizz-purple transition flex-shrink-0"
                            title="Listen to example"
                         >
                           <Volume2 size={16} />
                         </button>
                      </div>
                      {item.exampleMeaning && (
                        <p className="text-gray-500 text-xs not-italic">{item.exampleMeaning}</p>
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

      {activeTab === 'import' && (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
           <div className="text-center mb-8">
             <div className="inline-flex justify-center items-center w-16 h-16 bg-purple-100 rounded-full text-quizizz-purple mb-4">
                <FileText size={32} />
             </div>
             <h2 className="text-2xl font-bold text-gray-800">Import Vocabulary</h2>
             <p className="text-gray-500 mt-2">Paste your CSV data below to add custom words to your library.</p>
           </div>

           <div className="space-y-4">
             <div>
               <label className="block text-sm font-bold text-gray-700 mb-2">CSV Data (Paste here)</label>
               <textarea 
                 value={importText}
                 onChange={(e) => setImportText(e.target.value)}
                 className="w-full h-64 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-quizizz-purple focus:outline-none transition font-mono text-sm"
                 placeholder={`id,word,type,phonetic,meaning,example,exampleMeaning
1,wait in line,,,xếp hàng,Please wait in line.,Vui lòng xếp hàng.
2,wipe something off something,,,loại bỏ cái gì khỏi cái gì,The janitor had to wipe the dust off the counter.,Người gác cổng phải lau sạch bụi trên quầy.`}
               />
               <p className="text-xs text-gray-400 mt-2">
                 * Ensure the first line is the header row: id,word,type,phonetic,meaning,example,exampleMeaning
               </p>
             </div>
             <button 
               onClick={handleImport}
               disabled={!importText}
               className="w-full py-4 bg-quizizz-purple text-white rounded-xl font-bold shadow-[0_4px_0_#6c5ce7] active:shadow-none active:translate-y-[4px] disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 transition flex justify-center items-center gap-2"
             >
               <Upload size={20} />
               Import Data
             </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
