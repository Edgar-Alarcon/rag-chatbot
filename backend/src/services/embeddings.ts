import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

const ai = new GoogleGenAI({ apiKey: config.googleApiKey });

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];

  for (const text of texts) {
    const response = await ai.models.embedContent({
      model: config.embeddingModel,
      contents: text,
    });

    if (response.embeddings && response.embeddings.length > 0) {
      results.push(response.embeddings[0].values!);
    }
  }

  return results;
}

export async function embedQuery(text: string): Promise<number[]> {
  const vectors = await embedTexts([text]);
  return vectors[0];
}
