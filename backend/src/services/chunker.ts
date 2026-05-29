import { config } from '../config.js';

export interface Chunk {
  text: string;
  index: number;
}

export function chunkText(text: string): Chunk[] {
  const { chunkSize, chunkOverlap } = config;
  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastBreak = Math.max(
        slice.lastIndexOf('\n\n'),
        slice.lastIndexOf('. '),
        slice.lastIndexOf('.\n'),
      );
      if (lastBreak > chunkSize * 0.3) {
        end = start + lastBreak + 1;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push({ text: chunk, index });
      index++;
    }

    start = end - chunkOverlap;
    if (start >= text.length) break;
  }

  return chunks;
}
