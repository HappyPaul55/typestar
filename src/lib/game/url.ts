/**
 * Run settings in the URL hash, so a run can be shared with the exact same
 * difficulty and run mode (the video id is already in the path):
 *
 *   /play/<id>#difficulty=hard&run=practise
 */

import { isFailMode, isGameMode, type FailMode, type GameMode } from "./engine";

export interface ParsedHash {
  mode?: GameMode;
  failMode?: FailMode;
}

/** Build the hash for a pair of settings. */
export function buildHash(state: { mode: GameMode; failMode: FailMode }): string {
  return `#difficulty=${state.mode}&run=${state.failMode}`;
}

/** Read whatever valid settings are present in a hash; invalid keys are omitted. */
export function parseHash(hash: string): ParsedHash {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const mode = params.get("difficulty");
  const run = params.get("run");
  return {
    ...(isGameMode(mode) ? { mode } : {}),
    ...(isFailMode(run) ? { failMode: run } : {}),
  };
}
