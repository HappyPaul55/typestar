import { describe, expect, test } from "bun:test";
import { buildHash, parseHash } from "./url";

describe("url hash", () => {
  test("round-trips the settings", () => {
    const parsed = parseHash(buildHash({ mode: "hard", failMode: "practise" }));
    expect(parsed).toEqual({ mode: "hard", failMode: "practise" });
  });

  test("ignores invalid values", () => {
    expect(parseHash("#difficulty=insane&run=nope")).toEqual({});
  });

  test("keeps the valid half of a mixed hash", () => {
    expect(parseHash("#difficulty=easy&run=nope")).toEqual({ mode: "easy" });
  });

  test("handles an empty hash", () => {
    expect(parseHash("")).toEqual({});
    expect(parseHash("#")).toEqual({});
  });

  test("omits defaults, leaving no hash", () => {
    expect(buildHash({ mode: "normal", failMode: "fun" })).toBe("");
    expect(buildHash({ mode: "normal", failMode: "fun", speed: 1 })).toBe("");
  });

  test("carries only the settings that differ from the defaults", () => {
    expect(buildHash({ mode: "hard", failMode: "fun", speed: 1 })).toBe(
      "#difficulty=hard",
    );
    expect(buildHash({ mode: "normal", failMode: "instant", speed: 1 })).toBe(
      "#run=instant",
    );
    expect(buildHash({ mode: "normal", failMode: "fun", speed: 1.25 })).toBe(
      "#speed=1.25",
    );
  });

  test("round-trips the playback speed", () => {
    const parsed = parseHash(
      buildHash({ mode: "hard", failMode: "instant", speed: 1.25 }),
    );
    expect(parsed).toEqual({ mode: "hard", failMode: "instant", speed: 1.25 });
  });

  test("ignores an out-of-range or non-numeric speed", () => {
    expect(parseHash("#difficulty=easy&run=normal&speed=3")).toEqual({
      mode: "easy",
      failMode: "normal",
    });
    expect(parseHash("#speed=normal")).toEqual({});
  });
});
