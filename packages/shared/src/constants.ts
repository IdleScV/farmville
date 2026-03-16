export interface CropDef {
  id: string;
  name: string;
  emoji: string;
  growMs: number;
  seedCost: number;
  harvestYield: number;
  xp: number;
  minLevel: number;
}

export const CROPS: CropDef[] = [
  { id: 'wheat',      name: 'Wheat',      emoji: '🌾', growMs: 30_000,  seedCost: 10, harvestYield: 25,  xp: 5,  minLevel: 1 },
  { id: 'carrot',     name: 'Carrot',     emoji: '🥕', growMs: 60_000,  seedCost: 15, harvestYield: 40,  xp: 8,  minLevel: 1 },
  { id: 'tomato',     name: 'Tomato',     emoji: '🍅', growMs: 120_000, seedCost: 25, harvestYield: 70,  xp: 15, minLevel: 2 },
  { id: 'corn',       name: 'Corn',       emoji: '🌽', growMs: 300_000, seedCost: 40, harvestYield: 110, xp: 25, minLevel: 3 },
  { id: 'pumpkin',    name: 'Pumpkin',    emoji: '🎃', growMs: 600_000, seedCost: 60, harvestYield: 160, xp: 40, minLevel: 4 },
  { id: 'strawberry', name: 'Strawberry', emoji: '🍓', growMs: 900_000, seedCost: 90, harvestYield: 250, xp: 60, minLevel: 5 },
];

export const CROP_MAP = new Map(CROPS.map((c) => [c.id, c]));

export function xpForNextLevel(level: number): number {
  return level * 120;
}

export const STARTING_COINS = 150;
export const STARTING_GRID_SIZE = 2; // 2×2 = 4 unlocked plots
export const GRID_SIZE = 8;
export const PEST_WINDOW_MS = 5_000;
export const WATER_BOOST = 0.85;       // -15% grow time
export const FERT_YIELD_MULT = 1.2;    // +20% yield
