import React from 'react';
import { useGameStore } from '../store/gameStore';

export default function CatchUpModal() {
  const { catchUpResult, setCatchUpResult } = useGameStore();
  if (!catchUpResult) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-farm-panel rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <div className="text-4xl mb-3">🌅</div>
        <h2 className="text-xl font-bold mb-2">Welcome back!</h2>
        <p className="text-slate-400 mb-4">Your crops were ready while you were away.</p>
        <div className="bg-farm-bg rounded-xl p-4 space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-slate-400">Harvested</span>
            <span className="font-semibold">{catchUpResult.harvested} plots</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Coins earned</span>
            <span className="text-farm-gold font-semibold">+{catchUpResult.coinsEarned} 💰</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">XP earned</span>
            <span className="text-farm-green font-semibold">+{catchUpResult.xpEarned} XP</span>
          </div>
          {catchUpResult.streakBonus && (
            <div className="text-farm-accent text-sm font-semibold pt-1">
              🔥 Streak bonus +10% applied!
            </div>
          )}
        </div>
        <button
          className="w-full py-3 bg-farm-accent rounded-xl font-semibold hover:brightness-110 transition"
          onClick={() => setCatchUpResult(null)}
        >
          Start farming!
        </button>
      </div>
    </div>
  );
}
