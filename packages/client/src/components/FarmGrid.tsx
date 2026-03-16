import React from 'react';
import { useGameStore } from '../store/gameStore';
import PlotCell from './PlotCell';
import { GRID_SIZE } from '@farmville/shared';

export default function FarmGrid() {
  const plots = useGameStore((s) => s.plots);

  // Build a 2D map keyed by "x,y"
  const plotMap = new Map(plots.map((p) => [`${p.x},${p.y}`, p]));

  return (
    <div
      className="grid gap-1.5 p-4 bg-farm-panel rounded-2xl shadow-xl"
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`, width: 'min(95vw, 540px)' }}
    >
      {Array.from({ length: GRID_SIZE }, (_, y) =>
        Array.from({ length: GRID_SIZE }, (_, x) => {
          const plot = plotMap.get(`${x},${y}`);
          if (!plot) return null;
          return <PlotCell key={plot.id} plot={plot} />;
        }),
      )}
    </div>
  );
}
