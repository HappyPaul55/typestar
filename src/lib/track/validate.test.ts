import { describe, expect, test } from "bun:test";
import { TRACK_VERSION, type Track } from "./types";
import { isTrack, parseTrack } from "./validate";

/** A minimal valid track, for overriding one field at a time. */
function track(overrides: Partial<Track> = {}): Track {
  return {
    version: TRACK_VERSION,
    id: "dQw4w9WgXcQ",
    title: "Song",
    description: "",
    lang: "en",
    source: { captions: "manual", fetchedAt: "2026-01-01T00:00:00.000Z" },
    offset: 0,
    lines: [{ start: 0, end: 1, from: 0, to: 1 }],
    words: [{ text: "Hi", match: "hi", start: 0, end: 1, line: 0 }],
    ...overrides,
  };
}

describe("isTrack", () => {
  test("accepts a well-formed track", () => {
    expect(isTrack(track())).toBe(true);
  });

  test("rejects a stale version", () => {
    expect(isTrack(track({ version: TRACK_VERSION - 1 }))).toBe(false);
  });

  test("rejects an empty word list", () => {
    expect(isTrack(track({ words: [], lines: [] }))).toBe(false);
  });

  test("rejects lines that do not cover every word", () => {
    const bad = track({
      words: [
        { text: "a", match: "a", start: 0, end: 1, line: 0 },
        { text: "b", match: "b", start: 1, end: 2, line: 0 },
      ],
      lines: [{ start: 0, end: 1, from: 0, to: 1 }],
    });
    expect(isTrack(bad)).toBe(false);
  });

  test("rejects a word with a non-finite time", () => {
    const bad = track({
      words: [{ text: "a", match: "a", start: Number.NaN, end: 1, line: 0 }],
    });
    expect(isTrack(bad)).toBe(false);
  });

  test("rejects a word with an empty match text", () => {
    const bad = track({
      words: [{ text: "a", match: "", start: 0, end: 1, line: 0 }],
    });
    expect(isTrack(bad)).toBe(false);
  });

  test("rejects non-objects", () => {
    expect(isTrack(null)).toBe(false);
    expect(isTrack("nope")).toBe(false);
    expect(isTrack([])).toBe(false);
  });
});

describe("parseTrack", () => {
  test("parses valid JSON", () => {
    expect(parseTrack(JSON.stringify(track()))?.id).toBe("dQw4w9WgXcQ");
  });

  test("returns null for malformed JSON", () => {
    expect(parseTrack("{not json")).toBeNull();
  });

  test("returns null for valid JSON that is not a track", () => {
    expect(parseTrack(JSON.stringify({ hello: "world" }))).toBeNull();
  });
});
