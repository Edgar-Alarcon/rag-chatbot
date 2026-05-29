import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config.js';
import { v4 as uuid } from 'uuid';

const client = new QdrantClient({ url: config.qdrantUrl, checkCompatibility: false });
const COLLECTION = config.qdrantCollection;

export async function ensureCollection() {
  const collections = await client.getCollections();
  const exists = collections.collections.some(c => c.name === COLLECTION);

  if (exists) {
    const info = await client.getCollection(COLLECTION);
    const currentSize = typeof info.config.params.vectors === 'object' && 'size' in info.config.params.vectors
      ? info.config.params.vectors.size
      : 0;
    if (currentSize !== config.embeddingDimensions) {
      await client.deleteCollection(COLLECTION);
      console.log(`Recreating collection (${currentSize} → ${config.embeddingDimensions} dims)`);
    } else {
      return;
    }
  }

  await client.createCollection(COLLECTION, {
    vectors: { size: config.embeddingDimensions, distance: 'Cosine' },
  });
  await client.createPayloadIndex(COLLECTION, {
    field_name: 'project_id',
    field_schema: 'keyword',
  });
}

export async function upsertChunks(
  projectId: string,
  fileId: string,
  texts: string[],
  vectors: number[][],
) {
  const points = texts.map((text, i) => ({
    id: uuid(),
    vector: vectors[i],
    payload: {
      project_id: projectId,
      file_id: fileId,
      text,
      chunk_index: i,
    },
  }));

  for (let i = 0; i < points.length; i += 100) {
    await client.upsert(COLLECTION, { points: points.slice(i, i + 100) });
  }

  return points.length;
}

export async function searchChunks(projectId: string, vector: number[], topK = config.topK) {
  const results = await client.query(COLLECTION, {
    query: vector,
    filter: {
      must: [{ key: 'project_id', match: { value: projectId } }],
    },
    limit: topK,
    with_payload: true,
  });

  return results.points.map(p => ({
    text: (p.payload as Record<string, unknown>).text as string,
    fileId: (p.payload as Record<string, unknown>).file_id as string,
    chunkIndex: (p.payload as Record<string, unknown>).chunk_index as number,
    score: p.score,
  }));
}

export async function deleteByFile(fileId: string) {
  await client.delete(COLLECTION, {
    filter: { must: [{ key: 'file_id', match: { value: fileId } }] },
  });
}

export async function deleteByProject(projectId: string) {
  await client.delete(COLLECTION, {
    filter: { must: [{ key: 'project_id', match: { value: projectId } }] },
  });
}
