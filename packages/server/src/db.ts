import { Pool } from 'pg';

export const db = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://farmville:farmville_dev@localhost:5432/farmville',
});

db.on('error', (err) => {
  console.error('Unexpected DB error:', err.message);
});
