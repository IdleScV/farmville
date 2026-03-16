import React from 'react';
import { useGameStore } from '../store/gameStore';

export default function ToolBelt() {
  const { toolBelt, selectedTool, setSelectedTool } = useGameStore();

  const tools = [
    { id: 'fertilizer' as const, emoji: '✨', label: 'Fertilizer', count: toolBelt.fertilizer, tip: '+20% yield' },
  ];

  return (
    <div className="flex items-center gap-3 bg-farm-panel rounded-xl px-4 py-3 shadow">
      <span className="text-slate-400 text-sm mr-1">Tools:</span>
      <div className="flex items-center gap-1 text-sm text-slate-300 bg-farm-bg rounded-lg px-3 py-2">
        <span>💧</span>
        <span className="text-slate-400 text-xs ml-1">Auto-water</span>
        <span className="ml-2 text-farm-green font-semibold">×{toolBelt.water}</span>
      </div>
      {tools.map((tool) => {
        const active = selectedTool === tool.id;
        const empty = tool.count === 0;
        return (
          <button
            key={tool.id}
            title={tool.tip}
            disabled={empty}
            className={`flex items-center gap-1 text-sm rounded-lg px-3 py-2 transition border
              ${active ? 'bg-farm-accent border-farm-accent text-white' : 'bg-farm-bg border-farm-card text-slate-300'}
              ${empty ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-125 cursor-pointer'}`}
            onClick={() => setSelectedTool(active ? null : tool.id)}
          >
            <span>{tool.emoji}</span>
            <span className="font-semibold">×{tool.count}</span>
          </button>
        );
      })}
      {selectedTool && (
        <span className="text-xs text-farm-accent animate-pulse">
          Click a growing plot to apply
        </span>
      )}
    </div>
  );
}
