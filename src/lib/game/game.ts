/**
 * The shared game-engine contract.
 *
 * Every play style — Type today, Sing today, and Combo soon — is one
 * implementation of {@link GameEngine}. The shell (`GameApp`) and every shared
 * component (HUD, start screen, results, stage) talk only to this contract, so
 * a new style is a new file, not a new branch in a dozen places.
 *
 * Engines are pure: they hold no state of their own. `useGameSession` owns the
 * state with a reducer built from the engine, and calls back into the engine for
 * the derived values (summary, lyric view, results). That keeps the rules
 * unit-testable without React, exactly like the two reducers they wrap.
 */

import type {
  FailMode,
  GameMode,
  PlaybackSpeed,
  Rank,
  WordResult,
} from "./engine";
import { DEFAULT_SPEED, SPEED_LABEL } from "./engine";
import type { PlayStyle } from "./modes";
import type { NoteResult } from "./sing";
import type { Track } from "../track/types";

export type { PlayStyle };

/** The run-wide settings every style shares. */
export interface RunSettings {
  /** Difficulty: typing forgiveness, or singing pitch tolerance. */
  difficulty: GameMode;
  /** How the run ends (normal / instant / fun / practise). */
  runMode: FailMode;
  speed: PlaybackSpeed;
  style: PlayStyle;
  /** The player's per-track sync nudge, in seconds. */
  offset: number;
}

/** The union of every action any engine may receive. Each engine ignores the
 * actions it does not consume, which is what lets Combo reuse this one set. */
export type GameAction =
  | { type: "reset" }
  | { type: "tick"; time: number }
  | { type: "resync"; time: number }
  | { type: "key"; key: string; time: number }
  | { type: "start"; time: number }
  | { type: "sample"; time: number; midi: number | null; rms: number }
  | { type: "finish" }
  | { type: "clearRewind" };

/** Everything the derived views need that is not part of the run settings. */
export interface RunContext {
  /** The player's live clock, in seconds. */
  time: number;
  /** Microphone refused for this run: scored singing falls back to karaoke. */
  micFallback: boolean;
  /** The song's artist, when known (karaoke shows it). */
  artist?: string;
}

/** What a style can do, so the shared UI can show or hide the right controls. */
export interface Capabilities {
  /** Keeps a score, combo and accuracy (false for karaoke). */
  scored: boolean;
  /** Shows the score/combo/accuracy block (every style keeps the bar). */
  scoreBar: boolean;
  /** Consumes keystrokes (typing). */
  keyboard: boolean;
  /** Needs the microphone and per-frame pitch samples. */
  microphone: boolean;
  /** Which lane(s) the stage shows. */
  lane: "lyric" | "pitch" | "both";
  /** The difficulty selector applies. */
  difficulty: boolean;
  /** The run-mode selector applies. */
  runMode: boolean;
}

/** The values the HUD shows while a run is in progress. */
export interface RunSummary {
  score: number;
  combo: number;
  multiplier: number;
  accuracy: number;
  /** True once a keystroke or pitched frame makes accuracy meaningful. */
  attempted: boolean;
  /** How far through the song the run is, 0..1. */
  progress: number;
  /** Whole lines cleared without a miss or a wrong key (typing). */
  perfectLines: number;
  /** Wrong keys typed (typing); drives the error blip. */
  errorKeys: number;
  finished: boolean;
  failed: boolean;
}

/** What the lyric highway should show for the current state. */
export interface LyricView {
  pointer: number;
  results: WordResult[];
  input: string;
  /** Karaoke-style highlight: the words follow the music, not the keyboard. */
  followMusic: boolean;
}

/** What the pitch lane should show (singing only). */
export interface PitchView {
  results: NoteResult[];
  pointer: number;
}

/** One labelled statistic on the results screen. */
export interface Metric {
  label: string;
  value: string;
}

/** Everything the results modal needs, produced by the engine. */
export interface ResultsSummary {
  /** False for karaoke: no score, no rank, no personal best. */
  scored: boolean;
  score: number;
  failed: boolean;
  failReason: "score" | "mistake" | "streak" | null;
  /** The human sentence for why the run ended, or null. */
  failMessage: string | null;
  rank: Rank | null;
  /** The canonical `/play/...` path for the track, for a shared link. */
  sharePath: string;
  /** localStorage key for the personal best (scored runs only). */
  bestKey: string;
  /** How far through the song the run got, 0..1. */
  progress: number;
  metrics: Metric[];
  /** The settings a shared link should carry. */
  share: {
    mode: GameMode;
    failMode: FailMode;
    speed: PlaybackSpeed;
    style: PlayStyle;
  };
}

/**
 * One play style. `S` is the style's own state shape; it stays opaque to the
 * shell, which only ever reads it back through the methods below.
 */
export interface GameEngine<S = unknown> {
  readonly id: PlayStyle;
  readonly label: string;
  capabilities(track: Track | null, micFallback: boolean): Capabilities;
  /** The help line the start screen shows for this style. */
  help(track: Track | null, micFallback: boolean): string;
  createState(track: Track | null): S;
  config(track: Track | null, run: RunSettings): unknown;
  reduce(state: S, action: GameAction, config: unknown): S;
  summary(state: S, track: Track | null, run: RunSettings, ctx: RunContext): RunSummary;
  lyricView(state: S, track: Track | null, run: RunSettings, ctx: RunContext): LyricView;
  /** The note lane (singing); null when the style has no pitch lane. */
  pitchView(state: S, track: Track | null, run: RunSettings, ctx: RunContext): PitchView | null;
  results(state: S, track: Track | null, run: RunSettings, ctx: RunContext): ResultsSummary;
}

/** An engine with its state type erased, as the shell holds it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGameEngine = GameEngine<any>;

/** The personal-best key. One scheme for every style, so results stay
 * consistent: style + track + difficulty + run mode + speed. */
export function bestKey(style: PlayStyle, trackId: string, run: RunSettings): string {
  return `best:${style}:${trackId}:${run.difficulty}:${run.runMode}:${run.speed}`;
}

/**
 * The run's settings as results-grid metrics, shared by every style. The run
 * mode and the playback speed are left out at their normal values (normal, and
 * 1×), so the everyday case shows nothing but the score; anything else is worth
 * stating. `replays` is only passed by Practise.
 */
export function runMetrics(run: RunSettings, replays?: number): Metric[] {
  const metrics: Metric[] = [{ label: "difficulty", value: run.difficulty }];
  if (run.runMode !== "normal") {
    metrics.push({ label: "run mode", value: run.runMode });
  }
  if (run.speed !== DEFAULT_SPEED) {
    metrics.push({ label: "speed", value: SPEED_LABEL[run.speed] });
  }
  if (replays !== undefined) {
    metrics.push({ label: "replays", value: `${replays}` });
  }
  return metrics;
}
