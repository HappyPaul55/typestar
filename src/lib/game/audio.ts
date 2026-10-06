/**
 * Small browser sound effects for the game island.
 *
 * Each sound is preloaded and played from a small pool of `Audio` elements so
 * quick repeats (two mistakes in a row) overlap instead of cutting each other
 * off. Everything is browser-only and guarded, so importing this module during
 * the static build is safe.
 */

const SOUNDS = {
  error: "/audio/error.mp3",
} as const;

export type SoundName = keyof typeof SOUNDS;

/** How many voices to keep per sound, so rapid triggers can overlap. */
const POOL_SIZE = 4;
/** Ignore repeats closer together than this (key auto-repeat, double errors). */
const MIN_GAP_MS = 60;
/** Playback level for the effects, 0..1. The error blip is deliberately soft. */
const VOLUME = 0.35;

const pools = new Map<SoundName, HTMLAudioElement[]>();
const lastPlayed = new Map<SoundName, number>();
let cursor = 0;

function pool(name: SoundName): HTMLAudioElement[] {
  let voices = pools.get(name);
  if (!voices) {
    voices = Array.from({ length: POOL_SIZE }, () => {
      const audio = new Audio(SOUNDS[name]);
      audio.preload = "auto";
      audio.volume = VOLUME;
      return audio;
    });
    pools.set(name, voices);
  }
  return voices;
}

/** Fetch and decode the sounds ahead of time. Call once on mount. */
export function preloadSounds(): void {
  if (typeof window === "undefined") return;
  for (const name of Object.keys(SOUNDS) as SoundName[]) pool(name);
}

/** Play a sound, reusing the voice pool so nothing cuts out. */
export function playSound(name: SoundName): void {
  if (typeof window === "undefined") return;

  const now = performance.now();
  if (now - (lastPlayed.get(name) ?? -Infinity) < MIN_GAP_MS) return;
  lastPlayed.set(name, now);

  const voices = pool(name);
  const audio = voices[cursor++ % voices.length];
  try {
    audio.currentTime = 0;
  } catch {
    // Not seekable yet; play() starts from the beginning regardless.
  }
  void audio.play().catch(() => {
    // Autoplay can be blocked before the first user gesture; ignore.
  });
}
