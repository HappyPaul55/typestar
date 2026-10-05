import { describe, expect, test } from "bun:test";
import {
  accuracyOf,
  comboTier,
  createGameState,
  cueAt,
  gameReducer,
  LINE_BONUS,
  MISS_PENALTY,
  progressOf,
  rankOf,
  requiredCharIndices,
  requiredText,
  WRONG_PENALTY,
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

const LINES = [
  { start: WORDS[0].start, end: WORDS[WORDS.length - 1].end, from: 0, to: WORDS.length },
];

function config(overrides: Partial<GameConfig> = {}): GameConfig {
  // Default to "fun" so the typing/scoring tests are not affected by failure.
  return {
    words: WORDS,
    lines: LINES,
    offset: 0,
    mode: "normal",
    failMode: "fun",
    lead: 0.35,
    grace: 0.6,
    ...overrides,
  };
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

describe("scoring", () => {
  test("combo tiers scale the multiplier", () => {
    expect(comboTier(0)).toBe(1);
    expect(comboTier(9)).toBe(1);
    expect(comboTier(10)).toBe(1.5);
    expect(comboTier(25)).toBe(2);
    expect(comboTier(60)).toBe(3);
  });

  test("a wrong key costs points and breaks the chain", () => {
    const cfg = config();
    let state = type(createGameState(WORDS.length), "were", 1.2, cfg);
    const before = state.score;
    expect(state.combo).toBe(1);
    state = gameReducer(state, { type: "key", key: "x", time: 1.5 }, cfg);
    expect(state.score).toBe(before - WRONG_PENALTY);
    expect(state.combo).toBe(0);
    expect(state.errorKeys).toBe(1);
  });

  test("a miss costs less than a wrong key and breaks the chain", () => {
    expect(MISS_PENALTY).toBeLessThan(WRONG_PENALTY);
    const cfg = config();
    let state = createGameState(WORDS.length);
    state = gameReducer(state, { type: "tick", time: 3.1 }, cfg);
    expect(state.score).toBe(-MISS_PENALTY * 3);
    expect(state.combo).toBe(0);
  });

  test("a clean line awards the perfect-line bonus", () => {
    const cfg = config();
    let state = type(createGameState(WORDS.length), "were", 1.2, cfg);
    state = type(state, "no", 1.5, cfg);
    state = type(state, "strangers", 1.9, cfg);
    expect(state.perfectLines).toBe(1);
    expect(state.score).toBeGreaterThan(LINE_BONUS);
  });

  test("a wrong key anywhere in the line loses the bonus", () => {
    const cfg = config();
    let state = type(createGameState(WORDS.length), "were", 1.2, cfg);
    state = gameReducer(state, { type: "key", key: "x", time: 1.5 }, cfg);
    state = type(state, "no", 1.6, cfg);
    state = type(state, "strangers", 1.9, cfg);
    expect(state.perfectLines).toBe(0);
  });

  test("a missed word loses the bonus", () => {
    const cfg = config();
    let state = type(createGameState(WORDS.length), "were", 1.2, cfg);
    state = gameReducer(state, { type: "tick", time: 2.4 }, cfg);
    state = type(state, "strangers", 2.5, cfg);
    expect(state.perfectLines).toBe(0);
  });
});

describe("failure modes", () => {
  test("normal fails once the score drops below -150", () => {
    const cfg = config({ failMode: "normal" });
    // -140 is still above the threshold.
    const ok = gameReducer(
      { ...createGameState(WORDS.length), score: -120 },
      { type: "key", key: "x", time: 1.2 },
      cfg,
    );
    expect(ok.score).toBe(-140);
    expect(ok.failed).toBe(false);
    // Crossing the threshold fails the run.
    const bad = gameReducer(
      { ...createGameState(WORDS.length), score: -135 },
      { type: "key", key: "x", time: 1.2 },
      cfg,
    );
    expect(bad.score).toBe(-155);
    expect(bad.failed).toBe(true);
    expect(bad.failReason).toBe("score");
  });

  test("fun never fails", () => {
    const cfg = config({ failMode: "fun" });
    const state = gameReducer(createGameState(WORDS.length), { type: "tick", time: 3.1 }, cfg);
    expect(state.score).toBeLessThan(0);
    expect(state.failed).toBe(false);
  });

  test("instant fails on a wrong key", () => {
    const cfg = config({ failMode: "instant" });
    const state = gameReducer(createGameState(WORDS.length), { type: "key", key: "x", time: 1.2 }, cfg);
    expect(state.failed).toBe(true);
    expect(state.failReason).toBe("mistake");
  });

  test("instant fails on a miss", () => {
    const cfg = config({ failMode: "instant" });
    const state = gameReducer(createGameState(WORDS.length), { type: "tick", time: 3.1 }, cfg);
    expect(state.failed).toBe(true);
  });

  test("practise rewinds on a wrong key without a penalty", () => {
    const cfg = config({ failMode: "practise" });
    let state = type(createGameState(WORDS.length), "were", 1.2, cfg);
    const score = state.score;
    state = gameReducer(state, { type: "key", key: "x", time: 3.0 }, cfg);
    expect(state.failed).toBe(false);
    expect(state.replays).toBe(1);
    expect(state.rewindTo).toBeCloseTo(0, 5);
    expect(state.score).toBe(score);
  });

  test("practise rewinds on a miss", () => {
    const cfg = config({ failMode: "practise" });
    const state = gameReducer(createGameState(WORDS.length), { type: "tick", time: 3.1 }, cfg);
    expect(state.replays).toBe(1);
    expect(state.rewindTo).toBeCloseTo(0, 5);
    expect(state.failed).toBe(false);
  });

  test("finish marks the rest missed regardless of mode", () => {
    const cfg = config({ failMode: "practise" });
    const state = gameReducer(createGameState(WORDS.length), { type: "finish" }, cfg);
    expect(state.finished).toBe(true);
    expect(state.misses).toBe(WORDS.length);
    expect(state.replays).toBe(0);
  });

  test("clearRewind clears the request", () => {
    const cfg = config({ failMode: "practise" });
    let state = gameReducer(createGameState(WORDS.length), { type: "tick", time: 3.1 }, cfg);
    state = gameReducer(state, { type: "clearRewind" }, cfg);
    expect(state.rewindTo).toBeNull();
  });

  test("practise ignores mistakes during the replay window", () => {
    const cfg = config({ failMode: "practise" });
    let state = type(createGameState(WORDS.length), "were", 1.2, cfg);
    state = gameReducer(state, { type: "key", key: "x", time: 3.0 }, cfg);
    expect(state.replays).toBe(1);
    expect(state.ignoreUntil).toBeCloseTo(3.0, 5);

    // A wrong key inside the window is a no-op (same state reference).
    const after = gameReducer(state, { type: "key", key: "x", time: 1.0 }, cfg);
    expect(after).toBe(state);
    expect(after.replays).toBe(1);
  });

  test("practise gives no score or penalty during the replay window", () => {
    const cfg = config({ failMode: "practise" });
    let state = type(createGameState(WORDS.length), "were", 1.2, cfg);
    const score = state.score;
    state = gameReducer(state, { type: "key", key: "x", time: 3.0 }, cfg);

    // Re-typing the word adds nothing.
    state = type(state, "were", 1.0, cfg);
    expect(state.score).toBe(score);

    // A miss inside the window costs nothing and does not rewind.
    state = gameReducer(state, { type: "tick", time: 2.5 }, cfg);
    expect(state.score).toBe(score);
    expect(state.replays).toBe(1);
  });
});

describe("cueAt", () => {
  const cfg = { words: WORDS, offset: 0, lead: 0.35 };

  test("counts down before the first word is typeable", () => {
    const cue = cueAt(cfg, 0, 0.2);
    expect(cue.waiting).toBe(true);
    expect(cue.remaining).toBeCloseTo(0.45, 5);
    expect(cue.progress).toBeGreaterThan(0);
    expect(cue.progress).toBeLessThan(1);
  });

  test("stops waiting once the word is typeable", () => {
    expect(cueAt(cfg, 0, 0.7).waiting).toBe(false);
    expect(cueAt(cfg, 0, 1.2).progress).toBe(1);
  });

  test("does nothing once the track is finished", () => {
    expect(cueAt(cfg, WORDS.length, 5)).toEqual({
      waiting: false,
      remaining: 0,
      progress: 1,
      span: 0,
    });
  });

  test("reports the length of the wait", () => {
    // First word starts at 1s, lead 0.35 -> typeable at 0.65s, so the wait is 0.65s.
    expect(cueAt(cfg, 0, 0).span).toBeCloseTo(0.65, 5);
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
