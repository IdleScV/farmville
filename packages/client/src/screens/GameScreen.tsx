import React, { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API, apiFetch } from '../api';
import { useGameStore } from '../store/gameStore';
import HUD from '../components/HUD';
import FarmGrid from '../components/FarmGrid';
import CropPanel from '../components/CropPanel';
import ToolBelt from '../components/ToolBelt';
import CatchUpModal from '../components/CatchUpModal';
import PestGame from '../components/PestGame';
import type { FarmResponse, PestEvent } from '@farmville/shared';

export default function GameScreen() {
  const { setFarmState, login, logout, updatePlot, setPestEvent, setCatchUpResult, user, activePlotId } = useGameStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    apiFetch<FarmResponse>('/farm')
      .then((data) => {
        setFarmState(data.user, data.plots, data.toolBelt);
        if (data.catchUp) setCatchUpResult(data.catchUp);
      })
      .catch(() => logout());
  }, []);

  useEffect(() => {
    if (!user) return;
    const socket = io(API, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.emit('auth', user.id);
    socket.on('pest:event', (event: PestEvent) => setPestEvent(event));
    return () => { socket.disconnect(); };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-farm-bg flex flex-col">
      <HUD />
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        <FarmGrid />
        <ToolBelt />
      </main>
      {activePlotId && <CropPanel />}
      <CatchUpModal />
      <PestGame onDefend={(plotId) => {
        apiFetch('/farm/pest-defend', { method: 'POST', body: JSON.stringify({ plotId }) }).catch(() => {});
        setPestEvent(null);
        // Refresh plot state after defense
        apiFetch<FarmResponse>('/farm').then((d) => setFarmState(d.user, d.plots, d.toolBelt)).catch(() => {});
      }} />
    </div>
  );
}
