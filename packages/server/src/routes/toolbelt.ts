import { Router, Response } from 'express';
import { prisma } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const toolbeltRouter = Router();
toolbeltRouter.use(requireAuth);

// POST /farm/fertilize/:plotId — apply fertilizer to a growing plot
toolbeltRouter.post('/fertilize/:plotId', async (req, res: Response): Promise<void> => {
  const userId = (req as unknown as AuthRequest).userId;
  const { plotId } = req.params;

  try {
    const [plot, user] = await Promise.all([
      prisma.plot.findFirst({ where: { id: plotId, userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { toolBelt: true } }),
    ]);

    if (!plot) { res.status(404).json({ error: 'Plot not found' }); return; }
    if (!plot.cropType) { res.status(400).json({ error: 'No crop planted here' }); return; }
    if (plot.fertBoosted) { res.status(400).json({ error: 'Already fertilized' }); return; }

    const toolBelt = user!.toolBelt as { water: number; fertilizer: number };
    if (toolBelt.fertilizer <= 0) { res.status(400).json({ error: 'No fertilizer left' }); return; }

    const [updatedPlot, updatedUser] = await prisma.$transaction([
      prisma.plot.update({ where: { id: plotId }, data: { fertBoosted: true } }),
      prisma.user.update({
        where: { id: userId },
        data: { toolBelt: { ...toolBelt, fertilizer: toolBelt.fertilizer - 1 } },
        select: { toolBelt: true },
      }),
    ]);

    res.json({ plot: updatedPlot, toolBelt: updatedUser.toolBelt });
  } catch (err) {
    console.error('POST /farm/fertilize error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
