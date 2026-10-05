/**
 * Runtime validation for cached tracks.
 *
 * R2 is a cache, not a source of truth: an object could be truncated or from an
 * older shape. Rather than trust it, the API validates before serving and
 * re-fetches on failure.
 */

import { TRACK_VERSION, type Track, type TrackLine, type TrackWord } from "./types";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isWord(value: unknown): value is TrackWord {
  if (!value || typeof value !== "object") return false;
  const word = value as Record<string, unknown>;
  return (
    typeof word.text === "string" &&
    typeof word.match === "string" &&
    word.match.length > 0 &&
    isFiniteNumber(word.start) &&
    isFiniteNumber(word.end) &&
    isFiniteNumber(word.line)
  );
}

function isLine(value: unknown): value is TrackLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return (
    isFiniteNumber(line.start) &&
    isFiniteNumber(line.end) &&
    isFiniteNumber(line.from) &&
    isFiniteNumber(line.to)
  );
}

/** Structural check for a cached {@link Track}. */
export function isTrack(value: unknown): value is Track {
  if (!value || typeof value !== "object") return false;
  const track = value as Record<string, unknown>;
  if (track.version !== TRACK_VERSION) return false;
  if (typeof track.id !== "string" || typeof track.lang !== "string") return false;
  if (typeof track.title !== "string") return false;
  if (!Array.isArray(track.words) || !track.words.every(isWord)) return false;
  if (!Array.isArray(track.lines) || !track.lines.every(isLine)) return false;
  if (track.words.length === 0) return false;

  // Line indices must point at real words and cover the whole list in order.
  const lines = track.lines as TrackLine[];
  if (!lines.length || lines[0].from !== 0) return false;
  if (lines[lines.length - 1].to !== (track.words as TrackWord[]).length) return false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].to <= lines[i].from) return false;
    if (i > 0 && lines[i].from !== lines[i - 1].to) return false;
  }

  return true;
}

/** Parse a JSON string into a Track, or return `null` if it is unusable. */
export function parseTrack(raw: string): Track | null {
  try {
    const value = JSON.parse(raw) as unknown;
    return isTrack(value) ? value : null;
  } catch {
    return null;
  }
}
