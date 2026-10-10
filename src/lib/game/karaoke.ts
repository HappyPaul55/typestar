/**
 * The karaoke playhead.
 *
 * In karaoke there is no typing, so the active word is purely a function of the
 * player's clock: it advances as each word's span passes. The typing engine
 * keeps its own pointer, driven by the player's keystrokes; this one follows the
 * music instead.
 *
 * Pure and unit-tested.
 */

import type { TrackWord } from "../track/types";

/** Words stay highlighted this long after they end, so a line does not blink. */
export const KARAOKE_GRACE = 0.25;

/**
 * The index of the word being sung at `time` (with the player's sync `offset`),
 * or `words.length` once every word has passed. Words before it are done; the
 * word at it is the one on screen.
 */
export function karaokePointer(
  words: readonly TrackWord[],
  offset: number,
  time: number,
): number {
  let pointer = 0;
  while (
    pointer < words.length &&
    time > words[pointer].end + offset + KARAOKE_GRACE
  ) {
    pointer++;
  }
  return pointer;
}

/** How far through the words the playhead is, 0..1. */
export function karaokeProgress(
  words: readonly TrackWord[],
  offset: number,
  time: number,
): number {
  return words.length ? karaokePointer(words, offset, time) / words.length : 1;
}
