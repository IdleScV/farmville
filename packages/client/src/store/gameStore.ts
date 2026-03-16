import { create } from 'zustand';
import type { User, Plot, ToolBelt, CatchUpResult, PestEvent } from '@farmville/shared';

interface GameState {
  token: string | null;
  user: User | null;
  plots: Plot[];
  toolBelt: ToolBelt;
  selectedTool: 'fertilizer' | null;
  activePlotId: string | null;   // plot awaiting crop selection
  catchUpResult: CatchUpResult | null;
  pestEvent: PestEvent | null;
}

interface GameActions {
  login: (token: string, user: User) => void;
  logout: () => void;
  setFarmState: (user: User, plots: Plot[], toolBelt: ToolBelt) => void;
  updatePlot: (plot: Plot) => void;
  updateUser: (user: User) => void;
  updateToolBelt: (toolBelt: ToolBelt) => void;
  setActivePlot: (plotId: string | null) => void;
  setSelectedTool: (tool: 'fertilizer' | null) => void;
  setCatchUpResult: (result: CatchUpResult | null) => void;
  setPestEvent: (event: PestEvent | null) => void;
}

export const useGameStore = create<GameState & GameActions>((set) => ({
  token: localStorage.getItem('fv_token'),
  user: null,
  plots: [],
  toolBelt: { water: 0, fertilizer: 0 },
  selectedTool: null,
  activePlotId: null,
  catchUpResult: null,
  pestEvent: null,

  login: (token, user) => {
    localStorage.setItem('fv_token', token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('fv_token');
    set({ token: null, user: null, plots: [], toolBelt: { water: 0, fertilizer: 0 } });
  },
  setFarmState: (user, plots, toolBelt) => set({ user, plots, toolBelt }),
  updatePlot: (plot) =>
    set((s) => ({ plots: s.plots.map((p) => (p.id === plot.id ? plot : p)) })),
  updateUser: (user) => set({ user }),
  updateToolBelt: (toolBelt) => set({ toolBelt }),
  setActivePlot: (activePlotId) => set({ activePlotId }),
  setSelectedTool: (selectedTool) => set({ selectedTool }),
  setCatchUpResult: (catchUpResult) => set({ catchUpResult }),
  setPestEvent: (pestEvent) => set({ pestEvent }),
}));
