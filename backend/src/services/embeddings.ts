import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

const ai = new GoogleGenAI({ apiKey: config.googleApiKey });

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const response = await ai.models.embedContent({
      model: config.embeddingModel,
      contents: batch.map(text => ({ parts: [{ text }] })),
    });

    if (response.embeddings) {
      for (const emb of response.embeddings) {
        results.push(emb.values!);
      }
    }
  }

  return results;
}

export async function embedQuery(text: string): Promise<number[]> {
  const vectors = await embedTexts([text]);
  return vectors[0];
}
