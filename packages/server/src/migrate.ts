import { db } from './db';
import fs from 'fs';
import path from 'path';

export async function migrate(): Promise<void> {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  const maxAttempts = 10;
  let delay = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await db.query(sql);
      console.log('[db] Migration complete');
      return;
    } catch (err) {
      const msg = (err as Error).message;
      if (attempt === maxAttempts) {
        throw new Error(`[db] Migration failed after ${maxAttempts} attempts: ${msg}`);
      }
      console.log(`[db] Attempt ${attempt} failed (${msg}) — retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, 10000);
    }
  }
}
