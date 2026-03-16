import { FarmState, Plot, CropType } from '@farmville/shared';
import { HarvestResponse, PlantResponse } from '@farmville/shared';
import { apiFetch, clearToken } from './main';

let state: FarmState | null = null;
let appEl: HTMLElement;
let tickTimer: ReturnType<typeof setInterval> | null = null;

export async function renderGame(app: HTMLElement): Promise<void> {
  appEl = app;
  app.innerHTML = `<div class="game-screen"><p style="color:var(--muted)">Loading farm...</p></div>`;

  try {
    state = await apiFetch<FarmState>('/farm');
  } catch {
    clearToken();
    window.location.reload();
    return;
  }

  render();
  startTick();
}

function render(): void {
  if (!state) return;
  appEl.innerHTML = `
    <div class="game-screen">
      ${renderHud()}
      <div class="farm-grid" id="farm-grid">
        ${state.plots.map(renderPlot).join('')}
      </div>
    </div>
  `;

  appEl.querySelectorAll<HTMLElement>('.plot').forEach((el) => {
    el.addEventListener('click', () => onPlotClick(el.dataset.id!));
  });
}

function renderHud(): string {
  const { coins, level, xp } = state!.user;
  const threshold = level * 100;
  return `
    <div class="hud">
      <div class="hud-item"><span class="hud-label">Coins</span><span class="hud-value hud-coins">🪙 ${coins}</span></div>
      <div class="hud-item"><span class="hud-label">Level</span><span class="hud-value hud-level">${level}</span></div>
      <div class="hud-item"><span class="hud-label">XP</span><span class="hud-value hud-xp">${xp} / ${threshold}</span></div>
      <button class="btn btn-ghost" id="logout-btn" style="margin-left:16px">Logout</button>
    </div>
  `;
}

function renderPlot(plot: Plot): string {
  const crop = plot.crop_type ? state!.cropTypes.find((c) => c.id === plot.crop_type) : null;
  const emoji = plot.state === 'empty' ? '🟫' : (crop?.emoji ?? '🌱');
  const timer = plot.state === 'growing' && plot.planted_at && crop
    ? formatTimeLeft(plot.planted_at, crop.growth_seconds)
    : '';

  return `
    <div class="plot ${plot.state}" data-id="${plot.id}" title="${plotTitle(plot, crop)}">
      <span>${emoji}</span>
      ${timer ? `<span class="plot-timer">${timer}</span>` : ''}
      ${plot.state === 'ready' ? `<span class="plot-timer">READY</span>` : ''}
    </div>
  `;
}

function plotTitle(plot: Plot, crop: CropType | null | undefined): string {
  if (plot.state === 'empty') return 'Click to plant';
  if (plot.state === 'ready') return `${crop?.name ?? 'Crop'} — click to harvest`;
  if (plot.state === 'growing' && crop && plot.planted_at) {
    const left = Math.max(0, crop.growth_seconds - (Date.now() - new Date(plot.planted_at).getTime()) / 1000);
    return `${crop.name} — ${formatDuration(left)} left`;
  }
  return '';
}

function onPlotClick(plotId: string): void {
  if (!state) return;
  const plot = state.plots.find((p) => p.id === plotId);
  if (!plot) return;

  if (plot.state === 'empty') {
    showCropPanel(plot);
  } else if (plot.state === 'ready') {
    harvest(plotId);
  }
}

async function harvest(plotId: string): Promise<void> {
  try {
    const result = await apiFetch<HarvestResponse>('/farm/harvest', {
      method: 'POST',
      body: JSON.stringify({ plotId }),
    });

    state!.user.coins = result.coins;
    state!.user.xp = result.xp;
    if (result.leveledUp && result.newLevel) {
      state!.user.level = result.newLevel;
      toast(`🎉 Level up! You're now level ${result.newLevel}!`);
    }

    const idx = state!.plots.findIndex((p) => p.id === plotId);
    if (idx !== -1) state!.plots[idx] = result.plot;

    render();
  } catch (err) {
    toast((err as Error).message, true);
  }
}

