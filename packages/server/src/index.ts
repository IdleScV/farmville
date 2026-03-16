import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { farmRouter } from './routes/farm';
import { migrate } from './migrate';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:3000' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/auth', authRouter);
app.use('/farm', farmRouter);

migrate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Farmville server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[db] Migration failed:', err);
    process.exit(1);
  });
