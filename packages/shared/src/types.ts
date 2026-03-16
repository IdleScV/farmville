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
  user_id: string;
  x: number;
  y: number;
  state: PlotState;
  crop_type: string | null;
  planted_at: string | null; // ISO timestamp
}

export interface CropType {
  id: string;
  name: string;
  growth_seconds: number;
  seed_cost: number;
  harvest_yield: number;
  xp_yield: number;
  min_level: number;
  emoji: string;
}

export interface FarmState {
  user: User;
  plots: Plot[];
  cropTypes: CropType[];
}
