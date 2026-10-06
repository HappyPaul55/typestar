import { describe, expect, test } from "bun:test";
import {
  accuracyOf,
  comboMilestone,
  comboTier,
  createGameState,
  cueAt,
  gameReducer,
  LINE_BONUS,
  LINE_CATCH_UP,
  LINE_HEAD_START,
  MISS_PENALTY,
  progressOf,
  rankOf,
  requiredCharIndices,
  requiredText,
  skipIntroTarget,
  wordDeadline,
  wordOpenTime,
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
    // A long intro so the head start is capped and there is still a guard.
    const words = [word("We're", 5, 5.4)];
    const lines = [{ start: 5, end: 5.4, from: 0, to: 1 }];
    const cfg = config({ words, lines });
    let state = createGameState(words.length);
    // The word opens at 5 - 0.35 - 1 = 3.65s, so 1s is too early.
    state = type(state, "were", 1, cfg);
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

describe("comboMilestone", () => {
  test("flags 10 and 25 as small milestones", () => {
    expect(comboMilestone(10)).toBe("small");
    expect(comboMilestone(25)).toBe("small");
  });

  test("flags every hundred as medium", () => {
    expect(comboMilestone(100)).toBe("medium");
    expect(comboMilestone(200)).toBe("medium");
  });

  test("flags every five hundred as large", () => {
    expect(comboMilestone(500)).toBe("large");
    expect(comboMilestone(1000)).toBe("large");
  });

  test("ignores ordinary combo counts", () => {
    expect(comboMilestone(0)).toBeNull();
    expect(comboMilestone(9)).toBeNull();
    expect(comboMilestone(50)).toBeNull();
    expect(comboMilestone(499)).toBeNull();
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

describe("forgiving skips", () => {
  const SKIP_WORDS: TrackWord[] = [
    word("We're", 1.0, 1.24, 0),
    word("no", 1.3, 1.54, 0),
    word("strangers", 1.6, 2.0, 0),
    word("to", 2.1, 2.34, 0),
    word("love", 2.4, 2.7, 0),
    word("Never", 3.0, 3.4, 1),
  ];
  const SKIP_LINES = [
    { start: 1.0, end: 2.7, from: 0, to: 5 },
    { start: 3.0, end: 3.4, from: 5, to: 6 },
  ];

  function skipConfig(overrides: Partial<GameConfig> = {}): GameConfig {
    return {
      words: SKIP_WORDS,
      lines: SKIP_LINES,
      offset: 0,
      mode: "normal",
      failMode: "fun",
      lead: 0.35,
      grace: 0.6,
      ...overrides,
    };
  }

  test("a later word on the line lets the player skip the rest of a word", () => {
    const cfg = skipConfig();
    let state = createGameState(SKIP_WORDS.length);
    state = type(state, "were", 1.05, cfg);
    state = type(state, "no", 1.35, cfg);
    state = type(state, "stra", 1.65, cfg);
    expect(state.pointer).toBe(2);
    expect(state.input).toBe("stra");

    // "t" cannot continue "strangers", but it begins "to", so jump there.
    state = type(state, "t", 2.15, cfg);
    expect(state.pointer).toBe(3);
    expect(state.input).toBe("t");
    expect(state.results[2]).toBe("miss");
    expect(state.misses).toBe(1);
    expect(state.combo).toBe(0);

    state = type(state, "o", 2.2, cfg);
    state = type(state, "love", 2.5, cfg);
    expect(state.pointer).toBe(5);
    expect(state.results[4]).toBe("hit");
    expect(state.hits).toBe(4);
    expect(state.misses).toBe(1);
  });

  test("skipping marks every word passed over as missed", () => {
    const cfg = skipConfig();
    let state = createGameState(SKIP_WORDS.length);
    state = type(state, "were", 1.05, cfg);
    // Jump straight from "We're" to "to", skipping "no" and "strangers".
    state = type(state, "t", 2.15, cfg);
    expect(state.pointer).toBe(3);
    expect(state.results[1]).toBe("miss");
    expect(state.results[2]).toBe("miss");
    expect(state.misses).toBe(2);
    expect(state.input).toBe("t");
  });

  test("a wrong key that begins no later word is still just a typo", () => {
    const cfg = skipConfig();
    let state = type(createGameState(SKIP_WORDS.length), "were", 1.05, cfg);
    state = type(state, "no", 1.35, cfg);
    const before = state.score;
    state = gameReducer(state, { type: "key", key: "z", time: 1.7 }, cfg);
    expect(state.pointer).toBe(2);
    expect(state.results[2]).toBe("pending");
    expect(state.errorKeys).toBe(1);
    expect(state.score).toBe(before - WRONG_PENALTY);
  });

  test("a key that begins the next line jumps there", () => {
    const cfg = skipConfig();
    // Clear line 0 up to its last word, then start the next line.
    let state = createGameState(SKIP_WORDS.length);
    state = type(state, "were", 1.05, cfg);
    state = type(state, "no", 1.35, cfg);
    state = type(state, "strangers", 1.75, cfg);
    state = type(state, "to", 2.15, cfg);
    expect(state.pointer).toBe(4); // "love", the last word of line 0

    // "n" is not on line 0, but it begins "Never" on line 1.
    state = type(state, "n", 2.8, cfg);
    expect(state.pointer).toBe(5);
    expect(state.input).toBe("n");
    expect(state.results[4]).toBe("miss");
    expect(state.misses).toBe(1);
  });

  test("does not jump to the next line before it is typeable", () => {
    // Line 1 starts at 6s, so its head start opens it at 4.65s.
    const words = [word("hold", 1.5, 2.0, 0), word("on", 6.0, 6.4, 1)];
    const lines = [
      { start: 1.5, end: 2.0, from: 0, to: 1 },
      { start: 6.0, end: 6.4, from: 1, to: 2 },
    ];
    const cfg = skipConfig({ words, lines });
    let state = createGameState(words.length);
    state = gameReducer(state, { type: "key", key: "o", time: 4.0 }, cfg);
    expect(state.pointer).toBe(0);
    expect(state.results[1]).toBe("pending");
    expect(state.errorKeys).toBe(1);
  });

  test("jumps to the next line once its head start opens", () => {
    const words = [word("hold", 1.5, 2.0, 0), word("on", 6.0, 6.4, 1)];
    const lines = [
      { start: 1.5, end: 2.0, from: 0, to: 1 },
      { start: 6.0, end: 6.4, from: 1, to: 2 },
    ];
    const cfg = skipConfig({ words, lines });
    let state = createGameState(words.length);
    state = gameReducer(state, { type: "key", key: "o", time: 5.0 }, cfg);
    expect(state.pointer).toBe(1);
    expect(state.input).toBe("o");
    expect(state.results[0]).toBe("miss");
  });

  test("a word later in an open line is reachable before its estimated start", () => {
    const cfg = skipConfig();
    let state = createGameState(SKIP_WORDS.length);
    state = type(state, "were", 1.05, cfg);
    state = type(state, "no", 1.35, cfg);
    state = type(state, "stra", 1.6, cfg);
    // "to" is estimated to start at 2.1, but line 0 is already open, so the
    // player who is ahead can jump to it anyway.
    state = gameReducer(state, { type: "key", key: "t", time: 1.65 }, cfg);
    expect(state.pointer).toBe(3);
    expect(state.input).toBe("t");
    expect(state.results[2]).toBe("miss");
  });

  test("a whole line can be typed at once once it opens", () => {
    const cfg = skipConfig();
    let state = createGameState(SKIP_WORDS.length);
    // Line 0 opens at 0s (its intro head start covers the whole pre-roll), so a
    // fast player can clear every word at 0.7s without hitting a word gate.
    for (const text of ["were", "no", "strangers", "to", "love"]) {
      state = type(state, text, 0.7, cfg);
    }
    expect(state.pointer).toBe(5);
    expect(state.hits).toBe(5);
    expect(state.results[4]).toBe("hit");
  });

  test("instant mode still fails when a skip misses words", () => {
    const cfg = skipConfig({ failMode: "instant" });
    let state = type(createGameState(SKIP_WORDS.length), "were", 1.05, cfg);
    state = type(state, "no", 1.35, cfg);
    state = type(state, "stra", 1.65, cfg);
    state = gameReducer(state, { type: "key", key: "t", time: 2.15 }, cfg);
    expect(state.failed).toBe(true);
    expect(state.failReason).toBe("mistake");
  });
});

describe("cueAt", () => {
  // A long intro, so the one-second head start is capped and a cue remains.
  const CUED_WORDS = [word("We're", 6, 6.4), word("no", 6.4, 6.7)];
  const cfg = { words: CUED_WORDS, offset: 0, lead: 0.35 };

  test("counts down before the first word is typeable", () => {
    const cue = cueAt(cfg, 0, 0.2);
    expect(cue.waiting).toBe(true);
    expect(cue.remaining).toBeCloseTo(4.45, 5);
    expect(cue.progress).toBeGreaterThan(0);
    expect(cue.progress).toBeLessThan(1);
  });

  test("stops waiting once the word is typeable", () => {
    expect(cueAt(cfg, 0, 4.7).waiting).toBe(false);
    expect(cueAt(cfg, 0, 6).progress).toBe(1);
  });

  test("does nothing once the track is finished", () => {
    expect(cueAt(cfg, CUED_WORDS.length, 5)).toEqual({
      waiting: false,
      remaining: 0,
      progress: 1,
      span: 0,
    });
  });

  test("reports the length of the wait", () => {
    // The word starts at 6s; the lead and the head start open it at 4.65s.
    expect(cueAt(cfg, 0, 0).span).toBeCloseTo(4.65, 5);
  });
});

describe("line boundary forgiveness", () => {
  // Line 0 ends at 2s; line 1 starts at 6s — four seconds of dead air between.
  const GAP_WORDS: TrackWord[] = [
    word("hold", 1.5, 2.0, 0),
    word("on", 6.0, 6.4, 1),
  ];
  const GAP_LINES = [
    { start: 1.5, end: 2.0, from: 0, to: 1 },
    { start: 6.0, end: 6.4, from: 1, to: 2 },
  ];

  function gapConfig(overrides: Partial<GameConfig> = {}): GameConfig {
    return {
      words: GAP_WORDS,
      lines: GAP_LINES,
      offset: 0,
      mode: "normal",
      failMode: "fun",
      lead: 0.35,
      grace: 0.6,
      ...overrides,
    };
  }

  test("opens the first word of a line up to a second early", () => {
    // Normal open 5.65s; the capped head start opens it at 4.65s.
    expect(wordOpenTime(1, gapConfig())).toBeCloseTo(6.0 - 0.35 - LINE_HEAD_START, 5);
  });

  test("keeps the last word of a line open up to a second late", () => {
    // Normal deadline 2.6s; the capped catch-up extends it to 3.6s.
    expect(wordDeadline(0, gapConfig())).toBeCloseTo(2.0 + 0.6 + LINE_CATCH_UP, 5);
  });

  test("a long gap does not extend the window any further", () => {
    const cfg = gapConfig();
    expect(wordOpenTime(1, cfg)).toBeCloseTo(4.65, 5);
    expect(wordDeadline(0, cfg)).toBeCloseTo(3.6, 5);
  });

  test("a player can catch up on the last word of a line", () => {
    const cfg = gapConfig();
    let state = createGameState(GAP_WORDS.length);
    // 3.2s is past the normal deadline (2.6) but inside the catch-up window (3.6).
    state = gameReducer(state, { type: "tick", time: 3.2 }, cfg);
    expect(state.pointer).toBe(0);
    expect(state.results[0]).toBe("pending");
    state = type(state, "hold", 3.2, cfg);
    expect(state.results[0]).toBe("hit");
    expect(state.pointer).toBe(1);
  });

  test("a player can get a head start on the next line", () => {
    const cfg = gapConfig();
    let state = createGameState(GAP_WORDS.length);
    state = type(state, "hold", 1.6, cfg);
    expect(state.pointer).toBe(1);
    // Normal open is 5.65s; at 5.0s the head start already allows it.
    state = type(state, "on", 5.0, cfg);
    expect(state.results[1]).toBe("hit");
  });

  test("a long intro still caps the head start at one second", () => {
    const words = [word("first", 10, 10.4, 0)];
    const lines = [{ start: 10, end: 10.4, from: 0, to: 1 }];
    const cfg = config({ words, lines });
    expect(wordOpenTime(0, cfg)).toBeCloseTo(10 - 0.35 - LINE_HEAD_START, 5);
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

describe("skip intro", () => {
  test("lands 1.5s before the first lyric", () => {
    expect(skipIntroTarget(10)).toBeCloseTo(8.5);
  });

  test("hides when the intro is shorter than two seconds", () => {
    expect(skipIntroTarget(1.99)).toBeNull();
    expect(skipIntroTarget(2)).toBeCloseTo(0.5);
  });

  test("honours the sync offset and never goes negative", () => {
    expect(skipIntroTarget(10, -0.5)).toBeCloseTo(8);
    expect(skipIntroTarget(2, -1)).toBeNull();
    expect(skipIntroTarget(2, 0)).toBeCloseTo(0.5);
  });
});
