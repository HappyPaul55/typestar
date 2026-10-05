/**
 * Binds the pure game reducer to React and the player clock.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  createGameState,
  DEFAULT_GRACE,
  DEFAULT_LEAD,
  gameReducer,
  type GameAction,
  type GameConfig,
  type GameMode,
  type GameState,
} from "../../../lib/game/engine";
import type { TrackWord } from "../../../lib/track/types";

export interface UseGameLoopOptions {
  words: TrackWord[];
  offset: number;
  mode: GameMode;
  running: boolean;
  /** Throttled clock used to drive expiry checks. */
  time: number;
  /** Live clock read on every keystroke for accurate scoring. */
  getTime: () => number;
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
  offset,
  mode,
  running,
  time,
  getTime,
}: UseGameLoopOptions): GameLoop {
  const config = useMemo<GameConfig>(
    () => ({ words, offset, mode, lead: DEFAULT_LEAD, grace: DEFAULT_GRACE }),
    [words, offset, mode],
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
  useEffect(() => {
    if (!running) return;
    const previous = lastTimeRef.current;
    lastTimeRef.current = time;
    // A large jump means the viewer seeked; resync rather than fire a burst of
    // missed words.
    if (Math.abs(time - previous) > 1.5) dispatch({ type: "resync", time });
    else dispatch({ type: "tick", time });
  }, [time, running]);

  const onKey = useCallback(
    (key: string) => dispatch({ type: "key", key, time: getTime() }),
    [getTime],
  );
  const reset = useCallback(() => dispatch({ type: "reset" }), []);
  const finish = useCallback(
    () => dispatch({ type: "tick", time: Number.MAX_SAFE_INTEGER }),
    [],
  );

  return { state, onKey, reset, finish };
}
