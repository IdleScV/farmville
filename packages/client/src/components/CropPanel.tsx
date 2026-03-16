import React from 'react';
import { useGameStore } from '../store/gameStore';
import { apiFetch } from '../api';
import { CROPS } from '@farmville/shared';
import type { PlantResponse } from '@farmville/shared';

export default function CropPanel() {
  const { user, toolBelt, activePlotId, setActivePlot, updatePlot, updateUser, updateToolBelt } = useGameStore();
  if (!activePlotId || !user) return null;

  const availableCrops = CROPS.filter((c) => c.minLevel <= user.level);

  async function plant(cropType: string) {
    if (!activePlotId) return;
    try {
      const res = await apiFetch<PlantResponse>('/farm/plant', {
        method: 'POST',
        body: JSON.stringify({ plotId: activePlotId, cropType }),
      });
      updatePlot(res.plot);
      updateUser(res.user);
      updateToolBelt(res.toolBelt as { water: number; fertilizer: number });
      setActivePlot(null);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50"
      onClick={() => setActivePlot(null)}
    >
      <div
        className="bg-farm-panel rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Choose a crop</h3>
        {toolBelt.water > 0 && (
          <p className="text-xs text-farm-green mb-3">
            💧 Water active — grow time -15% (×{toolBelt.water} left)
          </p>
        )}
        <div className="space-y-2">
          {availableCrops.map((crop) => {
            const canAfford = user.coins >= crop.seedCost;
            return (
              <button
                key={crop.id}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left
                  ${canAfford
                    ? 'bg-farm-card border-farm-card hover:brightness-125 cursor-pointer'
                    : 'bg-farm-bg border-slate-700 opacity-50 cursor-not-allowed'}`}
                onClick={() => canAfford && plant(crop.id)}
                disabled={!canAfford}
              >
                <span className="text-2xl">{crop.emoji}</span>
                <div className="flex-1">
                  <div className="font-medium">{crop.name}</div>
                  <div className="text-xs text-slate-400">
                    {crop.growMs / 60000 >= 1
                      ? `${crop.growMs / 60000}m`
                      : `${crop.growMs / 1000}s`} grow
                    {toolBelt.water > 0 ? ` → ${Math.ceil(crop.growMs * 0.85 / 1000)}s` : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-farm-gold text-sm font-semibold">💰 {crop.seedCost}</div>
                  <div className="text-farm-green text-xs">+{crop.harvestYield}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
