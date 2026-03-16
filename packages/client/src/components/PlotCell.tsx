import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { apiFetch } from '../api';
import { CROP_MAP, FERT_YIELD_MULT } from '@farmville/shared';
import type { Plot, PlantResponse, HarvestResponse, ToolResponse } from '@farmville/shared';

interface Props { plot: Plot; }

function getState(plot: Plot): 'locked' | 'empty' | 'growing' | 'ready' {
  if (!plot.unlocked) return 'locked';
  if (!plot.cropType) return 'empty';
  if (!plot.harvestAt) return 'growing';
  return new Date() >= new Date(plot.harvestAt) ? 'ready' : 'growing';
}

function useGrowProgress(plot: Plot): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!plot.plantedAt || !plot.harvestAt) { setProgress(0); return; }
    const planted = new Date(plot.plantedAt).getTime();
    const harvest = new Date(plot.harvestAt).getTime();
    const total = harvest - planted;

    const tick = () => setProgress(Math.min(1, (Date.now() - planted) / total));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [plot.plantedAt, plot.harvestAt]);

  return progress;
}

export default function PlotCell({ plot }: Props) {
  const { setActivePlot, updatePlot, updateUser, updateToolBelt, selectedTool, setSelectedTool, pestEvent } = useGameStore();
  const state = getState(plot);
  const progress = useGrowProgress(plot);
  const cropDef = plot.cropType ? CROP_MAP.get(plot.cropType) : undefined;
  const isPestTarget = pestEvent?.plotId === plot.id;

  async function handleClick() {
    if (state === 'locked') return;

    if (state === 'empty') {
      if (selectedTool === 'fertilizer') { setSelectedTool(null); return; }
      setActivePlot(plot.id);
      return;
    }

    if (state === 'growing' && selectedTool === 'fertilizer') {
      try {
        const res = await apiFetch<ToolResponse>(`/farm/fertilize/${plot.id}`, { method: 'POST' });
        updatePlot(res.plot);
        updateToolBelt(res.toolBelt as { water: number; fertilizer: number });
        setSelectedTool(null);
      } catch (err) {
        alert((err as Error).message);
      }
      return;
    }

    if (state === 'ready') {
      try {
        const res = await apiFetch<HarvestResponse>('/farm/harvest', {
          method: 'POST',
          body: JSON.stringify({ plotId: plot.id }),
        });
        updatePlot(res.plot);
        updateUser(res.user);
      } catch (err) {
        alert((err as Error).message);
      }
    }
  }

  const baseClass = 'relative aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all select-none border';

  const stateClass = {
    locked: 'bg-slate-800 border-slate-700 cursor-not-allowed opacity-50',
    empty: 'bg-farm-soil border-yellow-900 hover:brightness-110',
    growing: 'bg-amber-950 border-amber-800 hover:brightness-110',
    ready: 'bg-farm-green/20 border-farm-green animate-pulse hover:brightness-125',
  }[state];

  return (
    <div
      className={`${baseClass} ${stateClass} ${isPestTarget ? 'ring-2 ring-farm-accent ring-offset-1 ring-offset-farm-bg' : ''}`}
      onClick={handleClick}
      title={state === 'locked' ? 'Locked' : cropDef?.name ?? 'Empty plot'}
    >
      {state === 'locked' && <span className="text-lg">🔒</span>}
      {state === 'empty' && <span className="text-2xl opacity-30">＋</span>}
      {(state === 'growing' || state === 'ready') && cropDef && (
        <>
          <span className="text-2xl">{cropDef.emoji}</span>
          {state === 'growing' && (
            <div className="absolute bottom-1 left-1 right-1 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-farm-green rounded-full transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}
          {plot.fertBoosted && (
            <span className="absolute top-0.5 right-0.5 text-xs">✨</span>
          )}
          {isPestTarget && (
            <span className="absolute inset-0 flex items-center justify-center text-2xl bg-black/50 rounded-lg">
              🐛
            </span>
          )}
        </>
      )}
    </div>
  );
}
