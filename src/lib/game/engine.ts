/**
 * The rhythm-typing engine, as a pure reducer.
 *
 * Keeping the whole game loop in a reducer means the scoring, timing windows
 * and easy mode are unit-testable without a browser or a video. The React hook
 * in `src/components/game/hooks/useGameLoop.ts` just feeds it keystrokes and
 * the player's clock.
 */

import type { TrackLine, TrackWord } from "../track/types";
import { normaliseHard } from "../track/parse";

export type GameMode = "easy" | "normal" | "hard";

export const GAME_MODES: GameMode[] = ["easy", "normal", "hard"];

export const DEFAULT_MODE: GameMode = "normal";

export function isGameMode(value: unknown): value is GameMode {
  return value === "easy" || value === "normal" || value === "hard";
}

/** How a run ends. Independent of the typing difficulty. */
export type FailMode = "normal" | "instant" | "fun" | "practise";

export const FAIL_MODES: FailMode[] = ["normal", "instant", "fun", "practise"];

export const DEFAULT_FAIL_MODE: FailMode = "fun";

export function isFailMode(value: unknown): value is FailMode {
  return value === "normal" || value === "instant" || value === "fun" || value === "practise";
}

/** Video playback speeds offered in the HUD. */
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5] as const;

export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export const DEFAULT_SPEED: PlaybackSpeed = 1;

export function isPlaybackSpeed(value: unknown): value is PlaybackSpeed {
  return (
    typeof value === "number" &&
    (PLAYBACK_SPEEDS as readonly number[]).includes(value)
  );
}

/** How far back Practise rewinds on a mistake, in seconds. */
export const PRACTISE_REWIND = 5;

/** Base points for a perfectly-timed hit. */
export const HIT_BASE = 100;
/** Points lost for a wrong keystroke (and the chain breaks). */
export const WRONG_PENALTY = 20;
/** Points lost for letting a word pass (smaller than a wrong key). */
export const MISS_PENALTY = 10;
/** Bonus for clearing a whole line without a miss or a wrong key. */
export const LINE_BONUS = 250;
/** Normal mode fails once the score drops below this. */
export const NORMAL_FAIL_THRESHOLD = -150;

/** The combo count at which each multiplier tier starts, highest first. */
const COMBO_TIERS: [number, number][] = [
  [50, 3],
  [30, 2.5],
  [20, 2],
  [10, 1.5],
];

/** The score multiplier for a given chain length. */
export function comboTier(combo: number): number {
  for (const [threshold, tier] of COMBO_TIERS) {
    if (combo >= threshold) return tier;
  }
  return 1;
}

/** How loud a combo celebration should be. */
export type ComboFlash = "small" | "medium" | "large";

/**
 * The celebration tier a combo milestone earns, or null for an ordinary hit:
 * 10 and 25 are small, every hundred is medium, every five hundred is large.
 */
export function comboMilestone(combo: number): ComboFlash | null {
  if (combo <= 0) return null;
  if (combo % 500 === 0) return "large";
  if (combo % 100 === 0) return "medium";
  if (combo === 10 || combo === 25) return "small";
  return null;
}

/** A word is `pending` until it is typed (`hit`) or its window closes (`miss`). */
export type WordResult = "pending" | "hit" | "miss";

export interface GameConfig {
  words: TrackWord[];
  /** The track's lines, used to award the perfect-line bonus. */
  lines: TrackLine[];
  /** Seconds added to every timestamp (the player's sync nudge). */
  offset: number;
  mode: GameMode;
  /** How the run ends. */
  failMode: FailMode;
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
  /** Whole lines cleared without a miss or a wrong key. */
  perfectLines: number;
  /** Wrong keys made while typing the current line. */
  lineWrong: number;
  finished: boolean;
  /** Set when the run is over because of a failure (score or mistake). */
  failed: boolean;
  failReason: "score" | "mistake" | null;
  /** Practise rewinds taken. */
  replays: number;
  /** Practise: the time the player should be sent back to, or null. */
  rewindTo: number | null;
  /**
   * Practise: until this time, score changes and further rewinds are ignored,
   * so replaying the section that was just rewound is free.
   */
  ignoreUntil: number;
}

export type GameAction =
  | { type: "reset" }
  | { type: "tick"; time: number }
  | { type: "key"; key: string; time: number }
  | { type: "resync"; time: number }
  | { type: "finish" }
  | { type: "clearRewind" };

export const DEFAULT_LEAD = 0.35;
export const DEFAULT_GRACE = 0.6;

