/**
 * Tiny, safe `localStorage` helpers. Every game setting is best-effort: private
 * mode or a full quota must never break the game.
 */

const PREFIX = "typestar:";

export function readSetting<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeSetting(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore quota/private-mode failures.
  }
}

export const SETTING_MODE = "mode";
export const SETTING_FAIL_MODE = "failMode";
export const SETTING_SPEED = "speed";
export const SETTING_PLAY_STYLE = "playStyle";
export const SETTING_OFFSET_PREFIX = "offset:";
/** Set once the fullscreen nudge has been shown, so it only appears once. */
export const SETTING_FULLSCREEN_HINT = "fullscreenHint";

/** Format seconds as `m:ss`. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

/** Format seconds as a wordy duration, e.g. `3m 9s`, `45s`, `1h 2m`. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0s";
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  if (minutes > 0) return rest > 0 ? `${minutes}m ${rest}s` : `${minutes}m`;
  return `${rest}s`;
}
