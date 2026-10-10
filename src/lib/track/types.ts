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

/**
 * Where a track's lyrics came from. Tracks cached before this field existed are
 * always YouTube, so a missing `origin` means `youtube`.
 */
export type TrackOrigin = "youtube" | "ultrastar";

/**
 * Remote media URLs for an UltraStar chart fetched from a URL. The browser
 * hotlinks these directly from the origin; they never pass through our servers.
 * Only UltraStar tracks carry them, and only their audio is required.
 */
export interface TrackMedia {
  /** Absolute URL of the master audio (an UltraStar `#MP3`). */
  audio?: string;
  /** Absolute URL of the optional background video (`#VIDEO`). */
  video?: string;
  /** Absolute URL of the `#BACKGROUND` image, shown when there is no video. */
  background?: string;
  /** Absolute URL of the `#COVER` image, used for cards and social tags. */
  cover?: string;
  /** `#VIDEOGAP` in seconds: how far the video trails the audio. */
  videoGap?: number;
}

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

/** How a note is scored, mirroring the UltraStar note types. */
export type TrackNoteKind = "normal" | "golden" | "rap" | "goldenRap";

/**
 * A single measured note (an UltraStar syllable) with pitch. Caption-based
 * tracks have no notes at all; only sources that carry pitch produce them.
 */
export interface TrackNote {
  /** Index into {@link Track.words} this note belongs to. */
  word: number;
  /** Seconds from the start of the audio/video. */
  start: number;
  /** Seconds from the start of the audio/video. */
  end: number;
  /**
   * Pitch in semitones relative to C4 (MIDI 60), or `null` for rap notes whose
   * pitch is ignored. Rap notes are still timed and scored on presence.
   */
  pitch: number | null;
  /** The note type, which affects scoring. */
  kind: TrackNoteKind;
}

export interface TrackSource {
  captions: CaptionKind;
  /** ISO timestamp of when the captions were fetched. */
  fetchedAt: string;
}

export interface Track {
  version: number;
  /**
   * A stable identifier for the track: the 11-character YouTube video id, or
   * `ultrastar-<hash>` for a chart fetched from a URL. Used for the cache key,
   * personal bests and the sync offset, so it must not change between loads.
   */
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
  /**
   * Per-note pitch data, present only for sources that carry it (UltraStar).
   * Caption-based tracks have no notes, so they can only be typed or sung as
   * unscored karaoke. Optional so older cached/seeded tracks still validate.
   */
  notes?: TrackNote[];
  /**
   * Where the track came from. Absent on older tracks, which are always
   * YouTube; treat a missing value as `youtube`.
   */
  origin?: TrackOrigin;
  /** The canonical source URL of an UltraStar chart (a `.txt`). */
  sourceUrl?: string;
  /** The song's artist, when the source (an UltraStar header) names one. */
  artist?: string;
  /** Remote media URLs for a URL-sourced UltraStar chart. */
  media?: TrackMedia;
}

/** A caption segment as returned by `youtube-caption-extractor`. */
export interface CaptionSegment {
  start: string;
  dur: string;
  text: string;
}
