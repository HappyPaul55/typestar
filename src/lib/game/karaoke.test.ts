import { describe, expect, test } from "bun:test";
import type { TrackWord } from "../track/types";
import { KARAOKE_GRACE, karaokePointer, karaokeProgress } from "./karaoke";

function word(start: number, end: number): TrackWord {
  return { text: "x", match: "x", start, end, line: 0 };
}

// Three words: [1,2], [2.5,3], [5,6].
const words = [word(1, 2), word(2.5, 3), word(5, 6)];

describe("karaokePointer", () => {
  test("starts at the first word before anything is reached", () => {
    expect(karaokePointer(words, 0, 0)).toBe(0);
  });

  test("advances as each word's span passes", () => {
    expect(karaokePointer(words, 0, 1.5)).toBe(0);
    expect(karaokePointer(words, 0, 2.5)).toBe(1);
    expect(karaokePointer(words, 0, 5.5)).toBe(2);
  });

  test("keeps the finished word inside its grace window", () => {
    // Just after word 0 ends, it is still the active one.
    expect(karaokePointer(words, 0, 2 + KARAOKE_GRACE - 0.01)).toBe(0);
    expect(karaokePointer(words, 0, 2 + KARAOKE_GRACE + 0.01)).toBe(1);
  });

  test("returns the word count once the track has passed", () => {
    expect(karaokePointer(words, 0, 999)).toBe(3);
  });

  test("honours the sync offset", () => {
    // A positive offset delays the lyrics, so the pointer lags.
    expect(karaokePointer(words, 1, 2.5)).toBe(0);
    expect(karaokePointer(words, 1, 3)).toBe(0);
    expect(karaokePointer(words, 1, 3.5)).toBe(1);
  });

  test("is empty-safe", () => {
    expect(karaokePointer([], 0, 10)).toBe(0);
  });
});

describe("karaokeProgress", () => {
  test("tracks the fraction of words passed", () => {
    expect(karaokeProgress(words, 0, 0)).toBe(0);
    expect(karaokeProgress(words, 0, 3.5)).toBeCloseTo(2 / 3, 6);
    expect(karaokeProgress(words, 0, 999)).toBe(1);
  });

  test("an empty track is complete", () => {
    expect(karaokeProgress([], 0, 0)).toBe(1);
  });
});
