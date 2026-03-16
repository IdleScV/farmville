import { AuthResponse } from '@farmville/shared';
import { apiFetch, setToken } from './main';

export function renderAuth(app: HTMLElement): void {
  let mode: 'login' | 'register' = 'login';

  function render(): void {
    app.innerHTML = `
      <div class="auth-screen">
        <h1>🌾 Farmville</h1>
        <div class="auth-card">
          <h2>${mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <input id="username" type="text" placeholder="Username" autocomplete="username" />
          <input id="password" type="password" placeholder="Password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" />
          <p class="error-msg" id="auth-error"></p>
          <button class="btn btn-primary" id="auth-submit">
            ${mode === 'login' ? 'Log in' : 'Register'}
          </button>
          <button class="btn btn-ghost" id="auth-toggle">
            ${mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    `;

    document.getElementById('auth-toggle')!.addEventListener('click', () => {
      mode = mode === 'login' ? 'register' : 'login';
      render();
    });

    document.getElementById('auth-submit')!.addEventListener('click', submit);
    document.getElementById('password')!.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
  }

  async function submit(): Promise<void> {
    const username = (document.getElementById('username') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const errorEl = document.getElementById('auth-error')!;
    errorEl.textContent = '';

    if (!username || !password) {
      errorEl.textContent = 'Please fill in both fields.';
      return;
    }

    try {
      const data = await apiFetch<AuthResponse>(
        mode === 'login' ? '/auth/login' : '/auth/register',
        { method: 'POST', body: JSON.stringify({ username, password }) },
      );
      setToken(data.token);
      // Reload — boot() will redirect to game
      window.location.reload();
    } catch (err) {
      errorEl.textContent = (err as Error).message;
    }
  }

  render();
}
