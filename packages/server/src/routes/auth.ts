import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { signToken } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string' ||
      username.length < 3 || password.length < 6) {
    res.status(400).json({ error: 'Username (3+ chars) and password (6+ chars) required' });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username, coins, level, xp`,
      [username.toLowerCase().trim(), passwordHash],
    );
    const user = result.rows[0];

    // Create the 8x8 farm grid for the new user
    const values: string[] = [];
    const params: (string | number)[] = [];
    let i = 1;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        values.push(`($${i++}, $${i++}, $${i++})`);
        params.push(user.id, x, y);
      }
    }
    await db.query(`INSERT INTO plots (user_id, x, y) VALUES ${values.join(', ')}`, params);

    res.status(201).json({ token: signToken(user.id), user });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Username already taken' });
    } else {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  try {
    const result = await db.query(
      `SELECT id, username, password_hash, coins, level, xp
       FROM users WHERE username = $1`,
      [username.toLowerCase().trim()],
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const { password_hash: _, ...safeUser } = user;
    res.json({ token: signToken(user.id), user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
