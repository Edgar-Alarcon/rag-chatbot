import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/database.js';
import { embedQuery } from '../services/embeddings.js';
import { searchChunks } from '../services/qdrant.js';
import { generateAnswer } from '../services/gemini.js';

const router = Router();

function paramStr(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] : val || '';
}

router.post('/projects/:id/chat', async (req, res) => {
  const projectId = paramStr(req.params.id);
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const userMsgId = uuid();
  db.prepare('INSERT INTO messages (id, project_id, role, content) VALUES (?, ?, ?, ?)')
    .run(userMsgId, projectId, 'user', message);

  try {
    const queryVector = await embedQuery(message);
    const chunks = await searchChunks(projectId, queryVector);

    let answer: string;
    if (chunks.length === 0) {
      answer = 'No encuentro documentos indexados en este proyecto. Sube algunos ficheros primero.';
    } else {
      answer = await generateAnswer(message, chunks);
    }

    const sources = chunks.map(c => ({
      text: c.text.slice(0, 200),
      fileId: c.fileId,
      score: c.score,
    }));

    const assistantMsgId = uuid();
    db.prepare('INSERT INTO messages (id, project_id, role, content, sources) VALUES (?, ?, ?, ?, ?)')
      .run(assistantMsgId, projectId, 'assistant', answer, JSON.stringify(sources));

    res.json({ answer, sources });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to generate answer' });
  }
});

router.get('/projects/:id/messages', (req, res) => {
  const projectId = paramStr(req.params.id);
  const messages = db
    .prepare('SELECT * FROM messages WHERE project_id = ? ORDER BY created_at ASC')
    .all(projectId) as { sources: string | null }[];

  const parsed = messages.map(m => ({
    ...m,
    sources: m.sources ? JSON.parse(m.sources) : null,
  }));

  res.json(parsed);
});

export default router;
