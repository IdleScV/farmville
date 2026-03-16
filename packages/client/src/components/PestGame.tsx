import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface Props {
  onDefend: (plotId: string) => void;
}

export default function PestGame({ onDefend }: Props) {
  const { pestEvent, setPestEvent } = useGameStore();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!pestEvent) return;
    const tick = () => {
      const remaining = Math.max(0, pestEvent.deadline - Date.now());
      setTimeLeft(remaining);
      if (remaining === 0) setPestEvent(null);
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [pestEvent]);

  if (!pestEvent) return null;

  const secs = (timeLeft / 1000).toFixed(1);
  const pct = (timeLeft / 5000) * 100;

  return (
    <div className="fixed bottom-8 right-8 z-50 bg-farm-panel border-2 border-farm-accent rounded-2xl p-5 shadow-2xl w-64 animate-bounce-once">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🐛</span>
        <div>
          <p className="font-bold text-farm-accent">Pest Attack!</p>
          <p className="text-xs text-slate-400">A crop is under attack!</p>
        </div>
      </div>
      <div className="w-full h-2 bg-farm-bg rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-farm-accent rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-center text-sm text-slate-400 mb-3">{secs}s remaining</p>
      <button
        className="w-full py-2 bg-farm-accent rounded-xl font-bold hover:brightness-110 transition text-lg"
        onClick={() => onDefend(pestEvent.plotId)}
      >
        🪲 Squash it!
      </button>
    </div>
  );
}
