import topicsData from '../data/topics-local.json';
import { DataSource } from '../types';

interface RawTopicWord {
    id: string;
    imageUrl: string;
    word: string;
    type: string;
    phonetic: string;
    meaning: string;
    example: string;
    exampleMeaning: string;
}

interface RawTopic {
    title: string;
    thumbnail: string;
    words: RawTopicWord[];
}

export const loadTopics = (): DataSource[] => {
    const topics = topicsData as RawTopic[];
    
    const allWords = topics.flatMap(topic => 
        topic.words.map(w => ({
            id: w.id,
            word: w.word,
            type: w.type,
            phonetic: w.phonetic,
            description: '', 
            meaning: w.meaning,
            example: w.example,
            exampleMeaning: w.exampleMeaning,
            imageUrl: w.imageUrl,
            topic: topic.title,
            topicThumbnail: topic.thumbnail
        }))
    );

    return [{
        id: 'topic-toeic-600',
        name: '600 Essential Words For TOEIC',
        thumbnail: topics[0]?.thumbnail,
        createdAt: Date.now(),
        items: allWords
    }];
};
