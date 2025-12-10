
export interface VocabItem {
  id: string;
  word: string;
  type: string;
  phonetic: string;
  description: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  imageUrl?: string;
  topic?: string;
  topicThumbnail?: string;
}

export interface DataSource {
  id: string;
  name: string;
  items: VocabItem[];
  createdAt: number;
  thumbnail?: string;
}

export enum AppMode {
  HOME = 'HOME',
  FLASHCARD = 'FLASHCARD',
  QUIZ = 'QUIZ',
  GENERATOR = 'GENERATOR'
}

export interface QuizQuestion {
  target: VocabItem;
  options: VocabItem[]; // The correct answer + 3 distractors
}

export interface GeneratedContent {
  word: string;
  type: string;
  phonetic: string;
  description: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
}

export interface ProgressState {
  quiz: Record<string, number>;      // setId -> score (0-100)
  flashcard: Record<string, number>; // setId -> completion % (0-100)
}
