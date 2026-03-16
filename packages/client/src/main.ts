import { renderAuth } from './auth';
import { renderGame } from './game';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API = ((import.meta as any).env as Record<string, string> | undefined)?.VITE_API_URL ?? 'http://localhost:3001';
export const apiUrl = API;

export function getToken(): string | null {
  return localStorage.getItem('fv_token');
}

export function setToken(token: string): void {
  localStorage.setItem('fv_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('fv_token');
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${apiUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

function boot(): void {
  const app = document.getElementById('app')!;
  if (getToken()) {
    renderGame(app);
  } else {
    renderAuth(app);
  }
}

boot();
