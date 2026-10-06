/**
 * Run settings in the URL hash, so a run can be shared with the exact same
 * difficulty, run mode and playback speed (the video id is already in the
 * path):
 *
 *   /play/<id>#difficulty=hard&run=practise&speed=1.25
 *
 * Anything left at its default is omitted, so the common case has no hash at
 * all and shared links stay short.
 */

import {
  DEFAULT_FAIL_MODE,
  DEFAULT_MODE,
  DEFAULT_SPEED,
  isFailMode,
  isGameMode,
  isPlaybackSpeed,
  type FailMode,
  type GameMode,
  type PlaybackSpeed,
} from "./engine";

export interface ParsedHash {
  mode?: GameMode;
  failMode?: FailMode;
  speed?: PlaybackSpeed;
}

/** Build the hash for a set of settings; defaults are left out. */
export function buildHash(state: {
  mode: GameMode;
  failMode: FailMode;
  speed?: PlaybackSpeed;
}): string {
  const parts: string[] = [];
  if (state.mode !== DEFAULT_MODE) parts.push(`difficulty=${state.mode}`);
  if (state.failMode !== DEFAULT_FAIL_MODE) parts.push(`run=${state.failMode}`);
  if (state.speed !== undefined && state.speed !== DEFAULT_SPEED) {
    parts.push(`speed=${state.speed}`);
  }
  return parts.length ? `#${parts.join("&")}` : "";
}

/** Read whatever valid settings are present in a hash; invalid keys are omitted. */
export function parseHash(hash: string): ParsedHash {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const mode = params.get("difficulty");
  const run = params.get("run");
  const rawSpeed = params.get("speed");
  const speed = rawSpeed === null ? Number.NaN : Number(rawSpeed);
  return {
    ...(isGameMode(mode) ? { mode } : {}),
    ...(isFailMode(run) ? { failMode: run } : {}),
    ...(isPlaybackSpeed(speed) ? { speed } : {}),
  };
}
