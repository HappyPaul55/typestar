import { describe, expect, test } from "bun:test";
import {
  distributeWords,
  groupLines,
  isLyric,
  normaliseMatch,
  tokensFromJson3,
  tokensFromSegments,
} from "./parse";

describe("normaliseMatch", () => {
  test("lower-cases and strips punctuation and apostrophes", () => {
    expect(normaliseMatch("We're")).toBe("were");
    expect(normaliseMatch("Don't!")).toBe("dont");
    expect(normaliseMatch("  Hello,   World  ")).toBe("hello world");
    expect(normaliseMatch("Naïve")).toBe("naïve");
  });

  test("keeps letters and digits from non-Latin scripts", () => {
    expect(normaliseMatch("夜に駆ける")).toBe("夜に駆ける");
  });
});

describe("isLyric", () => {
  test("rejects markers and empty fragments", () => {
    expect(isLyric("[Music]")).toBe(false);
    expect(isLyric("(Applause)")).toBe(false);
    expect(isLyric("♪♪♪")).toBe(false);
    expect(isLyric("   ")).toBe(false);
  });

  test("accepts real words", () => {
    expect(isLyric("Hello")).toBe(true);
    expect(isLyric("[Music] hello")).toBe(true);
  });
});

describe("distributeWords", () => {
  test("splits a span across words, in order", () => {
    const words = distributeWords("one two three", 0, 3);
    expect(words.map((w) => w.text)).toEqual(["one", "two", "three"]);
    expect(words[0].start).toBe(0);
    expect(words[2].end).toBeCloseTo(3, 5);
    for (let i = 1; i < words.length; i++) {
      expect(words[i].start).toBeCloseTo(words[i - 1].end, 5);
    }
  });
});

describe("tokensFromJson3", () => {
  test("reads one-word-per-event auto captions as word-level timing", () => {
    const json = {
      events: [
        { tStartMs: 1000, dDurationMs: 300, segs: [{ utf8: "We're" }] },
        { tStartMs: 1300, dDurationMs: 250, segs: [{ utf8: "no" }] },
        { tStartMs: 1550, dDurationMs: 400, segs: [{ utf8: "strangers" }] },
      ],
    };
    const { tokens, kind } = tokensFromJson3(json);
    expect(kind).toBe("asr");
    expect(tokens.map((t) => t.text)).toEqual(["We're", "no", "strangers"]);
    expect(tokens[0]).toMatchObject({ start: 1, end: 1.3 });
    expect(tokens[2]).toMatchObject({ start: 1.55, end: 1.95 });
  });

  test("uses per-segment offsets when present", () => {
    const json = {
      events: [
        {
          tStartMs: 2000,
          dDurationMs: 1000,
          segs: [
            { utf8: "Hello ", tOffsetMs: 0 },
            { utf8: "world", tOffsetMs: 400 },
          ],
        },
        { tStartMs: 3500, dDurationMs: 500, segs: [{ utf8: "again" }] },
      ],
    };
    const { tokens, kind } = tokensFromJson3(json);
    expect(kind).toBe("manual");
    expect(tokens.map((t) => t.text)).toEqual(["Hello", "world", "again"]);
    expect(tokens[0].start).toBeCloseTo(2, 5);
    expect(tokens[1].start).toBeCloseTo(2.4, 5);
  });

  test("distributes a multi-word line without offsets by character weight", () => {
    const json = {
      events: [
        { tStartMs: 0, dDurationMs: 3000, segs: [{ utf8: "We're no strangers to love" }] },
      ],
    };
    const { tokens } = tokensFromJson3(json);
    expect(tokens.map((t) => t.text)).toEqual(["We're", "no", "strangers", "to", "love"]);
    expect(tokens[0].start).toBe(0);
    expect(tokens[4].end).toBeCloseTo(3, 5);
  });

  test("skips rolling (aAppend) events and stage directions", () => {
    const json = {
      events: [
        { tStartMs: 0, dDurationMs: 500, segs: [{ utf8: "la" }], aAppend: 1 },
        { tStartMs: 500, dDurationMs: 500, segs: [{ utf8: "[Music]" }] },
        { tStartMs: 1000, dDurationMs: 500, segs: [{ utf8: "la" }] },
      ],
    };
    const { tokens } = tokensFromJson3(json);
    expect(tokens.map((t) => t.text)).toEqual(["la"]);
  });

  test("returns an unknown kind when there is nothing usable", () => {
    expect(tokensFromJson3({ events: [] })).toEqual({ tokens: [], kind: "unknown" });
    expect(tokensFromJson3(null)).toEqual({ tokens: [], kind: "unknown" });
  });

  test("normalises overlapping word timings to be monotonic", () => {
    const json = {
      events: [
        { tStartMs: 0, dDurationMs: 1500, segs: [{ utf8: "alpha" }] },
        { tStartMs: 1000, dDurationMs: 1000, segs: [{ utf8: "beta" }] },
      ],
    };
    const { tokens } = tokensFromJson3(json);
    for (let i = 1; i < tokens.length; i++) {
      expect(tokens[i].start).toBeGreaterThanOrEqual(tokens[i - 1].end);
    }
  });
});

