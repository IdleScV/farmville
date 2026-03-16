import { User, Plot, FarmState } from './types';

// Auth
export interface RegisterRequest { username: string; password: string; }
export interface LoginRequest    { username: string; password: string; }
export interface AuthResponse    { token: string; user: User; }

// Farm
export interface PlantRequest   { plotId: string; cropTypeId: string; }
export interface HarvestRequest { plotId: string; }

export interface PlantResponse {
  plot: Plot;
  coins: number;
}

export interface HarvestResponse {
  plot: Plot;
  coins: number;
  xp: number;
  leveledUp: boolean;
  newLevel?: number;
}

export interface ApiError { error: string; }
