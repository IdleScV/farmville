const API = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL ?? 'http://localhost:3001';

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
  const res = await fetch(`${API}${path}`, {
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

export { API };
