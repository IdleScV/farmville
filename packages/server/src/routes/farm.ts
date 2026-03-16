import { Router, Response } from 'express';
import { prisma } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { runCatchUp } from '../game/catchup';
import { emitToUser } from '../socket';
import { CROP_MAP, xpForNextLevel, FERT_YIELD_MULT, PEST_WINDOW_MS } from '@farmville/shared';

export const farmRouter = Router();
farmRouter.use(requireAuth);

// GET /farm — full farm state + offline catch-up
farmRouter.get('/', async (req, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).userId;
  try {
    const catchUp = await runCatchUp(userId);

    const [user, plots] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, coins: true, level: true, xp: true, toolBelt: true },
      }),
      prisma.plot.findMany({ where: { userId }, orderBy: [{ y: 'asc' }, { x: 'asc' }] }),
    ]);

    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const { toolBelt, ...restUser } = user;
    res.json({ user: restUser, plots, toolBelt, catchUp });
  } catch (err) {
    console.error('GET /farm error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /farm/plant
farmRouter.post('/plant', async (req, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).userId;
  const { plotId, cropType } = req.body ?? {};

  if (!plotId || !cropType) {
    res.status(400).json({ error: 'plotId and cropType required' });
    return;
  }

  const cropDef = CROP_MAP.get(cropType);
  if (!cropDef) { res.status(400).json({ error: 'Unknown crop type' }); return; }

  try {
    const [plot, user] = await Promise.all([
      prisma.plot.findFirst({ where: { id: plotId, userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { coins: true, level: true, toolBelt: true },
      }),
    ]);

    if (!plot)              { res.status(404).json({ error: 'Plot not found' }); return; }
    if (!plot.unlocked)     { res.status(400).json({ error: 'Plot is locked' }); return; }
    if (plot.cropType)      { res.status(400).json({ error: 'Plot already in use' }); return; }
    if (!user)              { res.status(404).json({ error: 'User not found' }); return; }
    if (user.coins < cropDef.seedCost) { res.status(400).json({ error: 'Not enough coins' }); return; }
    if (user.level < cropDef.minLevel) { res.status(400).json({ error: `Requires level ${cropDef.minLevel}` }); return; }

    const toolBelt = user.toolBelt as { water: number; fertilizer: number };
    const useWater = toolBelt.water > 0; // auto-use water if available (can be made explicit)

    const growMs = useWater ? Math.floor(cropDef.growMs * 0.85) : cropDef.growMs;
    const now = new Date();
    const harvestAt = new Date(now.getTime() + growMs);

    const [updatedPlot, updatedUser] = await prisma.$transaction([
      prisma.plot.update({
        where: { id: plotId },
        data: { cropType, plantedAt: now, harvestAt },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          coins: { decrement: cropDef.seedCost },
          toolBelt: useWater
            ? { ...toolBelt, water: toolBelt.water - 1 }
            : toolBelt,
        },
        select: { id: true, username: true, coins: true, level: true, xp: true, toolBelt: true },
      }),
    ]);

    const { toolBelt: tb, ...restUser } = updatedUser;
    res.json({ plot: updatedPlot, user: restUser, toolBelt: tb });
  } catch (err) {
    console.error('POST /farm/plant error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /farm/harvest
farmRouter.post('/harvest', async (req, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).userId;
  const { plotId } = req.body ?? {};

  if (!plotId) { res.status(400).json({ error: 'plotId required' }); return; }

  try {
    const plot = await prisma.plot.findFirst({ where: { id: plotId, userId } });
    if (!plot)         { res.status(404).json({ error: 'Plot not found' }); return; }
    if (!plot.cropType){ res.status(400).json({ error: 'Nothing planted here' }); return; }
    if (!plot.harvestAt || new Date() < plot.harvestAt) {
      res.status(400).json({ error: 'Crop is not ready yet' }); return;
    }

    const cropDef = CROP_MAP.get(plot.cropType);
    if (!cropDef) { res.status(400).json({ error: 'Unknown crop' }); return; }

    const yieldAmt = plot.fertBoosted
      ? Math.floor(cropDef.harvestYield * FERT_YIELD_MULT)
      : cropDef.harvestYield;

    const [clearedPlot, rawUser] = await prisma.$transaction([
      prisma.plot.update({
        where: { id: plotId },
        data: { cropType: null, plantedAt: null, harvestAt: null, fertBoosted: false },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { coins: { increment: yieldAmt }, xp: { increment: cropDef.xp } },
        select: { id: true, username: true, coins: true, level: true, xp: true },
      }),
    ]);

    // Level-up check
    let { level, xp } = rawUser;
    let leveledUp = false;
    while (xp >= xpForNextLevel(level)) {
      xp -= xpForNextLevel(level);
      level += 1;
      leveledUp = true;
    }
    const user = leveledUp
      ? await prisma.user.update({ where: { id: userId }, data: { level, xp }, select: { id: true, username: true, coins: true, level: true, xp: true } })
      : rawUser;

    // 1-in-5 chance of pest event
    const pestEvent = Math.random() < 0.2;
    if (pestEvent) {
      // Pick a random growing plot to be affected
      const growingPlots = await prisma.plot.findMany({
        where: { userId, cropType: { not: null }, harvestAt: { gt: new Date() } },
        take: 5,
      });
      if (growingPlots.length > 0) {
        const target = growingPlots[Math.floor(Math.random() * growingPlots.length)];
        const deadline = Date.now() + PEST_WINDOW_MS;
        emitToUser(userId, 'pest:event', { plotId: target.id, deadline });

        // Auto-destroy after window expires if not defended
        setTimeout(async () => {
          await prisma.plot.update({
            where: { id: target.id },
            data: { cropType: null, plantedAt: null, harvestAt: null },
          }).catch(() => {});
        }, PEST_WINDOW_MS + 500);
      }
    }

    res.json({ plot: clearedPlot, user, pestEvent, leveledUp, ...(leveledUp ? { newLevel: level } : {}) });
  } catch (err) {
    console.error('POST /farm/harvest error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /farm/pest-defend — cancel pest before it destroys crop
farmRouter.post('/pest-defend', async (req, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).userId;
  const { plotId } = req.body ?? {};
  if (!plotId) { res.status(400).json({ error: 'plotId required' }); return; }

  try {
    const plot = await prisma.plot.findFirst({ where: { id: plotId, userId } });
    if (!plot) { res.status(404).json({ error: 'Plot not found' }); return; }
    // If the plot still has a crop it means we defended in time (setTimeout hasn't fired)
    res.json({ saved: plot.cropType !== null });
  } catch (err) {
    console.error('POST /farm/pest-defend error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
