import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VocabItem, DataSource } from '../types';

interface SessionGuardProps {
  dataSources: DataSource[];
  allVocab: VocabItem[];
  children: (data: VocabItem[], setId: string) => React.ReactNode;
}

export const SessionGuard: React.FC<SessionGuardProps> = ({ dataSources, allVocab, children }) => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState<VocabItem[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!setId) {
        setIsChecking(false);
        return;
    }

    // If dataSources is empty (initial load), wait.
    if (dataSources.length === 0) {
        return;
    }

    let foundData: VocabItem[] = [];

    // 1. Try matching a full source ID
    const source = dataSources.find(s => s.id === setId);
    if (source) {
      foundData = source.items;
    } 
    // 2. Try matching a topic set (topic-set-{slug})
    else if (setId.startsWith('topic-set-')) {
       const slug = setId.replace('topic-set-', '');
       const toeicSource = dataSources.find(s => s.id === 'topic-toeic-600');
       if (toeicSource) {
          foundData = toeicSource.items.filter(item => {
             const itemSlug = (item.topic || 'Unknown').replace(/\s+/g, '-').toLowerCase();
             return itemSlug === slug;
          });
       }
    }
    // 3. Try matching a chunk set (set-{id}-{size})
    else if (setId.startsWith('set-')) {
        const parts = setId.split('-');
        // set-{id}-{size}
        // The id might contain hyphens, so we take the last part as size
        const sizeStr = parts[parts.length - 1];
        const size = parseInt(sizeStr, 10);
        
        if (!isNaN(size)) {
            // The ID is everything between "set-" and "-{size}"
            const startId = setId.substring(4, setId.lastIndexOf('-'));
            
            // Find index in allVocab
            const startIndex = allVocab.findIndex(item => String(item.id) === startId);
            if (startIndex !== -1) {
                foundData = allVocab.slice(startIndex, startIndex + size);
            }
        }
    }

    if (foundData.length > 0) {
      setSessionData(foundData);
      setIsValid(true);
    } else {
      console.warn(`Set ${setId} not found, redirecting to home`);
      navigate('/', { replace: true });
    }
    setIsChecking(false);

  }, [setId, dataSources, allVocab, navigate]);

  if (isChecking || (isValid && sessionData.length === 0)) {
    return (
        <div className="flex h-screen items-center justify-center bg-[#f2f2f2] dark:bg-gray-900">
            <div className="animate-pulse text-gray-500 font-bold">Loading session...</div>
        </div>
    );
  }

  if (!isValid) return null;

  return <>{children(sessionData, setId!)}</>;
};
