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
        meaning: parts[4] || '',
        example: parts[5] || '',
        exampleMeaning: parts[6] || ''
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