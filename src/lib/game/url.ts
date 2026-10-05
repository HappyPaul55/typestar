/**
 * Run settings and stats in the URL hash, so a result can be shared with the
 * exact same difficulty, run mode and target:
 *
 *   /play/<id>#difficulty=hard&run=practise&score=1240&acc=98&combo=42&hits=120&misses=3&perfect=8
 */

import { isFailMode, isGameMode, type FailMode, type GameMode } from "./engine";

export interface SharedStats {
  score: number;
  /** Accuracy as a percentage, 0..100. */
  accuracy: number;
  maxCombo: number;
  hits: number;
  misses: number;
  perfectLines: number;
}

export interface ParsedHash {
  mode?: GameMode;
  failMode?: FailMode;
  stats?: SharedStats;
}

/** Build the hash for a set of settings, optionally with the sender's stats. */
export function buildHash(state: {
  mode: GameMode;
  failMode: FailMode;
  stats?: SharedStats;
}): string {
  const params = new URLSearchParams();
  params.set("difficulty", state.mode);
  params.set("run", state.failMode);
  if (state.stats) {
    params.set("score", String(Math.round(state.stats.score)));
    params.set("acc", String(Math.round(state.stats.accuracy)));
    params.set("combo", String(state.stats.maxCombo));
    params.set("hits", String(state.stats.hits));
    params.set("misses", String(state.stats.misses));
    params.set("perfect", String(state.stats.perfectLines));
  }
  return `#${params.toString()}`;
}

function numberParam(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  if (raw === null) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

/** Read valid settings and stats from a hash; invalid keys are omitted. */
export function parseHash(hash: string): ParsedHash {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const mode = params.get("difficulty");
  const run = params.get("run");
  const score = numberParam(params, "score");

  const stats: SharedStats | undefined =
    score === undefined
      ? undefined
      : {
          score,
          accuracy: numberParam(params, "acc") ?? 0,
          maxCombo: numberParam(params, "combo") ?? 0,
          hits: numberParam(params, "hits") ?? 0,
          misses: numberParam(params, "misses") ?? 0,
          perfectLines: numberParam(params, "perfect") ?? 0,
        };

  return {
    ...(isGameMode(mode) ? { mode } : {}),
    ...(isFailMode(run) ? { failMode: run } : {}),
    ...(stats ? { stats } : {}),
  };
}
