/**
 * Server-side replay of a submitted run.
 *
 * The score is never trusted from the client. The recorded inputs are replayed
 * against the track's own timings, through the *same* pure reducers the browser
 * uses, with the same configs (`makeConfig` / `singConfig`), so the derived
 * score is the game's own.
 *
 * Ticks are generated here rather than recorded: they only resolve words/notes
 * whose window has closed, and a fine cadence reproduces the browser's outcome.
 * A `tick` is emitted up to each recorded event, then to the end of the last
 * word's window, before the run is finished.
 */

import {
  accuracyOf,
  createGameState,
  gameReducer,
  progressOf,
  type GameAction,
} from "../game/engine";
import type { RunSettings } from "../game/game";
import {
  createSingState,
  singPitchAccuracy,
  singProgress,
  singReducer,
  type SingAction,
} from "../game/sing";
import { singConfig } from "../game/sing-game";
import { makeConfig } from "../game/type-game";
import type { PlayStyle } from "../game/modes";
import type { Track } from "../track/types";
import type { TimelineEvent } from "./timeline";

/** The outcome of a replay: exactly what a board stores. */
export interface RunScore {
  score: number;
  accuracy: number;
  maxCombo: number;
  hits: number;
  misses: number;
  progress: number;
  failed: boolean;
}

/** How often the server ticks the clock while replaying, in seconds. */
const TICK_STEP = 0.05;

function byTime(events: readonly TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => a.at - b.at);
}

export function replayType(
  track: Track,
  run: RunSettings,
  events: readonly TimelineEvent[],
): RunScore {
  const config = makeConfig(track, run);
  let state = createGameState(config.words.length);
  const apply = (action: GameAction) => {
    state = gameReducer(state, action, config);
  };

  let nextTick = 1; // The next tick lands at `nextTick * TICK_STEP`.
  const tickTo = (limit: number) => {
    while (nextTick * TICK_STEP <= limit + 1e-9) {
      apply({ type: "tick", time: nextTick * TICK_STEP });
      nextTick += 1;
    }
  };

  for (const event of byTime(events)) {
    // A backward jump (a Practise rewind) resets the tick grid so ticks never
    // run backwards; the recorded times themselves drive the state.
    if (nextTick * TICK_STEP > event.at + 1e-9) {
      nextTick = Math.floor(event.at / TICK_STEP) + 1;
    }
    tickTo(event.at);

    switch (event.t) {
      case "k":
        apply({ type: "key", key: event.key, time: event.at });
        break;
      case "r":
        apply({ type: "resync", time: event.at });
        break;
      case "w":
        apply({ type: "clearRewind" });
        break;
      case "f":
        apply({ type: "finish" });
        break;
      case "s":
        // A pitch sample is meaningless to the typing engine.
        break;
    }
  }

  // Tick to the end of the last word's window so trailing misses land, then
  // finish, which resolves anything still pending.
  const lastWord = config.words[config.words.length - 1];
  const end = lastWord
    ? lastWord.end + config.offset + config.grace + TICK_STEP
    : nextTick * TICK_STEP;
  tickTo(end);
  apply({ type: "finish" });

  return {
    score: state.score,
    accuracy: accuracyOf(state),
    maxCombo: state.maxCombo,
    hits: state.hits,
    misses: state.misses,
    progress: progressOf(state, config),
    failed: state.failed,
  };
}

export function replaySing(
  track: Track,
  run: RunSettings,
  events: readonly TimelineEvent[],
): RunScore {
  const config = singConfig(track, run);
  let state = createSingState(config.notes.length);
  const apply = (action: SingAction) => {
    state = singReducer(state, action, config);
  };

  apply({ type: "start", time: 0 });
  for (const event of byTime(events)) {
    switch (event.t) {
      case "s":
        apply({ type: "sample", time: event.at, midi: event.m, rms: event.r });
        break;
      case "w":
        apply({ type: "clearRewind" });
        break;
      case "f":
        apply({ type: "finish" });
        break;
      default:
        break;
    }
  }
  apply({ type: "finish" });

  return {
    score: state.score,
    accuracy: singPitchAccuracy(state),
    maxCombo: state.maxCombo,
    hits: state.hits,
    misses: state.misses,
    progress: singProgress(state, config.notes.length),
    failed: state.failed,
  };
}

/** Replay a run with the engine its play style uses. */
export function replayRun(
  style: PlayStyle,
  track: Track,
  run: RunSettings,
  events: readonly TimelineEvent[],
): RunScore {
  return style === "sing" ? replaySing(track, run, events) : replayType(track, run, events);
}
