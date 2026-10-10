import { describe, expect, test } from "bun:test";
import { normaliseMatch } from "../track/parse";
import type { Track, TrackNote, TrackWord } from "../track/types";
import { bestKey, type RunSettings } from "./game";
import { createEngine, gameEngineList } from "./engines";
import { SingGame } from "./sing-game";
import { TypeGame } from "./type-game";

function word(text: string, start: number, end: number, line = 0): TrackWord {
  return { text, match: normaliseMatch(text), start, end, line };
}

function note(
  start: number,
  end: number,
  pitch: number | null,
  kind: TrackNote["kind"] = "normal",
): TrackNote {
  return { word: 0, start, end, pitch, kind };
}

function track(notes?: TrackNote[]): Track {
  return {
    version: 5,
    id: "abc12345678",
    title: "A song",
    description: "desc",
    lang: "en",
    source: { captions: "manual", fetchedAt: "2024-01-01T00:00:00Z" },
    offset: 0,
    lines: [{ start: 1, end: 2, from: 0, to: 2 }],
    words: [word("Hello", 1, 1.5), word("world", 1.5, 2)],
    ...(notes ? { notes } : {}),
  };
}

const RUN: RunSettings = {
  difficulty: "normal",
  runMode: "fun",
  speed: 1,
  style: "type",
  offset: 0,
};

describe("createEngine", () => {
  test("maps each style to its implementation", () => {
    expect(createEngine("type")).toBe(TypeGame);
    expect(createEngine("sing")).toBe(SingGame);
  });

  test("lists the engines in offer order", () => {
    expect(gameEngineList().map((engine) => engine.id)).toEqual(["type", "sing"]);
  });
});

describe("bestKey", () => {
  test("is one scheme, keyed by style and every setting", () => {
    expect(bestKey("type", "abc", RUN)).toBe("best:type:abc:normal:fun:1");
    expect(bestKey("sing", "abc", RUN)).not.toBe(bestKey("type", "abc", RUN));
    expect(bestKey("type", "abc", { ...RUN, speed: 1.25 })).not.toBe(
      bestKey("type", "abc", RUN),
    );
  });
});

describe("TypeGame", () => {
  test("is a scored, keyboard, lyric-lane engine", () => {
    const caps = TypeGame.capabilities(track(), false);
    expect(caps.scored).toBe(true);
    expect(caps.keyboard).toBe(true);
    expect(caps.microphone).toBe(false);
    expect(caps.lane).toBe("lyric");
  });

  test("scores keystrokes and reports progress", () => {
    const t = track();
    const config = TypeGame.config(t, RUN);
    let state = TypeGame.createState(t);
    for (const char of "hello") {
      state = TypeGame.reduce(state, { type: "key", key: char, time: 1.1 }, config);
    }
    const summary = TypeGame.summary(state, t, RUN, { time: 1.1, micFallback: false });
    expect(summary.score).toBeGreaterThan(0);
    expect(summary.progress).toBeCloseTo(0.5, 5);
    expect(summary.finished).toBe(false);
    expect(summary.attempted).toBe(true);
  });

  test("ignores microphone samples", () => {
    const t = track();
    const config = TypeGame.config(t, RUN);
    const state = TypeGame.createState(t);
    const next = TypeGame.reduce(
      state,
      { type: "sample", time: 0, midi: 60, rms: 0.2 },
      config,
    );
    expect(next).toBe(state);
  });

  test("results are scored and carry a rank and the share settings", () => {
    const t = track();
    const config = TypeGame.config(t, RUN);
    const state = TypeGame.createState(t);
    const results = TypeGame.results(state, t, RUN, { time: 3, micFallback: false });
    expect(results.scored).toBe(true);
    expect(results.rank).not.toBeNull();
    expect(results.share.style).toBe("type");
    expect(results.failMessage).toBeNull();
  });

  test("explains a run ended by the miss streak", () => {
    const t = track();
    const state = {
      ...TypeGame.createState(t),
      failed: true,
      failReason: "streak" as const,
    };
    const results = TypeGame.results(state, t, RUN, { time: 3, micFallback: false });
    expect(results.failed).toBe(true);
    expect(results.failMessage).toBe("You missed 20 words in a row.");
  });
});