/**
 * Extra seconds the first word of a line may be typed early, stretching back
 * across the gap after the previous line (or the intro). Capped at one second
 * so a long instrumental never lets the player race ahead of the music.
 */
export const LINE_HEAD_START = 1;

/**
 * Extra seconds the last word of a line may be typed late, stretching forward
 * across the gap before the next line. Capped at one second so the next line
 * always takes over before the player can fall too far behind.
 */
export const LINE_CATCH_UP = 1;

/** An intro shorter than this is not worth offering a skip for. */
export const MIN_SKIP_INTRO = 2;

/** How far before the first lyric the Skip button lands the video. */
export const SKIP_INTRO_LEAD = 1.5;

/**
 * Where the Skip button should send the video, or `null` when the intro is too
 * short to bother with. Measured from the first lyric's start (plus the player's
 * sync offset), landing just before the words become typeable.
 */
export function skipIntroTarget(firstWordStart: number, offset = 0): number | null {
  const intro = firstWordStart + offset;
  if (intro < MIN_SKIP_INTRO) return null;
  return Math.max(0, intro - SKIP_INTRO_LEAD);
}

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
    perfectLines: 0,
    lineWrong: 0,
    finished: wordCount === 0,
    failed: false,
    failReason: null,
    replays: 0,
    rewindTo: null,
    ignoreUntil: 0,
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

/** Whether the word at `pointer` is the last of its line. */
function lineEnds(pointer: number, config: Pick<GameConfig, "words">): boolean {
  const word = config.words[pointer];
  if (!word) return false;
  const next = config.words[pointer + 1];
  return !next || next.line !== word.line;
}

/**
 * The earliest time the word at `pointer` may be typed.
 *
 * Only the line's timing is real: the individual word times inside a line are
 * shared out by length, not measured. So the whole line opens together, based
 * on its first word, and a player who races ahead is never blocked on a later
 * word's estimated start. The line opens up to {@link LINE_HEAD_START} seconds
 * early to fill the gap after the previous line (or the opening intro).
 */
export function wordOpenTime(
  pointer: number,
  config: Pick<GameConfig, "words" | "offset" | "lead">,
): number {
  const word = config.words[pointer];
  if (!word) return Number.POSITIVE_INFINITY;

  let first = pointer;
  while (first > 0 && config.words[first - 1].line === word.line) first--;

  const base = config.words[first].start + config.offset - config.lead;
  // The gap between the previous line's end and the normal open. The intro is
  // measured from the start of the video.
  const previousEnd = first > 0 ? config.words[first - 1].end + config.offset : 0;
  const idle = base - previousEnd;
  return Math.max(0, base - Math.min(LINE_HEAD_START, Math.max(0, idle)));
}

/**
 * The last time the word at `pointer` may be typed.
 *
 * Normally its end plus the grace, but the last word of a line stays open up to
 * {@link LINE_CATCH_UP} seconds late to fill the gap before the next line.
 */
export function wordDeadline(
  pointer: number,
  config: Pick<GameConfig, "words" | "offset" | "grace">,
): number {
  const word = config.words[pointer];
  if (!word) return Number.NEGATIVE_INFINITY;
  const base = word.end + config.offset + config.grace;
  if (!lineEnds(pointer, config)) return base;

  const next = config.words[pointer + 1];
  if (!next) return base;
  const idle = next.start + config.offset - base;
  return base + Math.min(LINE_CATCH_UP, Math.max(0, idle));
}

export interface CueInfo {
  /** Whether the next word is not yet typeable. */
  waiting: boolean;
  /** Seconds until it becomes typeable. */
  remaining: number;
  /** 0..1 fill towards the typeable moment. */
  progress: number;
  /** Length of the wait, in seconds (negative when the words are tight). */
  span: number;
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
  if (!word) return { waiting: false, remaining: 0, progress: 1, span: 0 };

  // The cue fills toward the moment the word actually becomes typeable, so the
  // line-boundary head start is reflected here too.
  const to = wordOpenTime(pointer, config);
  const previous = pointer > 0 ? config.words[pointer - 1] : null;
  const from = previous ? previous.end + config.offset : 0;
  const span = to - from;
  const waiting = time < to;
  const progress = waiting
    ? Math.min(1, Math.max(0, (time - from) / Math.max(span, 0.001)))
    : 1;
  return { waiting, remaining: Math.max(0, to - time), progress, span };
}

/** Whether every word of the line containing `pointer` was hit. */
function lineIsPerfect(results: WordResult[], pointer: number, config: GameConfig): boolean {
  const word = config.words[pointer];
  const line = word ? config.lines[word.line] : undefined;
  if (!line) return false;
  for (let i = line.from; i < line.to; i++) {
    if (results[i] !== "hit") return false;
  }
  return true;
}

