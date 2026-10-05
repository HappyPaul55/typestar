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

  test("does not carry stats", () => {
    expect(buildHash({ mode: "normal", failMode: "fun" })).toBe(
      "#difficulty=normal&run=fun",
    );
  });
});
