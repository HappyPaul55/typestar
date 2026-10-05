/**
 * Binds the pure game reducer to React and the player clock.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  createGameState,
  DEFAULT_GRACE,
  DEFAULT_LEAD,
  gameReducer,
  type FailMode,
  type GameAction,
  type GameConfig,
  type GameMode,
  type GameState,
} from "../../../lib/game/engine";
import type { TrackLine, TrackWord } from "../../../lib/track/types";

export interface UseGameLoopOptions {
  words: TrackWord[];
  lines: TrackLine[];
  offset: number;
  mode: GameMode;
  failMode: FailMode;
  running: boolean;
  /** Throttled clock used to drive expiry checks. */
  time: number;
  /** Live clock read on every keystroke for accurate scoring. */
  getTime: () => number;
  /** Send the player back to a time (Practise rewinds). */
  seek?: (seconds: number) => void;
}

export interface GameLoop {
  state: GameState;
  onKey(key: string): void;
  reset(): void;
  /** Mark every remaining word missed and finish (e.g. when the video ends). */
  finish(): void;
}

export function useGameLoop({
  words,
  lines,
  offset,
  mode,
  failMode,
  running,
  time,
  getTime,
  seek,
}: UseGameLoopOptions): GameLoop {
  const config = useMemo<GameConfig>(
    () => ({ words, lines, offset, mode, failMode, lead: DEFAULT_LEAD, grace: DEFAULT_GRACE }),
    [words, lines, offset, mode, failMode],
  );
  const configRef = useRef(config);
  configRef.current = config;

  const reduce = useCallback(
    (state: GameState, action: GameAction) => gameReducer(state, action, configRef.current),
    [],
  );
  const [state, dispatch] = useReducer(reduce, words.length, createGameState);

  useEffect(() => {
    dispatch({ type: "reset" });
  }, [words]);

  const lastTimeRef = useRef(0);
  // Set while a Practise rewind is being applied, so the resulting backward
  // jump in the clock is not mistaken for a manual seek.
  const pendingSeekRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const previous = lastTimeRef.current;
    lastTimeRef.current = time;
    if (pendingSeekRef.current && time <= previous) {
      pendingSeekRef.current = false;
      return;
    }
    // A large jump means the viewer seeked; resync rather than fire a burst of
    // missed words.
    if (Math.abs(time - previous) > 1.5) dispatch({ type: "resync", time });
    else dispatch({ type: "tick", time });
  }, [time, running]);

  // Practise: when the reducer asks for a rewind, seek and clear the request.
  useEffect(() => {
    if (state.rewindTo === null) return;
    pendingSeekRef.current = true;
    seek?.(state.rewindTo);
    dispatch({ type: "clearRewind" });
  }, [state.rewindTo, seek]);

  const onKey = useCallback(
    (key: string) => dispatch({ type: "key", key, time: getTime() }),
    [getTime],
  );
  const reset = useCallback(() => dispatch({ type: "reset" }), []);
  const finish = useCallback(() => dispatch({ type: "finish" }), []);

  return { state, onKey, reset, finish };
}