describe("tokensFromSegments", () => {
  test("falls back to line-level subtitles", () => {
    const tokens = tokensFromSegments([
      { start: "0", dur: "2", text: "We're no strangers" },
      { start: "2", dur: "2", text: "to love" },
    ]);
    expect(tokens.map((t) => t.text)).toEqual(["We're", "no", "strangers", "to", "love"]);
    expect(tokens[0].start).toBe(0);
    expect(tokens[4].end).toBeCloseTo(4, 5);
  });
});

describe("groupLines", () => {
  test("breaks lines on gaps and keeps word indices consistent", () => {
    const json = {
      events: [
        { tStartMs: 0, dDurationMs: 200, segs: [{ utf8: "one" }] },
        { tStartMs: 300, dDurationMs: 200, segs: [{ utf8: "two" }] },
        // 2s gap → new line
        { tStartMs: 2500, dDurationMs: 200, segs: [{ utf8: "three" }] },
      ],
    };
    const { tokens } = tokensFromJson3(json);
    const { lines, words } = groupLines(tokens);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ from: 0, to: 2 });
    expect(lines[1]).toMatchObject({ from: 2, to: 3 });
    expect(words.map((w) => w.line)).toEqual([0, 0, 1]);
    expect(words[0].match).toBe("one");
  });

  test("caps a line at the maximum word count", () => {
    const events = Array.from({ length: 12 }, (_, i) => ({
      tStartMs: i * 200,
      dDurationMs: 150,
      segs: [{ utf8: `w${i}` }],
    }));
    const { lines } = groupLines(tokensFromJson3({ events }).tokens);
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  test("keeps each human caption line as its own line", () => {
    const json = {
      events: [
        { tStartMs: 8490, dDurationMs: 2105, segs: [{ utf8: "♪ Well she moves like lightning ♪" }] },
        { tStartMs: 10595, dDurationMs: 2522, segs: [{ utf8: "♪ And she counts to three ♪" }] },
        { tStartMs: 13117, dDurationMs: 1802, segs: [{ utf8: "♪ Then she turns out all the lights ♪" }] },
      ],
    };
    const { lines, words } = groupLines(tokensFromJson3(json).tokens);
    expect(lines).toHaveLength(3);
    expect(words.map((w) => w.match).join(" ")).toBe(
      "well she moves like lightning and she counts to three then she turns out all the lights",
    );
    expect(words.map((w) => w.line)).toEqual([0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2]);
  });

  test("splits an event on its internal newline", () => {
    const json = {
      events: [
        { tStartMs: 0, dDurationMs: 2000, segs: [{ utf8: "first line here\nsecond line here" }] },
      ],
    };
    const { lines } = groupLines(tokensFromJson3(json).tokens);
    expect(lines).toHaveLength(2);
  });
});
