/**
 * Assemble a {@link Track} from a video's caption data.
 *
 * Prefers the raw `json3` transcript (which carries word-level timing) and
 * falls back to the library's line-level subtitle segments when the raw body
 * could not be captured.
 */

import { groupLines, tokensFromJson3, tokensFromSegments } from "./parse";
import {
  TRACK_VERSION,
  type CaptionKind,
  type CaptionSegment,
  type Track,
} from "./types";
import { parseVtt } from "./vtt";

export interface BuildTrackInput {
  id: string;
  lang: string;
  title: string;
  description: string;
  subtitles: CaptionSegment[];
  /** Raw `json3` transcript, or `null` when the capture failed. */
  json3: unknown;
  /** Caption kind detected from the caption track URL, when known. */
  captionKind?: CaptionKind;
}

/** Descriptions can run to several kilobytes; the game never needs them. */
const DESCRIPTION_LIMIT = 480;

function trimDescription(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > DESCRIPTION_LIMIT
    ? `${cleaned.slice(0, DESCRIPTION_LIMIT - 1)}…`
    : cleaned;
}

/** Build the cached track document. Never throws on empty input — callers
 * check `track.words.length` and treat zero words as "no captions". */
export function buildTrack(input: BuildTrackInput): Track {
  const parsed = tokensFromJson3(input.json3);
  let tokens = parsed.tokens;
  let captions = parsed.kind;

  if (!tokens.length && input.subtitles.length) {
    tokens = tokensFromSegments(input.subtitles);
    if (tokens.length) captions = "unknown";
  }

  // The URL-derived kind is more reliable than the shape heuristic.
  if (input.captionKind && input.captionKind !== "unknown") {
    captions = input.captionKind;
  }

  const { lines, words } = groupLines(tokens);

  return {
    version: TRACK_VERSION,
    id: input.id,
    title: input.title,
    description: trimDescription(input.description),
    lang: input.lang,
    source: { captions, fetchedAt: new Date().toISOString() },
    offset: 0,
    lines,
    words,
  };
}

export interface BuildLocalTrackInput {
  id: string;
  lang: string;
  title: string;
  description: string;
  /** Raw WebVTT caption text from a local file. */
  vtt: string;
}

/**
 * Build a track from a local video's WebVTT caption file. The cues are fed
 * through the same line-level pipeline as YouTube's human captions, so local
 * and remote tracks behave identically in the game.
 */
export function buildLocalTrack(input: BuildLocalTrackInput): Track {
  return buildTrack({
    id: input.id,
    lang: input.lang,
    title: input.title,
    description: input.description,
    subtitles: parseVtt(input.vtt),
    json3: null,
    // A local `.vtt` is treated as authored captions; we cannot know better.
    captionKind: "manual",
  });
}
