import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent } from "../types";

export const generateVocabulary = async (topic: string): Promise<GeneratedContent[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 5 vocabulary flashcards related to the topic: "${topic}". 
      Each item must include word, type (n, v, adj, etc), phonetic, meaning (in Vietnamese), example sentence (English), and example meaning (Vietnamese).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              type: { type: Type.STRING },
              phonetic: { type: Type.STRING },
              meaning: { type: Type.STRING },
              example: { type: Type.STRING },
              exampleMeaning: { type: Type.STRING }
            },
            required: ["word", "type", "phonetic", "meaning", "example", "exampleMeaning"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedContent[];
    }
    return [];
  } catch (error) {
    console.error("Error generating vocabulary:", error);
    throw error;
  }
};