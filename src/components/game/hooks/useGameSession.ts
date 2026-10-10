/**
 * Binds a {@link GameEngine} to React and the player clock.
 *
 * Replaces the old, near-duplicate `useGameLoop` and `useSingLoop`: whichever
 * engine is in play, this hook owns its reducer state, feeds it the clock ticks,
 * keystrokes and microphone samples, and applies Practise rewinds. The engine
 * decides which of those it actually consumes.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type {
  AnyGameEngine,
  GameAction,
  RunSettings,
} from "../../../lib/game/game";
import type { Track } from "../../../lib/track/types";

export interface UseGameSessionOptions {
  engine: AnyGameEngine;
  track: Track | null;
  run: RunSettings;
  /** True while the run is playing, so the clock drives the typing ticks. */
  running: boolean;
  /** Throttled clock used to drive expiry checks. */
  time: number;
  /** Live clock read on every keystroke / sample for accurate scoring. */
  getTime: () => number;
  /** Send the player back to a time (Practise rewinds). */
  seek?: (seconds: number) => void;
}

export interface GameSession {
  /** The engine's opaque state, read back through the engine's selectors. */
  state: unknown;
  onKey(key: string): void;
  sample(midi: number | null, rms: number): void;
  /** Begin a run from the current clock position (singing). */
  start(): void;
  reset(): void;
  /** End the run now, judging whatever is left (e.g. the song ended). */
  finish(): void;
}

export function useGameSession({
  engine,
  track,
  run,
  running,
  time,
  getTime,
  seek,
}: UseGameSessionOptions): GameSession {
  const config = useMemo(() => engine.config(track, run), [engine, track, run]);
  const configRef = useRef(config);
  configRef.current = config;
  const engineRef = useRef(engine);
  engineRef.current = engine;

  const reduce = useCallback(
    (state: unknown, action: GameAction) =>
      engineRef.current.reduce(state, action, configRef.current),
    [],
  );
  const [state, dispatch] = useReducer(
    reduce,
    track,
    (initial: Track | null) => engine.createState(initial) as unknown,
  );

  // The reducer state is only valid for the engine and reset it was created
  // under. When the play style changes, the reset below lands *after* this
  // render, so for the in-between render the new engine would read the old
  // engine's state shape (e.g. typing reading `input` off a singing state) and
  // crash. Hand back a freshly-built state whenever the owner has changed.
  const ownerKey = `${engine.id}|${track?.id ?? ""}|${run.difficulty}|${run.runMode}`;
  const ownerRef = useRef(ownerKey);
  const stale = ownerRef.current !== ownerKey;
  const effectiveState = stale ? (engine.createState(track) as unknown) : state;

  // A new track, engine, difficulty or run mode starts from a clean slate.
  useEffect(() => {
    ownerRef.current = ownerKey;
    dispatch({ type: "reset" });
  }, [ownerKey]);

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

  // Practise: when the engine asks for a rewind, seek and clear the request.
  const rewindTo =
    (effectiveState as { rewindTo?: number | null } | null)?.rewindTo ?? null;
  useEffect(() => {
    if (rewindTo === null) return;
    pendingSeekRef.current = true;
    seek?.(rewindTo);
    dispatch({ type: "clearRewind" });
  }, [rewindTo, seek]);

  const onKey = useCallback(
    (key: string) => dispatch({ type: "key", key, time: getTime() }),
    [getTime],
  );
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

  return { state: effectiveState, onKey, sample, start, reset, finish };
}
