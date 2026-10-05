import { describe, expect, test } from "bun:test";
import { buildHash, parseHash } from "./url";

describe("url hash", () => {
  test("round-trips settings and stats", () => {
    const stats = {
      score: 1240,
      accuracy: 98,
      maxCombo: 42,
      hits: 120,
      misses: 3,
      perfectLines: 8,
    };
    const hash = buildHash({ mode: "hard", failMode: "practise", stats });
    const parsed = parseHash(hash);
    expect(parsed.mode).toBe("hard");
    expect(parsed.failMode).toBe("practise");
    expect(parsed.stats).toEqual(stats);
  });

  test("settings only, without stats", () => {
    const parsed = parseHash(buildHash({ mode: "easy", failMode: "fun" }));
    expect(parsed.mode).toBe("easy");
    expect(parsed.failMode).toBe("fun");
    expect(parsed.stats).toBeUndefined();
  });

  test("ignores invalid values", () => {
    const parsed = parseHash("#difficulty=insane&run=nope&score=abc");
    expect(parsed.mode).toBeUndefined();
    expect(parsed.failMode).toBeUndefined();
    expect(parsed.stats).toBeUndefined();
  });

  test("handles an empty hash", () => {
    expect(parseHash("")).toEqual({});
    expect(parseHash("#")).toEqual({});
  });
});
