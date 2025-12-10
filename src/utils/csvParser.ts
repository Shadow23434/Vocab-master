import { VocabItem } from '../types';

export const parseCSV = (csvText: string): VocabItem[] => {
  const lines = csvText.trim().split('\n');
  const result: VocabItem[] = [];

  // Skip header (index 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Regex to split by comma, ignoring commas inside double quotes
    // Matches a comma if it's followed by an even number of quotes (or 0) until the end of the line
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    const parts = line.split(regex).map(part => {
        // Remove surrounding quotes if they exist
        return part.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
    });

    if (parts.length >= 2) {
      result.push({
        id: parts[0] || String(i),
        word: parts[1] || '',
        type: parts[2] || '',
        phonetic: parts[3] || '',
        description: parts[4] || '',
        meaning: parts[5] || '',
        example: parts[6] || '',
        exampleMeaning: parts[7] || ''
      });
    }
  }

  return result;
};

export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Seeded random number generator (mulberry32)
const seededRandom = (seed: number): (() => number) => {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

// Convert string to numeric seed
const stringToSeed = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Shuffle array with a seed (deterministic)
export const seededShuffleArray = <T,>(array: T[], seed: string): T[] => {
  const newArray = [...array];
  const random = seededRandom(stringToSeed(seed));
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};