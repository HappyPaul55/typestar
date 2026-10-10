/**
 * Binds the pure singing reducer to React and the player clock.
 *
 * Mirrors `useGameLoop`: it owns the reducer, rebuilds the config when the
 * track or settings change, and exposes a `sample` the microphone hook calls.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { FailMode, GameMode } from "../../../lib/game/engine";
import {
  createSingState,
  makeSingConfig,
  singReducer,
  SING_TOLERANCE,
  type SingAction,
  type SingConfig,
  type SingState,
} from "../../../lib/game/sing";
import type { TrackNote } from "../../../lib/track/types";

export interface UseSingLoopOptions {
  notes: TrackNote[];
  offset: number;
  mode: GameMode;
  failMode: FailMode;
  /** Live player clock, read on every sample. */
  getTime: () => number;
  /** Send the singer back to a time (Practise rewinds). */
  seek?: (seconds: number) => void;
}

export interface SingLoop {
  state: SingState;
  /** Feed one detected frame (called from the microphone loop). */
  sample(midi: number | null, rms: number): void;
  /** Begin the run from the current clock position. */
  start(): void;
  reset(): void;
  finish(): void;
}

export function useSingLoop({
  notes,
  offset,
  mode,
  failMode,
  getTime,
  seek,
}: UseSingLoopOptions): SingLoop {
  const config = useMemo<SingConfig>(
    () =>
      makeSingConfig(notes, {
        offset,
        tolerance: SING_TOLERANCE[mode],
        failMode,
      }),
    [notes, offset, mode, failMode],
  );
  const configRef = useRef(config);
  configRef.current = config;

  const reduce = useCallback(
    (state: SingState, action: SingAction) => singReducer(state, action, configRef.current),
    [],
  );
  const [state, dispatch] = useReducer(reduce, notes.length, createSingState);

  // A new track (or a new tolerance / run mode) starts from a clean slate.
  useEffect(() => {
    dispatch({ type: "reset" });
  }, [notes, mode, failMode]);

  // Practise: when the reducer asks for a rewind, seek and clear the request.
  useEffect(() => {
    if (state.rewindTo === null) return;
    seek?.(state.rewindTo);
    dispatch({ type: "clearRewind" });
  }, [state.rewindTo, seek]);

  const sample = useCallback(
    (midi: number | null, rms: number) =>
      dispatch({ type: "sample", time: getTime(), midi, rms }),
    [getTime],
  );
  const start = useCallback(
    () => dispatch({ type: "start", time: getTime() }),
    [getTime],
  );
  const reset = useCallback(() => dispatch({ type: "reset" }), []);
  const finish = useCallback(() => dispatch({ type: "finish" }), []);

  return { state, sample, start, reset, finish };
}
