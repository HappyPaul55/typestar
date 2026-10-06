/**
 * Rate how hard a track's lyrics are to type, from the caption timing alone.
 *
 * The metric is words per second. Long gaps between words — intros, outros and
 * instrumental breaks — are capped at one second each, so a track with a long
 * quiet stretch does not read as slower (and therefore easier) than it really
 * is. This is a property of the song and is deliberately separate from the
 * game's typing-difficulty setting (`GameMode`).
 */

import type { Track, TrackWord } from "./types";

export type TrackRating = "easy" | "medium" | "hard";

/** Display order, easiest first. */
export const TRACK_RATINGS: TrackRating[] = ["easy", "medium", "hard"];

export const RATING_LABEL: Record<TrackRating, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/**
 * A gap longer than this counts as exactly this many seconds. One second is
 * long enough to cover the natural space between words while a music break
 * (say 30 seconds) adds no more than a single beat's worth of time.
 */
export const MAX_GAP_SECONDS = 1;

/** Words-per-second cut-offs: below `EASY_MAX_WPS` is easy, and so on. */
export const EASY_MAX_WPS = 1.5;
export const MEDIUM_MAX_WPS = 2.3;

/**
 * The track's pace in words per second, with long gaps clamped to
 * {@link MAX_GAP_SECONDS} so instrumental breaks do not dilute the rate.
 * Returns `0` for an empty or untimed track.
 */
export function wordsPerSecond(words: readonly TrackWord[]): number {
  if (words.length === 0) return 0;

  let seconds = 0;
  for (let i = 0; i < words.length; i++) {
    seconds += Math.max(0, words[i].end - words[i].start);
    if (i + 1 < words.length) {
      const gap = words[i + 1].start - words[i].end;
      seconds += Math.min(Math.max(gap, 0), MAX_GAP_SECONDS);
    }
  }

  return seconds > 0 ? words.length / seconds : 0;
}

/** Map a words-per-second figure onto a rating band. */
export function ratingFromWordsPerSecond(wps: number): TrackRating {
  if (wps < EASY_MAX_WPS) return "easy";
  if (wps < MEDIUM_MAX_WPS) return "medium";
  return "hard";
}

/** Rate a track (or anything with a list of timed words). */
export function ratingOf(track: Pick<Track, "words">): TrackRating {
  return ratingFromWordsPerSecond(wordsPerSecond(track.words));
}
