import { describe, expect, test } from "bun:test";
import {
  EASY_MAX_WPS,
  MAX_GAP_SECONDS,
  MEDIUM_MAX_WPS,
  ratingFromWordsPerSecond,
  ratingOf,
  wordsPerSecond,
} from "./rating";
import type { TrackWord } from "./types";

/** Build timed words from `[start, end]` second pairs. */
function words(...spans: [number, number][]): TrackWord[] {
  return spans.map(([start, end], line) => ({
    text: "word",
    match: "word",
    start,
    end,
    line,
  }));
}

describe("track rating", () => {
  test("rates an empty track as easy with no pace", () => {
    expect(wordsPerSecond([])).toBe(0);
    expect(ratingOf({ words: [] })).toBe("easy");
  });

  test("measures words per second including word durations", () => {
    // Four contiguous half-second words span exactly two seconds.
    const track = { words: words([0, 0.5], [0.5, 1], [1, 1.5], [1.5, 2]) };
    expect(wordsPerSecond(track.words)).toBeCloseTo(2);
    expect(ratingOf(track)).toBe("medium");
  });

  test("caps long gaps at one second", () => {
    // A one-second gap is the reference: long gaps count as no more than it.
    const oneSecondGap = { words: words([0, 0.5], [1.5, 2]) };
    const longGap = { words: words([0, 0.5], [30, 30.5]) };
    expect(wordsPerSecond(longGap.words)).toBeCloseTo(
      wordsPerSecond(oneSecondGap.words),
    );
    // Without the cap the 29.5s break would read as far too easy.
    expect(wordsPerSecond(longGap.words)).toBeCloseTo(1);
    expect(ratingOf(longGap)).toBe("easy");
  });

  test("does not let a gap count for more than the cap", () => {
    const track = { words: words([0, 0.25], [100, 100.25]) };
    // 0.25 + 0.25 in words, plus one capped second of gap.
    expect(wordsPerSecond(track.words)).toBeCloseTo(2 / 1.5);
  });

  test("ignores overlapping words rather than crediting negative time", () => {
    const track = { words: words([0, 2], [1, 3]) };
    // The second word overlaps the first, so its gap is 0.
    expect(wordsPerSecond(track.words)).toBeCloseTo(2 / 4);
  });

  test("applies the rating bands at their boundaries", () => {
    expect(ratingFromWordsPerSecond(EASY_MAX_WPS - 0.01)).toBe("easy");
    expect(ratingFromWordsPerSecond(EASY_MAX_WPS)).toBe("medium");
    expect(ratingFromWordsPerSecond(MEDIUM_MAX_WPS - 0.01)).toBe("medium");
    expect(ratingFromWordsPerSecond(MEDIUM_MAX_WPS)).toBe("hard");
    expect(ratingFromWordsPerSecond(5)).toBe("hard");
  });

  test("exports a one-second gap cap", () => {
    expect(MAX_GAP_SECONDS).toBe(1);
  });
});
