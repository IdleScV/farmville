import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../db';
import { signToken } from '../middleware/auth';
import { runCatchUp } from '../game/catchup';
import { GRID_SIZE, STARTING_GRID_SIZE } from '@farmville/shared';

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string' ||
      username.length < 3 || password.length < 6) {
    res.status(400).json({ error: 'Username (3+ chars) and password (6+ chars) required' });
    return;
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        password: hash,
        plots: {
          create: Array.from({ length: GRID_SIZE }, (_, y) =>
            Array.from({ length: GRID_SIZE }, (_, x) => ({
              x,
              y,
              unlocked: x < STARTING_GRID_SIZE && y < STARTING_GRID_SIZE,
            })),
          ).flat(),
        },
      },
      select: { id: true, username: true, coins: true, level: true, xp: true },
    });

    res.status(201).json({ token: signToken(user.id), user });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'P2002') {
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
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Update last login timestamp
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    const { password: _, ...safeUser } = user;
    res.json({ token: signToken(user.id), user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
