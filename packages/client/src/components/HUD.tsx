import React from 'react';
import { useGameStore } from '../store/gameStore';
import { xpForNextLevel } from '@farmville/shared';

export default function HUD() {
  const { user, logout } = useGameStore();
  if (!user) return null;

  const xpNeeded = xpForNextLevel(user.level);
  const xpPct = Math.min(100, Math.round((user.xp / xpNeeded) * 100));

  return (
    <header className="bg-farm-panel border-b border-farm-card px-6 py-3 flex items-center gap-6">
      <span className="text-farm-gold font-bold text-lg">🌾 Farmville</span>
      <div className="flex items-center gap-1 text-farm-gold font-semibold">
        <span>💰</span>
        <span>{user.coins}</span>
      </div>
      <div className="flex items-center gap-2 flex-1 max-w-xs">
        <span className="text-slate-400 text-sm whitespace-nowrap">Lv {user.level}</span>
        <div className="flex-1 h-2 bg-farm-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-farm-green rounded-full transition-all duration-500"
            style={{ width: `${xpPct}%` }}
          />
        </div>
        <span className="text-slate-400 text-xs whitespace-nowrap">{user.xp}/{xpNeeded}</span>
      </div>
      <button
        className="ml-auto text-slate-400 hover:text-slate-200 text-sm transition"
        onClick={logout}
      >
        Logout
      </button>
    </header>
  );
}
