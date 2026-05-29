import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/database.js';
import { upload } from '../middleware/upload.js';
import { parseFile } from '../services/parser.js';
import { chunkText } from '../services/chunker.js';
import { embedTexts } from '../services/embeddings.js';
import { upsertChunks, deleteByFile } from '../services/qdrant.js';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

const router = Router();

function paramStr(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] : val || '';
}

router.get('/projects/:id/files', (req, res) => {
  const projectId = paramStr(req.params.id);
  const files = db.prepare('SELECT * FROM files WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
  res.json(files);
});

router.post('/projects/:id/files', upload.single('file'), async (req, res) => {
  const projectId = paramStr(req.params.id);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const fileId = uuid();
  db.prepare(
    'INSERT INTO files (id, project_id, filename, original_name, mime_type, size_bytes, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(fileId, projectId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, 'processing');

  res.status(202).json({
    id: fileId,
    status: 'processing',
    original_name: req.file.originalname,
  });

  indexFile(projectId, fileId, path.join(config.uploadDir, req.file.filename)).catch(err => {
    console.error(`Indexing failed for file ${fileId}:`, err);
    db.prepare('UPDATE files SET status = ? WHERE id = ?').run('error', fileId);
  });
});

async function indexFile(projectId: string, fileId: string, filePath: string) {
  const text = await parseFile(filePath);
  const chunks = chunkText(text);

  if (chunks.length === 0) {
    db.prepare('UPDATE files SET status = ?, chunk_count = 0 WHERE id = ?').run('indexed', fileId);
    return;
  }

  const vectors = await embedTexts(chunks.map(c => c.text));
  await upsertChunks(projectId, fileId, chunks.map(c => c.text), vectors);

  db.prepare('UPDATE files SET status = ?, chunk_count = ? WHERE id = ?').run('indexed', chunks.length, fileId);
}

router.delete('/files/:fileId', async (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(paramStr(req.params.fileId)) as
    | { id: string; filename: string }
    | undefined;
  if (!file) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  const filePath = path.join(config.uploadDir, file.filename);
  await fs.unlink(filePath).catch(() => {});

  try {
    await deleteByFile(file.id);
  } catch {
    // Qdrant might not be available
  }

  db.prepare('DELETE FROM files WHERE id = ?').run(file.id);
  res.status(204).end();
});

export default router;
