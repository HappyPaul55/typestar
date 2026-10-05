/**
 * The rhythm-typing engine, as a pure reducer.
 *
 * Keeping the whole game loop in a reducer means the scoring, timing windows
 * and easy mode are unit-testable without a browser or a video. The React hook
 * in `src/components/game/hooks/useGameLoop.ts` just feeds it keystrokes and
 * the player's clock.
 */

import type { TrackWord } from "../track/types";
import { normaliseHard } from "../track/parse";

export type GameMode = "easy" | "normal" | "hard";

export const GAME_MODES: GameMode[] = ["easy", "normal", "hard"];

export function isGameMode(value: unknown): value is GameMode {
  return value === "easy" || value === "normal" || value === "hard";
}

/** A word is `pending` until it is typed (`hit`) or its window closes (`miss`). */
export type WordResult = "pending" | "hit" | "miss";

export interface GameConfig {
  words: TrackWord[];
  /** Seconds added to every timestamp (the player's sync nudge). */
  offset: number;
  mode: GameMode;
  /** How early, in seconds, a word may be typed before its start. */
  lead: number;
  /** Extra time, in seconds, after a word's end before it is missed. */
  grace: number;
}

export interface GameState {
  /** Index of the next word to type. */
  pointer: number;
  /** What the player has typed for the current word. */
  input: string;
  results: WordResult[];
  score: number;
  combo: number;
  maxCombo: number;
  hits: number;
  misses: number;
  correctKeys: number;
  errorKeys: number;
  finished: boolean;
}

export type GameAction =
  | { type: "reset" }
  | { type: "tick"; time: number }
  | { type: "key"; key: string; time: number }
  | { type: "resync"; time: number };

export const DEFAULT_LEAD = 0.35;
export const DEFAULT_GRACE = 0.6;

export function createGameState(wordCount: number): GameState {
  return {
    pointer: 0,
    input: "",
    results: Array.from({ length: wordCount }, () => "pending" as WordResult),
    score: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    correctKeys: 0,
    errorKeys: 0,
    finished: wordCount === 0,
  };
}

/**
 * The text required to clear a word.
 * - easy: the first letter only;
 * - normal: the whole word, punctuation ignored;
 * - hard: the whole word, punctuation required.
 */
export function requiredText(word: TrackWord, mode: GameMode): string {
  if (mode === "easy") return word.match.slice(0, 1);
  if (mode === "hard") return normaliseHard(word.text);
  return word.match;
}

/**
 * The indices of the characters in `text` that count towards the target, in
 * order. The player's typed input maps one-to-one onto these positions, which
 * lets the highway show exactly which characters are still needed.
 */
export function requiredCharIndices(text: string, mode: GameMode): number[] {
  const indices: number[] = [];
  Array.from(text).forEach((char, index) => {
    const required = mode === "hard" ? !/\s/u.test(char) : /[\p{L}\p{N}]/u.test(char);
    if (required) indices.push(index);
  });
  return mode === "easy" ? indices.slice(0, 1) : indices;
}

function deadlineOf(word: TrackWord, config: GameConfig): number {
  return word.end + config.offset + config.grace;
}

export interface CueInfo {
  /** Whether the next word is not yet typeable. */
  waiting: boolean;
  /** Seconds until it becomes typeable. */
  remaining: number;
  /** 0..1 fill towards the typeable moment. */
  progress: number;
}

/**
 * The wait before the next word can be typed. Used to show an intro cue bar —
 * it covers the opening instrumental and any later gaps, not just the intro.
 */
export function cueAt(
  config: Pick<GameConfig, "words" | "offset" | "lead">,
  pointer: number,
  time: number,
): CueInfo {
  const word = config.words[pointer];
  if (!word) return { waiting: false, remaining: 0, progress: 1 };

  const to = word.start + config.offset - config.lead;
  const previous = pointer > 0 ? config.words[pointer - 1] : null;
  const from = previous ? previous.end + config.offset : 0;
  const waiting = time < to;
  const span = Math.max(to - from, 0.001);
  const progress = waiting ? Math.min(1, Math.max(0, (time - from) / span)) : 1;
  return { waiting, remaining: Math.max(0, to - time), progress };
}

