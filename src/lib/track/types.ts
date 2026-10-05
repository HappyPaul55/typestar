/**
 * The on-the-wire shape of a processed track.
 *
 * A track is produced by the server from a video's caption track (see
 * `youtube-captions.ts` and `build.ts`) and cached in R2. It is deliberately
 * runtime-agnostic: the Worker builds it, the React game consumes it, and the
 * warm script writes it to disk, all from this one definition.
 */

/** Bump when the shape changes in a way the game cannot read. */
export const TRACK_VERSION = 5;

/** How a caption track was produced, which hints at how reliable the timing is. */
export type CaptionKind = "manual" | "asr" | "unknown";

export interface TrackWord {
  /** Display text, exactly as it should be read on screen. */
  text: string;
  /**
   * Comparison text: lower-cased, punctuation stripped, apostrophes removed.
   * This is what the player actually has to type. Always non-empty.
   */
  match: string;
  /** Seconds from the start of the video. */
  start: number;
  /** Seconds from the start of the video. */
  end: number;
  /** Index into {@link Track.lines}. */
  line: number;
}

export interface TrackLine {
  /** Start of the first word in the line, in seconds. */
  start: number;
  /** End of the last word in the line, in seconds. */
  end: number;
  /** Inclusive index of the line's first word in {@link Track.words}. */
  from: number;
  /** Exclusive index of the line's last word in {@link Track.words}. */
  to: number;
}

export interface TrackSource {
  captions: CaptionKind;
  /** ISO timestamp of when the captions were fetched. */
  fetchedAt: string;
}

export interface Track {
  version: number;
  /** The 11-character YouTube video id. */
  id: string;
  title: string;
  description: string;
  /** Caption language code, e.g. `en`. */
  lang: string;
  source: TrackSource;
  /**
   * Global sync nudge in seconds. Positive shifts the lyrics later relative to
   * the video; the player can tune this per track (and it is stored in the
   * browser, not here, for v1 — this is the server's suggested default).
   */
  offset: number;
  lines: TrackLine[];
  /** Flat, time-ordered list of every word in the track. */
  words: TrackWord[];
}

/** A caption segment as returned by `youtube-caption-extractor`. */
export interface CaptionSegment {
  start: string;
  dur: string;
  text: string;
}