/**
 * The player may abandon a word part-way and start a later word — e.g. typing
 * "were no stra to love" for "We're no strangers to love". When a keystroke does
 * not match the current word, this finds the nearest later word that the key
 * could begin, so the player can jump to it and keep going instead of grinding
 * against the word they are skipping.
 *
 * The search covers the rest of the current line, and then the first word of the
 * next line: if the key is not on this line but does begin the next one, the
 * player is assumed to have moved on. Returns the index of the word to jump to,
 * or null when the key is just a typo. Only words already on the highway are
 * considered, so a skip never lets the player type ahead of the music.
 */
function skipTarget(state: GameState, key: string, time: number, config: GameConfig): number | null {
  const current = config.words[state.pointer];
  if (!current) return null;

  let index = state.pointer + 1;
  for (; index < config.words.length; index++) {
    const candidate = config.words[index];
    // Words are time-ordered, so the first word of the next line ends the
    // same-line search and becomes the cross-line candidate below.
    if (candidate.line !== current.line) break;
    // Never jump to a word that has not reached its typeable window yet.
    if (time < wordOpenTime(index, config)) break;
    if (requiredText(candidate, config.mode).startsWith(key)) return index;
  }

  // Nothing left on this line matched: if the key starts the next line, assume
  // the player is there instead. The typeable check keeps them from typing
  // ahead of the music.
  const next = config.words[index];
  if (
    next &&
    next.line !== current.line &&
    time >= wordOpenTime(index, config) &&
    requiredText(next, config.mode).startsWith(key)
  ) {
    return index;
  }
  return null;
}

/**
 * Skip the words between the pointer and `target` (marking them missed), then
 * feed the keystroke to the target word as its first letter. The skipped words
 * cost points and break the chain, so a skip is forgiving but not free.
 */
function skipToWord(
  state: GameState,
  target: number,
  rawKey: string,
  time: number,
  config: GameConfig,
): GameState {
  const results = [...state.results];
  let misses = state.misses;
  let score = state.score;
  for (let index = state.pointer; index < target; index++) {
    if (results[index] === "pending") {
      results[index] = "miss";
      misses++;
      score -= MISS_PENALTY;
    }
  }

  const skipped = afterPenalty(
    { ...state, pointer: target, input: "", results, misses, score, combo: 0 },
    config,
  );
  // A failing mode (instant, or normal crossing the score floor) ends the run.
  if (skipped.failed) return skipped;
  return press(skipped, rawKey, time, config);
}

/** Send the player back to replay the last few seconds (Practise mode). */
function practiseRewind(state: GameState, time: number, config: GameConfig): GameState {
  const target = Math.max(0, time - PRACTISE_REWIND);
  let pointer = 0;
  while (pointer < config.words.length && wordDeadline(pointer, config) < target) {
    pointer++;
  }
  return {
    ...state,
    pointer,
    results: state.results.map((result, index) => (index < pointer ? result : "pending")),
    input: "",
    combo: 0,
    lineWrong: 0,
    replays: state.replays + 1,
    rewindTo: target,
    // Ignore score changes until the mistake point is reached again.
    ignoreUntil: time,
    finished: false,
    failed: false,
  };
}

/** Mark every remaining word missed and end the run (e.g. the video ended). */
function finish(state: GameState, config: GameConfig): GameState {
  if (state.finished || state.failed) return state;
  let misses = state.misses;
  const results = state.results.map((result) => {
    if (result === "pending") {
      misses++;
      return "miss" as WordResult;
    }
    return result;
  });
  return {
    ...state,
    pointer: config.words.length,
    results,
    misses,
    input: "",
    finished: true,
  };
}

/** Apply the fail-mode outcome of a mistake that already cost points. */
function afterPenalty(state: GameState, config: GameConfig): GameState {
  if (config.failMode === "instant") {
    return { ...state, failed: true, failReason: "mistake" };
  }
  if (config.failMode === "normal" && state.score < NORMAL_FAIL_THRESHOLD) {
    return { ...state, failed: true, failReason: "score" };
  }
  return state;
}

