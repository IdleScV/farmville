import React, { useState } from 'react';
import { apiFetch, setToken } from '../api';
import { useGameStore } from '../store/gameStore';
import type { AuthResponse } from '@farmville/shared';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useGameStore((s) => s.login);

  async function submit() {
    if (!username || !password) { setError('Please fill in both fields.'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<AuthResponse>(
        mode === 'login' ? '/auth/login' : '/auth/register',
        { method: 'POST', body: JSON.stringify({ username, password }) },
      );
      setToken(data.token);
      login(data.token, data.user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-farm-bg">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold text-center text-farm-gold mb-8">🌾 Farmville</h1>
        <div className="bg-farm-panel rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold mb-6 text-center">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <div className="space-y-4">
            <input
              className="w-full px-4 py-3 rounded-lg bg-farm-bg border border-farm-card text-white placeholder-slate-500 focus:outline-none focus:border-farm-accent"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="w-full px-4 py-3 rounded-lg bg-farm-bg border border-farm-card text-white placeholder-slate-500 focus:outline-none focus:border-farm-accent"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            {error && <p className="text-farm-accent text-sm">{error}</p>}
            <button
              className="w-full py-3 rounded-lg bg-farm-accent hover:brightness-110 font-semibold transition disabled:opacity-50"
              onClick={submit}
              disabled={loading}
            >
              {loading ? 'Loading…' : mode === 'login' ? 'Log in' : 'Register'}
            </button>
            <button
              className="w-full py-2 text-sm text-slate-400 hover:text-slate-200 transition"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