describe("SingGame", () => {
  test("is karaoke without pitched notes", () => {
    const caps = SingGame.capabilities(track(), false);
    expect(caps.scored).toBe(false);
    expect(caps.lane).toBe("lyric");
    expect(caps.microphone).toBe(false);
    // The bar is the same in every style, even when unscored.
    expect(caps.scoreBar).toBe(true);
    expect(caps.difficulty).toBe(true);
    expect(caps.runMode).toBe(true);
    expect(SingGame.help(track(), false)).toContain("No score");
  });

  test("is scored with pitched notes", () => {
    const t = track([note(1, 2, 3)]);
    const caps = SingGame.capabilities(t, false);
    expect(caps.scored).toBe(true);
    expect(caps.microphone).toBe(true);
    expect(caps.lane).toBe("pitch");
    expect(SingGame.help(t, false)).toContain("pitch");
  });

  test("falls back to karaoke when the microphone is refused", () => {
    const t = track([note(1, 2, 3)]);
    const caps = SingGame.capabilities(t, true);
    expect(caps.scored).toBe(false);
    expect(caps.microphone).toBe(false);
    // The controls stay; only the scoring changes.
    expect(caps.scoreBar).toBe(true);
    expect(caps.difficulty).toBe(true);
    expect(caps.runMode).toBe(true);
  });

  test("ignores keystrokes", () => {
    const t = track([note(1, 2, 3)]);
    const config = SingGame.config(t, RUN);
    const state = SingGame.createState(t);
    const next = SingGame.reduce(state, { type: "key", key: "a", time: 1 }, config);
    expect(next).toBe(state);
  });

  test("karaoke results are unscored and list the song and artist", () => {
    const t = track();
    const state = SingGame.createState(t);
    const results = SingGame.results(state, t, RUN, {
      time: 5,
      micFallback: false,
      artist: "Someone",
    });
    expect(results.scored).toBe(false);
    expect(results.rank).toBeNull();
    expect(results.bestKey).toContain(":sing:");
    expect(results.metrics).toContainEqual({ label: "artist", value: "Someone" });
  });

  test("omits the run mode and speed metrics at their normal values", () => {
    const t = track([note(1, 2, 3)]);
    const state = SingGame.createState(t);
    const normalRun = { ...RUN, runMode: "normal" as const, speed: 1 as const };
    const plain = SingGame.results(state, t, normalRun, { time: 5, micFallback: false });
    expect(plain.scored).toBe(true);
    const labels = plain.metrics.map((metric) => metric.label);
    expect(labels).not.toContain("run mode");
    expect(labels).not.toContain("speed");

    const fun = SingGame.results(state, t, { ...normalRun, runMode: "fun" }, { time: 5, micFallback: false });
    expect(fun.metrics).toContainEqual({ label: "run mode", value: "fun" });

    const fast = SingGame.results(state, t, { ...normalRun, speed: 1.25 }, { time: 5, micFallback: false });
    expect(fast.metrics).toContainEqual({ label: "speed", value: "1.25×" });
  });

  test("combines notes hit and missed into one metric", () => {
    const t = track([note(1, 2, 3)]);
    const state = { ...SingGame.createState(t), hits: 150, misses: 63 };
    const results = SingGame.results(state, t, RUN, { time: 5, micFallback: false });
    const labels = results.metrics.map((metric) => metric.label);
    expect(labels).not.toContain("notes hit");
    expect(labels).not.toContain("notes missed");
    expect(labels).not.toContain("score");
    expect(results.metrics).toContainEqual({ label: "notes", value: "150/213" });
  });
});

describe("TypeGame.results", () => {
  test("combines words hit and missed into one metric", () => {
    const t = track();
    const state = { ...TypeGame.createState(t), hits: 120, misses: 346 };
    const results = TypeGame.results(state, t, RUN, { time: 30, micFallback: false });
    const labels = results.metrics.map((metric) => metric.label);
    expect(labels).not.toContain("words hit");
    expect(labels).not.toContain("words missed");
    expect(results.metrics).toContainEqual({ label: "words", value: "120/466" });
  });
});
