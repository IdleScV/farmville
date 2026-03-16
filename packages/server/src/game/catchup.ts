import { prisma } from '../db';
import { CROP_MAP, xpForNextLevel, FERT_YIELD_MULT } from '@farmville/shared';
import type { CatchUpResult } from '@farmville/shared';

export async function runCatchUp(userId: string): Promise<CatchUpResult | null> {
  const now = new Date();

  // Find all plots that are past their harvestAt (still have a crop)
  const readyPlots = await prisma.plot.findMany({
    where: {
      userId,
      cropType: { not: null },
      harvestAt: { lte: now },
    },
  });

  if (readyPlots.length === 0) return null;

  let coinsEarned = 0;
  let xpEarned = 0;

  for (const plot of readyPlots) {
    const crop = CROP_MAP.get(plot.cropType!);
    if (!crop) continue;

    const yieldAmt = plot.fertBoosted
      ? Math.floor(crop.harvestYield * FERT_YIELD_MULT)
      : crop.harvestYield;

    coinsEarned += yieldAmt;
    xpEarned += crop.xp;
  }

  // Apply streak bonus (+10%) if more than 1 plot was ready
  const streakBonus = readyPlots.length >= 3;
  if (streakBonus) {
    coinsEarned = Math.floor(coinsEarned * 1.1);
    xpEarned = Math.floor(xpEarned * 1.1);
  }

  // Clear all ready plots in one transaction, update user stats
  await prisma.$transaction(async (tx) => {
    await tx.plot.updateMany({
      where: { id: { in: readyPlots.map((p) => p.id) } },
      data: { cropType: null, plantedAt: null, harvestAt: null, fertBoosted: false },
    });

    const user = await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: coinsEarned }, xp: { increment: xpEarned } },
    });

    // Handle level-ups
    let level = user.level;
    let xp = user.xp;
    while (xp >= xpForNextLevel(level)) {
      xp -= xpForNextLevel(level);
      level += 1;
    }
    if (level !== user.level) {
      await tx.user.update({ where: { id: userId }, data: { level, xp } });
    }
  });

  return { harvested: readyPlots.length, coinsEarned, xpEarned, streakBonus };
}
