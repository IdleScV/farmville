import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { farmRouter } from './routes/farm';
import { toolbeltRouter } from './routes/toolbelt';
import { initSocket } from './socket';
import { prisma } from './db';

const app = express();
const PORT = process.env.PORT ?? 3001;
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:3000';

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/auth', authRouter);
app.use('/farm', farmRouter);
app.use('/farm', toolbeltRouter);

const httpServer = http.createServer(app);
initSocket(httpServer, CLIENT_URL);

async function start(): Promise<void> {
  await new Promise<void>((resolve) => {
    httpServer.listen(PORT, () => {
      console.log(`Farmville server running on http://localhost:${PORT}`);
      resolve();
    });
  });

  await prisma.$connect();
  console.log('[db] Connected');
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
