import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { ensureCollection } from './services/qdrant.js';
import projectsRouter from './routes/projects.js';
import filesRouter from './routes/files.js';
import chatRouter from './routes/chat.js';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api', filesRouter);
app.use('/api', chatRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  try {
    await ensureCollection();
    console.log('Qdrant collection ready');
  } catch (err) {
    console.warn('Qdrant not available yet, will retry on first request:', err);
  }

  app.listen(config.port, () => {
    console.log(`Backend listening on port ${config.port}`);
  });
}

start();
