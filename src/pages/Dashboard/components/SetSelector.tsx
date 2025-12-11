import React from 'react';
import { VocabItem, DataSource, ProgressState, AppMode } from '../../../types';
import { ArrowLeft, Shuffle, Play } from 'lucide-react';

interface SetSelectorProps {
  data: VocabItem[];
  dataSources: DataSource[];
  progress: ProgressState;
  selectionMode: AppMode;
  setSelectionMode: (mode: AppMode | null) => void;
  onStartSession: (items: VocabItem[], mode: AppMode, setId: string | null, shuffle?: boolean) => void;
  setupState: {
    chunkSize: number;
    shuffledSets: Set<string>;
    filterSourceId: string;
    setupPage: number;
  };
  setSetupState: React.Dispatch<React.SetStateAction<{
    chunkSize: number;
    shuffledSets: Set<string>;
    filterSourceId: string;
    setupPage: number;
  }>>;
}

export const SetSelector: React.FC<SetSelectorProps> = ({ data, dataSources, progress, selectionMode, setSelectionMode, onStartSession, setupState, setSetupState }) => {
  const { chunkSize, shuffledSets, filterSourceId, setupPage } = setupState;
  const SETS_PER_PAGE = 12;

  const setChunkSize = (size: number) => setSetupState(prev => ({ ...prev, chunkSize: size, setupPage: 1 }));
  const setFilterSourceId = (id: string) => setSetupState(prev => ({ ...prev, filterSourceId: id, setupPage: 1 }));
  const setSetupPage = (page: number | ((prev: number) => number)) => {
      setSetupState(prev => {
          const newPage = typeof page === 'function' ? page(prev.setupPage) : page;
          return { ...prev, setupPage: newPage };
      });
  };

  const toggleShuffle = (setId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling to set card
    setSetupState(prev => {
      const newSet = new Set(prev.shuffledSets);
      if (newSet.has(setId)) {
        newSet.delete(setId);
      } else {
        newSet.add(setId);
      }
      return { ...prev, shuffledSets: newSet };
    });
  };

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
          <div className="bg-white/80 dark:bg-gray-800 text-white rounded-2xl p-6 shadow-lg mb-8">
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
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