function showCropPanel(plot: Plot): void {
  const overlay = document.createElement('div');
  overlay.className = 'panel-overlay';
  overlay.innerHTML = `
    <div class="panel">
      <h3>Choose a crop to plant</h3>
      <div class="crop-list">
        ${state!.cropTypes.map((crop) => {
          const locked = state!.user.level < crop.min_level;
          const cantAfford = state!.user.coins < crop.seed_cost;
          const disabled = locked || cantAfford;
          const meta = locked
            ? `Requires level ${crop.min_level}`
            : `⏱ ${formatDuration(crop.growth_seconds)}  •  💰 +${crop.harvest_yield}`;
          return `
            <div class="crop-item ${disabled ? 'disabled' : ''}" data-crop="${crop.id}">
              <span class="crop-emoji">${crop.emoji}</span>
              <div class="crop-info">
                <div class="crop-name">${crop.name}</div>
                <div class="crop-meta">${meta}</div>
              </div>
              <span class="crop-cost">🪙 ${crop.seed_cost}</span>
            </div>
          `;
        }).join('')}
      </div>
      <button class="btn btn-ghost panel-close">Cancel</button>
    </div>
  `;

  overlay.querySelector('.panel-close')!.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelectorAll<HTMLElement>('.crop-item:not(.disabled)').forEach((el) => {
    el.addEventListener('click', async () => {
      overlay.remove();
      await plant(plot.id, el.dataset.crop!);
    });
  });

  document.body.appendChild(overlay);
}

async function plant(plotId: string, cropTypeId: string): Promise<void> {
  try {
    const result = await apiFetch<PlantResponse>('/farm/plant', {
      method: 'POST',
      body: JSON.stringify({ plotId, cropTypeId }),
    });

    state!.user.coins = result.coins;
    const idx = state!.plots.findIndex((p) => p.id === plotId);
    if (idx !== -1) state!.plots[idx] = result.plot;

    render();
  } catch (err) {
    toast((err as Error).message, true);
  }
}

// ── Tick: update growing plot timers every second ─────────────────────────

function startTick(): void {
  tickTimer = setInterval(() => {
    if (!state) return;
    let changed = false;
    state.plots.forEach((plot, idx) => {
      if (plot.state === 'growing' && plot.planted_at && plot.crop_type) {
        const crop = state!.cropTypes.find((c) => c.id === plot.crop_type);
        if (crop) {
          const elapsed = (Date.now() - new Date(plot.planted_at).getTime()) / 1000;
          if (elapsed >= crop.growth_seconds) {
            state!.plots[idx] = { ...plot, state: 'ready' };
            changed = true;
          }
        }
      }
    });
    // Always refresh timers, re-render if state changed
    updateTimers();
    if (changed) render();
  }, 1000);
}

function updateTimers(): void {
  document.querySelectorAll<HTMLElement>('.plot.growing').forEach((el) => {
    const plotId = el.dataset.id!;
    const plot = state?.plots.find((p) => p.id === plotId);
    const crop = plot?.crop_type ? state?.cropTypes.find((c) => c.id === plot.crop_type) : null;
    if (!plot || !crop || !plot.planted_at) return;
    const left = Math.max(0, crop.growth_seconds - (Date.now() - new Date(plot.planted_at).getTime()) / 1000);
    const timerEl = el.querySelector('.plot-timer');
    if (timerEl) timerEl.textContent = formatTimeLeft(plot.planted_at, crop.growth_seconds);
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatTimeLeft(plantedAt: string, growthSeconds: number): string {
  const left = Math.max(0, growthSeconds - (Date.now() - new Date(plantedAt).getTime()) / 1000);
  return formatDuration(left);
}

function formatDuration(seconds: number): string {
  const s = Math.ceil(seconds);
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

function toast(msg: string, error = false): void {
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.color = error ? 'var(--red)' : 'var(--green)';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
