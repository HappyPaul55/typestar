import { describe, expect, test } from "bun:test";
import {
  handleError,
  normalizeEmail,
  normalizeHandle,
  RESERVED_HANDLES,
} from "./validate";

describe("normalizeHandle", () => {
  test("lowercases and trims a valid handle", () => {
    expect(normalizeHandle("  Type_Star  ")).toBe("type_star");
  });

  test("accepts letters, numbers and underscores", () => {
    expect(normalizeHandle("abc")).toBe("abc");
    expect(normalizeHandle("a1_b2_c3")).toBe("a1_b2_c3");
    expect(normalizeHandle("12345678901234567890")).toBe(
      "12345678901234567890",
    );
  });

  test("rejects too short, too long and bad shapes", () => {
    expect(normalizeHandle("ab")).toBeNull();
    expect(normalizeHandle("a".repeat(21))).toBeNull();
    expect(normalizeHandle("_leading")).toBeNull();
    expect(normalizeHandle("trailing_")).toBeNull();
    expect(normalizeHandle("has space")).toBeNull();
    expect(normalizeHandle("has-dash")).toBeNull();
    expect(normalizeHandle("")).toBeNull();
  });

  test("rejects reserved handles", () => {
    for (const handle of RESERVED_HANDLES) {
      expect(normalizeHandle(handle)).toBeNull();
    }
    expect(normalizeHandle("ADMIN")).toBeNull();
  });
});

describe("handleError", () => {
  test("returns null for a good handle", () => {
    expect(handleError("player_one")).toBeNull();
  });

  test("explains each rejection", () => {
    expect(handleError("")).toMatch(/choose/i);
    expect(handleError("ab")).toMatch(/3–20/);
    expect(handleError("bad handle")).toMatch(/lowercase/i);
    expect(handleError("admin")).toMatch(/reserved/i);
  });
});

describe("normalizeEmail", () => {
  test("lowercases and trims", () => {
    expect(normalizeEmail("  Player@Example.COM ")).toBe("player@example.com");
  });

  test("rejects obvious rubbish", () => {
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail("no-at-sign")).toBeNull();
    expect(normalizeEmail("a@b")).toBeNull();
    expect(normalizeEmail("a@b.")).toBeNull();
    expect(normalizeEmail("a b@c.com")).toBeNull();
  });

  test("accepts subdomains and plus addressing", () => {
    expect(normalizeEmail("a+tag@mail.example.co.uk")).toBe(
      "a+tag@mail.example.co.uk",
    );
  });
});