function tick(state: GameState, time: number, config: GameConfig): GameState {
  if (state.finished) return state;

  let pointer = state.pointer;
  let results = state.results;
  let misses = state.misses;
  let combo = state.combo;
  let advanced = false;

  while (pointer < config.words.length && time > deadlineOf(config.words[pointer], config)) {
    if (!advanced) {
      results = [...results];
      advanced = true;
    }
    results[pointer] = "miss";
    misses++;
    combo = 0;
    pointer++;
  }

  if (!advanced) return state;
  return {
    ...state,
    pointer,
    results,
    misses,
    combo,
    input: "",
    finished: pointer >= config.words.length,
  };
}

function press(state: GameState, rawKey: string, time: number, config: GameConfig): GameState {
  if (state.finished) return state;

  if (rawKey === "Backspace") {
    return state.input ? { ...state, input: state.input.slice(0, -1) } : state;
  }
  if (rawKey.length !== 1 || /\s/u.test(rawKey)) return state;

  // In easy/normal mode punctuation is forgiving and ignored; in hard mode it
  // is part of the target.
  if (config.mode !== "hard" && !/[\p{L}\p{N}]/u.test(rawKey)) return state;

  const word = config.words[state.pointer];
  if (!word) return state;

  // Too early: the word is not on the highway yet.
  if (time < word.start + config.offset - config.lead) return state;

  const required = requiredText(word, config.mode);
  if (!required) return state;

  const key = rawKey.toLowerCase();
  const expected = required[state.input.length];

  if (key !== expected) {
    return { ...state, errorKeys: state.errorKeys + 1 };
  }

  const input = state.input + key;
  const correctKeys = state.correctKeys + 1;

  if (input.length < required.length) {
    return { ...state, input, correctKeys };
  }

  const start = word.start + config.offset;
  const duration = Math.max(word.end - word.start, 0.15);
  const delta = time - start;
  const timing = delta <= 0 ? 1 : Math.max(0, 1 - delta / (duration + config.grace));
  const multiplier = 1 + Math.min(state.combo, 50) * 0.02;
  const points = Math.round((100 + 100 * timing) * multiplier);

  const results = [...state.results];
  results[state.pointer] = "hit";
  const combo = state.combo + 1;
  const pointer = state.pointer + 1;

  return {
    ...state,
    pointer,
    input: "",
    results,
    score: state.score + points,
    combo,
    maxCombo: Math.max(state.maxCombo, combo),
    hits: state.hits + 1,
    correctKeys,
    finished: pointer >= config.words.length,
  };
}

function resync(_state: GameState, time: number, config: GameConfig): GameState {
  const fresh = createGameState(config.words.length);
  let pointer = 0;
  while (pointer < config.words.length && deadlineOf(config.words[pointer], config) < time) {
    pointer++;
  }
  return { ...fresh, pointer, finished: pointer >= config.words.length };
}

export function gameReducer(
  state: GameState,
  action: GameAction,
  config: GameConfig,
): GameState {
  switch (action.type) {
    case "reset":
      return createGameState(config.words.length);
    case "tick":
      return tick(state, action.time, config);
    case "key":
      return press(state, action.key, action.time, config);
    case "resync":
      return resync(state, action.time, config);
  }
}

export function accuracyOf(state: GameState): number {
  const total = state.correctKeys + state.errorKeys;
  return total ? state.correctKeys / total : 1;
}

export type Rank = "S" | "A" | "B" | "C" | "D";

export function rankOf(state: GameState): Rank {
  const accuracy = accuracyOf(state);
  const total = state.hits + state.misses;
  const hitRate = total ? state.hits / total : 0;
  const value = accuracy * 0.6 + hitRate * 0.4;
  if (value >= 0.95) return "S";
  if (value >= 0.85) return "A";
  if (value >= 0.7) return "B";
  if (value >= 0.55) return "C";
  return "D";
}

export function progressOf(state: GameState, config: GameConfig): number {
  return config.words.length ? state.pointer / config.words.length : 0;
}
