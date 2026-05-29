import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/database.js';
import { deleteByProject } from '../services/qdrant.js';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

const router = Router();

function paramStr(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] : val || '';
}

router.get('/', (_req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  res.json(projects);
});

router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const id = uuid();
  db.prepare('INSERT INTO projects (id, name, description) VALUES (?, ?, ?)').run(id, name, description || null);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json(project);
});

router.get('/:id', (req, res) => {
  const id = paramStr(req.params.id);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json(project);
});

router.put('/:id', (req, res) => {
  const id = paramStr(req.params.id);
  const { name, description } = req.body;
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  db.prepare('UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?')
    .run(name || null, description !== undefined ? description : null, id);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json(project);
});

router.delete('/:id', async (req, res) => {
  const id = paramStr(req.params.id);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const files = db.prepare('SELECT * FROM files WHERE project_id = ?').all(id) as { filename: string }[];
  for (const file of files) {
    const filePath = path.join(config.uploadDir, file.filename);
    await fs.unlink(filePath).catch(() => {});
  }

  try {
    await deleteByProject(id);
  } catch {
    // Qdrant might not be available yet
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  res.status(204).end();
});

export default router;
