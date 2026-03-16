import React from 'react';
import { useGameStore } from './store/gameStore';
import AuthScreen from './screens/AuthScreen';
import GameScreen from './screens/GameScreen';

export default function App() {
  const token = useGameStore((s) => s.token);
  return token ? <GameScreen /> : <AuthScreen />;
}
