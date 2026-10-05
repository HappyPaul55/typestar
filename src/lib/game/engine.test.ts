import { describe, expect, test } from "bun:test";
import {
  accuracyOf,
  createGameState,
  gameReducer,
  progressOf,
  rankOf,
  requiredCharIndices,
  requiredText,
  type GameConfig,
  type GameState,
} from "./engine";
import { normaliseMatch } from "../track/parse";
import type { TrackWord } from "../track/types";

function word(text: string, start: number, end: number, line = 0): TrackWord {
  return { text, match: normaliseMatch(text), start, end, line };
}

const WORDS: TrackWord[] = [
  word("We're", 1, 1.4),
  word("no", 1.4, 1.7),
  word("strangers", 1.7, 2.4),
];

function config(overrides: Partial<GameConfig> = {}): GameConfig {
  return { words: WORDS, offset: 0, mode: "normal", lead: 0.35, grace: 0.6, ...overrides };
}

function type(state: GameState, text: string, time: number, cfg: GameConfig): GameState {
  let next = state;
  for (const char of text) next = gameReducer(next, { type: "key", key: char, time }, cfg);
  return next;
}

describe("requiredText", () => {
  test("normal mode needs the whole word", () => {
    expect(requiredText(WORDS[0], "normal")).toBe("were");
  });
  test("easy mode needs only the first letter", () => {
    expect(requiredText(WORDS[0], "easy")).toBe("w");
  });
  test("hard mode keeps punctuation", () => {
    expect(requiredText(WORDS[0], "hard")).toBe("we're");
  });
});

describe("requiredCharIndices", () => {
  test("marks the characters each mode requires", () => {
    expect(requiredCharIndices("We're", "easy")).toEqual([0]);
    expect(requiredCharIndices("We're", "normal")).toEqual([0, 1, 3, 4]);
    expect(requiredCharIndices("We're", "hard")).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("gameReducer typing", () => {
  test("a correctly typed word scores, advances and builds combo", () => {
    const cfg = config();
    let state = createGameState(WORDS.length);
    state = type(state, "were", 1.2, cfg);
    expect(state.pointer).toBe(1);
    expect(state.hits).toBe(1);
    expect(state.combo).toBe(1);
    expect(state.score).toBeGreaterThan(0);
    expect(state.results[0]).toBe("hit");
  });

  test("wrong keys are counted but do not advance the word", () => {
    const cfg = config();
    let state = createGameState(WORDS.length);
    state = gameReducer(state, { type: "key", key: "x", time: 1.2 }, cfg);
    expect(state.errorKeys).toBe(1);
    expect(state.pointer).toBe(0);
    expect(state.input).toBe("");
  });

  test("backspace removes the last typed character", () => {
    const cfg = config();
    let state = createGameState(WORDS.length);
    state = type(state, "we", 1.2, cfg);
    state = gameReducer(state, { type: "key", key: "Backspace", time: 1.2 }, cfg);
    expect(state.input).toBe("w");
  });

  test("typing before the word is in range is ignored", () => {
    const cfg = config();
    let state = createGameState(WORDS.length);
    state = type(state, "were", 0.1, cfg);
    expect(state.pointer).toBe(0);
    expect(state.input).toBe("");
    expect(state.correctKeys).toBe(0);
  });

  test("easy mode clears a word with its first letter", () => {
    const cfg = config({ mode: "easy" });
    let state = createGameState(WORDS.length);
    state = type(state, "w", 1.2, cfg);
    expect(state.pointer).toBe(1);
    expect(state.results[0]).toBe("hit");
  });

  test("normal mode ignores punctuation keystrokes", () => {
    const cfg = config();
    let state = createGameState(WORDS.length);
    state = type(state, "we're", 1.2, cfg);
    expect(state.pointer).toBe(1);
    expect(state.errorKeys).toBe(0);
  });

  test("hard mode requires punctuation", () => {
    const cfg = config({ mode: "hard" });
    let state = createGameState(WORDS.length);
    state = type(state, "we", 1.2, cfg);
    state = gameReducer(state, { type: "key", key: "r", time: 1.2 }, cfg);
    expect(state.errorKeys).toBe(1);
    expect(state.pointer).toBe(0);
    state = type(state, "'re", 1.2, cfg);
    expect(state.pointer).toBe(1);
    expect(state.results[0]).toBe("hit");
  });

  test("finishes when every word is cleared", () => {
    const cfg = config();
    let state = createGameState(WORDS.length);
    state = type(state, "were", 1.2, cfg);
    state = type(state, "no", 1.5, cfg);
    state = type(state, "strangers", 1.9, cfg);
    expect(state.finished).toBe(true);
    expect(state.hits).toBe(3);
  });
});

describe("gameReducer timing", () => {
  test("a word whose window closes is missed and resets combo", () => {
    const cfg = config();
    let state = createGameState(WORDS.length);
    state = type(state, "were", 1.2, cfg);
    expect(state.combo).toBe(1);
    // Deadlines: 2.0, 2.3, 3.0. Jump past all of them.
    state = gameReducer(state, { type: "tick", time: 3.1 }, cfg);
    expect(state.results[1]).toBe("miss");
    expect(state.results[2]).toBe("miss");
    expect(state.misses).toBe(2);
    expect(state.combo).toBe(0);
    expect(state.pointer).toBe(3);
    expect(state.finished).toBe(true);
  });

  test("completing a word on time scores more than completing it late", () => {
    const cfg = config();
    const onTime = type(createGameState(WORDS.length), "were", 1.0, cfg);
    const late = type(createGameState(WORDS.length), "were", 2.1, cfg);
    expect(onTime.score).toBeGreaterThan(late.score);
  });

  test("resync jumps to the first word still in range", () => {
    const cfg = config();
    let state = createGameState(WORDS.length);
    state = gameReducer(state, { type: "resync", time: 2.4 }, cfg);
    expect(state.pointer).toBe(2);
    expect(state.score).toBe(0);
  });
});

describe("scoring helpers", () => {
  test("accuracy is 1 with no keystrokes and drops with errors", () => {
    const cfg = config();
    expect(accuracyOf(createGameState(1))).toBe(1);
    let state = gameReducer(createGameState(WORDS.length), { type: "key", key: "x", time: 1.2 }, cfg);
    state = type(state, "were", 1.2, cfg);
    expect(accuracyOf(state)).toBeCloseTo(4 / 5, 5);
  });

  test("rank rewards accuracy and hit rate", () => {
    const clean = type(createGameState(WORDS.length), "were", 1.0, config());
    const perfect = { ...clean, hits: 3, misses: 0, correctKeys: 20, errorKeys: 0 };
    expect(rankOf(perfect)).toBe("S");
    const sloppy = { ...createGameState(3), hits: 1, misses: 2, correctKeys: 4, errorKeys: 8 };
    expect(rankOf(sloppy)).toBe("D");
  });

  test("progress tracks the pointer", () => {
    const cfg = config();
    const state = type(createGameState(WORDS.length), "were", 1.2, cfg);
    expect(progressOf(state, cfg)).toBeCloseTo(1 / 3, 5);
  });
});
