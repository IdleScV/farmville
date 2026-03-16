import { User, Plot, ToolBelt, CatchUpResult } from './types';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface FarmResponse {
  user: User;
  plots: Plot[];
  toolBelt: ToolBelt;
  catchUp: CatchUpResult | null;
}

export interface PlantRequest {
  plotId: string;
  cropType: string;
}

export interface PlantResponse {
  plot: Plot;
  user: User;
  toolBelt: ToolBelt;
}

export interface HarvestResponse {
  plot: Plot;
  user: User;
  pestEvent: boolean;
  leveledUp: boolean;
  newLevel?: number;
}

export interface ToolResponse {
  plot: Plot;
  toolBelt: ToolBelt;
}

export interface ApiError { error: string; }
