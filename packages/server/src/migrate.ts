import { db } from './db';
import fs from 'fs';
import path from 'path';

export async function migrate(): Promise<void> {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  await db.query(sql);
  console.log('[db] Migration complete');
}
