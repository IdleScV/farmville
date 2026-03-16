export interface User {
  id: string;
  username: string;
  coins: number;
  level: number;
  xp: number;
}

export type PlotState = 'empty' | 'growing' | 'ready';

export interface Plot {
  id: string;
  userId: string;
  x: number;
  y: number;
  unlocked: boolean;
  cropType: string | null;
  plantedAt: string | null; // ISO timestamp
  harvestAt: string | null; // ISO timestamp
  fertBoosted: boolean;
}

export interface ToolBelt {
  water: number;
  fertilizer: number;
}

export interface FarmState {
  user: User;
  plots: Plot[];
  toolBelt: ToolBelt;
}

export interface CatchUpResult {
  harvested: number;
  coinsEarned: number;
  xpEarned: number;
  streakBonus: boolean;
}

export interface PestEvent {
  plotId: string;
  deadline: number; // unix timestamp ms
}
