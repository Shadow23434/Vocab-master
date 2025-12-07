import { VocabItem } from '../types';

export const generateCSV = (data: VocabItem[]): string => {
  const header = ['id', 'word', 'type', 'phonetic', 'description', 'meaning', 'example', 'exampleMeaning'];
  const rows = data.map(item => [
    item.id,
    item.word,
    item.type,
    item.phonetic,
    item.description,
    item.meaning,
    item.example,
    item.exampleMeaning
  ].map(field => {
    // Escape quotes and wrap in quotes if necessary
    const stringField = String(field || '');
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  }));

  return [header.join(','), ...rows.map(r => r.join(','))].join('\n');
};

export const generateJSON = (data: VocabItem[]): string => {
  return JSON.stringify(data, null, 2);
};

export const generateTXT = (data: VocabItem[]): string => {
  return data.map(item => {
    return `ID: ${item.id}\nWord: ${item.word} (${item.type})\nPhonetic: ${item.phonetic}\nDescription: ${item.description}\nMeaning: ${item.meaning}\nExample: ${item.example}\nExample Meaning: ${item.exampleMeaning}\n-------------------`;
  }).join('\n\n');
};

export const downloadFile = (content: string, filename: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