function tick(state: GameState, time: number, config: GameConfig): GameState {
  if (state.finished || state.failed) return state;

  let pointer = state.pointer;
  let results = state.results;
  let misses = state.misses;
  let combo = state.combo;
  let score = state.score;
  let lineWrong = state.lineWrong;
  let advanced = false;
  const ignoring = config.failMode === "practise" && time < state.ignoreUntil;

  while (pointer < config.words.length && time > wordDeadline(pointer, config)) {
    // Practise rewinds instead of penalising — unless we are replaying the
    // section that was already rewound.
    if (config.failMode === "practise" && !ignoring) {
      return practiseRewind(
        { ...state, pointer, results, misses, combo, score, lineWrong },
        time,
        config,
      );
    }

    if (!advanced) {
      results = [...results];
      advanced = true;
    }
    results[pointer] = "miss";
    misses++;
    if (!ignoring) {
      combo = 0;
      score -= MISS_PENALTY;
    }
    if (lineEnds(pointer, config)) lineWrong = 0;
    pointer++;

    if (config.failMode === "instant") {
      return {
        ...state,
        pointer,
        results,
        misses,
        combo,
        score,
        lineWrong,
        input: "",
        failed: true,
        failReason: "mistake",
      };
    }
  }

  if (!advanced) return state;
  const next: GameState = {
    ...state,
    pointer,
    results,
    misses,
    combo,
    score,
    lineWrong,
    input: "",
    finished: pointer >= config.words.length,
  };
  return afterPenalty(next, config);
}

function press(state: GameState, rawKey: string, time: number, config: GameConfig): GameState {
  if (state.finished || state.failed) return state;

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
  if (time < wordOpenTime(state.pointer, config)) return state;

  const required = requiredText(word, config.mode);
  if (!required) return state;

  const key = rawKey.toLowerCase();
  const expected = required[state.input.length];
  const ignoring = config.failMode === "practise" && time < state.ignoreUntil;

  if (key !== expected) {
    // During a Practise replay the section is score-neutral.
    if (ignoring) return state;
    // A wrong key costs points and breaks the chain (or rewinds in Practise).
    if (config.failMode === "practise") return practiseRewind(state, time, config);

    // Forgiving: if the key begins a later word on the same line, treat it as a
    // skip past the current word rather than a typo.
    const target = skipTarget(state, key, time, config);
    if (target !== null) return skipToWord(state, target, key, time, config);

    return afterPenalty(
      {
        ...state,
        errorKeys: state.errorKeys + 1,
        lineWrong: state.lineWrong + 1,
        combo: 0,
        score: state.score - WRONG_PENALTY,
      },
      config,
    );
  }

  const input = state.input + key;
  const correctKeys = state.correctKeys + 1;

  if (input.length < required.length) {
    return { ...state, input, correctKeys };
  }

  if (ignoring) {
    // Clear the word but change no score, combo or bonus.
    const results = [...state.results];
    results[state.pointer] = "hit";
    const pointer = state.pointer + 1;
    let lineWrong = state.lineWrong;
    if (lineEnds(state.pointer, config)) lineWrong = 0;
    return {
      ...state,
      pointer,
      input: "",
      results,
      hits: state.hits + 1,
      correctKeys,
      lineWrong,
      finished: pointer >= config.words.length,
    };
  }

  const start = word.start + config.offset;
  const duration = Math.max(word.end - word.start, 0.15);
  const delta = time - start;
  const timing = delta <= 0 ? 1 : Math.max(0, 1 - delta / (duration + config.grace));
  const points = Math.round(HIT_BASE * timing * comboTier(state.combo));

  const results = [...state.results];
  results[state.pointer] = "hit";
  const combo = state.combo + 1;
  const pointer = state.pointer + 1;

  let score = state.score + points;
  let perfectLines = state.perfectLines;
  let lineWrong = state.lineWrong;
  if (lineEnds(state.pointer, config)) {
    if (lineWrong === 0 && lineIsPerfect(results, state.pointer, config)) {
      score += LINE_BONUS;
      perfectLines += 1;
    }
    lineWrong = 0;
  }

  return {
    ...state,
    pointer,
    input: "",
    results,
    score,
    combo,
    maxCombo: Math.max(state.maxCombo, combo),
    hits: state.hits + 1,
    correctKeys,
    perfectLines,
    lineWrong,
    finished: pointer >= config.words.length,
  };
}

function resync(_state: GameState, time: number, config: GameConfig): GameState {
  const fresh = createGameState(config.words.length);
  let pointer = 0;
  while (pointer < config.words.length && wordDeadline(pointer, config) < time) {
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
    case "finish":
      return finish(state, config);
    case "clearRewind":
      return state.rewindTo === null ? state : { ...state, rewindTo: null };
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

/** The score multiplier currently in effect. */
export function multiplierOf(state: GameState): number {
  return comboTier(state.combo);
}
