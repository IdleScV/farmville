import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const farmRouter = Router();
farmRouter.use(requireAuth);

// GET /farm — full farm state
farmRouter.get('/', async (req, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).userId;
  try {
    const [userResult, plotsResult, cropsResult] = await Promise.all([
      db.query(`SELECT id, username, coins, level, xp FROM users WHERE id = $1`, [userId]),
      db.query(`SELECT * FROM plots WHERE user_id = $1 ORDER BY y, x`, [userId]),
      db.query(`SELECT * FROM crop_types ORDER BY min_level, seed_cost`),
    ]);

    // Resolve 'growing' → 'ready' based on elapsed time (server is authoritative)
    const now = Date.now();
    const cropMap = new Map(cropsResult.rows.map((c) => [c.id, c]));
    const plots = plotsResult.rows.map((plot) => {
      if (plot.state === 'growing' && plot.planted_at && plot.crop_type) {
        const crop = cropMap.get(plot.crop_type);
        if (crop) {
          const elapsed = (now - new Date(plot.planted_at).getTime()) / 1000;
          if (elapsed >= crop.growth_seconds) return { ...plot, state: 'ready' };
        }
      }
      return plot;
    });

    res.json({ user: userResult.rows[0], plots, cropTypes: cropsResult.rows });
  } catch (err) {
    console.error('GET /farm error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /farm/plant
farmRouter.post('/plant', async (req, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).userId;
  const { plotId, cropTypeId } = req.body ?? {};

  if (!plotId || !cropTypeId) {
    res.status(400).json({ error: 'plotId and cropTypeId required' });
    return;
  }

  try {
    const [plotResult, cropResult, userResult] = await Promise.all([
      db.query(`SELECT * FROM plots WHERE id = $1 AND user_id = $2`, [plotId, userId]),
      db.query(`SELECT * FROM crop_types WHERE id = $1`, [cropTypeId]),
      db.query(`SELECT coins, level FROM users WHERE id = $1`, [userId]),
    ]);

    const plot = plotResult.rows[0];
    const crop = cropResult.rows[0];
    const user = userResult.rows[0];

    if (!plot)                      { res.status(404).json({ error: 'Plot not found' }); return; }
    if (!crop)                      { res.status(404).json({ error: 'Unknown crop type' }); return; }
    if (plot.state !== 'empty')     { res.status(400).json({ error: 'Plot is not empty' }); return; }
    if (user.coins < crop.seed_cost){ res.status(400).json({ error: 'Not enough coins' }); return; }
    if (user.level < crop.min_level){ res.status(400).json({ error: `Requires level ${crop.min_level}` }); return; }

    await db.query(`UPDATE users SET coins = coins - $1 WHERE id = $2`, [crop.seed_cost, userId]);
    const updated = await db.query(
      `UPDATE plots SET state = 'growing', crop_type = $1, planted_at = NOW()
       WHERE id = $2 RETURNING *`,
      [cropTypeId, plotId],
    );

    res.json({ plot: updated.rows[0], coins: user.coins - crop.seed_cost });
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
    const plotResult = await db.query(
      `SELECT p.*, c.growth_seconds, c.harvest_yield, c.xp_yield
       FROM plots p
       JOIN crop_types c ON p.crop_type = c.id
       WHERE p.id = $1 AND p.user_id = $2`,
      [plotId, userId],
    );
    const plot = plotResult.rows[0];
    if (!plot) { res.status(404).json({ error: 'Plot not found' }); return; }

    const elapsed = (Date.now() - new Date(plot.planted_at).getTime()) / 1000;
    if (elapsed < plot.growth_seconds) {
      res.status(400).json({ error: 'Crop is not ready yet' });
      return;
    }

    const [clearedPlot, userResult] = await Promise.all([
      db.query(
        `UPDATE plots SET state = 'empty', crop_type = NULL, planted_at = NULL
         WHERE id = $1 RETURNING *`,
        [plotId],
      ),
      db.query(
        `UPDATE users SET coins = coins + $1, xp = xp + $2 WHERE id = $3
         RETURNING coins, xp, level`,
        [plot.harvest_yield, plot.xp_yield, userId],
      ),
    ]);

    const user = userResult.rows[0];

    // Level up: threshold is level * 100 XP
    const xpThreshold = user.level * 100;
    let leveledUp = false;
    let newLevel = user.level;
    if (user.xp >= xpThreshold) {
      newLevel = user.level + 1;
      await db.query(`UPDATE users SET level = $1, xp = xp - $2 WHERE id = $3`, [newLevel, xpThreshold, userId]);
      leveledUp = true;
    }

    res.json({
      plot: clearedPlot.rows[0],
      coins: user.coins,
      xp: user.xp,
      leveledUp,
      ...(leveledUp ? { newLevel } : {}),
    });
  } catch (err) {
    console.error('POST /farm/harvest error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
