/**
 * WebVTT parsing.
 *
 * Local libraries pair a video file with a same-named `.vtt` caption file.
 * WebVTT cues are line-level, much like YouTube's human captions, and some
 * carry inline word timestamps (`<00:00:05.000>`). This turns either into the
 * same {@link CaptionSegment} shape the YouTube path produces, so the rest of
 * the track pipeline (`buildTrack`, `parse.ts`) is shared unchanged.
 */

import type { CaptionSegment } from "./types";

/** A parsed WebVTT cue, with times in seconds. */
export interface VttCue {
  start: number;
  end: number;
  text: string;
}

/** `MM:SS.mmm`, `HH:MM:SS.mmm` (and the `,` millisecond separator). */
const TIMESTAMP_RE = /^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/;

/** Inline word timestamps inside a cue body, e.g. `<00:00:05.000>`. */
const INLINE_TIMESTAMP_RE = /<((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})>/g;

/** Parse a WebVTT timestamp into seconds, or `null` if it is not one. */
export function parseVttTimestamp(value: string): number | null {
  const match = TIMESTAMP_RE.exec(value.trim());
  if (!match) return null;
  const [, hours, minutes, seconds, millis] = match;
  return (
    (hours ? Number(hours) : 0) * 3600 +
    Number(minutes) * 60 +
    Number(seconds) +
    Number(millis.padEnd(3, "0")) / 1000
  );
}

/** Strip WebVTT markup (`<v Name>`, `<c.class>`, `<b>`, …) from cue text. */
export function stripVttTags(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

/**
 * Parse a WebVTT document into cues. Blocks without a timing line — the
 * `WEBVTT` header, `NOTE`, `STYLE` and `REGION` — are skipped, as are cues
 * whose body has no readable text.
 */
export function parseVttCues(text: string): VttCue[] {
  const normalised = text.replace(/\r\n?/g, "\n").replace(/^\uFEFF/, "");
  const cues: VttCue[] = [];

  for (const block of normalised.split(/\n{2,}/)) {
    let lines = block.split("\n").filter((line) => line.trim() !== "");
    if (!lines.length) continue;
    // The header can share a block with the first cue; drop just its line.
    if (/^WEBVTT/.test(lines[0].trim())) lines = lines.slice(1);
    if (!lines.length) continue;
    if (/^(NOTE|STYLE|REGION)\b/.test(lines[0].trim())) continue;

    // The timing line may be preceded by an optional cue identifier.
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex === -1) continue;
    const [startRaw, endPart] = lines[timingIndex].split("-->");
    const endRaw = endPart?.trim().split(/\s+/)[0] ?? "";
    const start = parseVttTimestamp(startRaw ?? "");
    const end = parseVttTimestamp(endRaw);
    if (start === null || end === null || end < start) continue;

    const body = lines.slice(timingIndex + 1).join("\n");
    if (!stripVttTags(body).trim()) continue;
    cues.push({ start, end, text: body });
  }

  return cues;
}

/**
 * Turn a cue into segments. Without inline timestamps the whole cue is one
 * line-level segment; with them, each span between markers is its own
 * word-level segment (the first chunk, before any marker, belongs to the cue
 * start).
 */
function cueToSegments(cue: VttCue): CaptionSegment[] {
  const whole: CaptionSegment = {
    start: String(cue.start),
    dur: String(cue.end - cue.start),
    text: stripVttTags(cue.text),
  };

  const matches = [...cue.text.matchAll(INLINE_TIMESTAMP_RE)];
  if (!matches.length) return [whole];

  const chunks: { start: number; text: string }[] = [];
  let cursor = cue.start;
  let last = 0;
  for (const match of matches) {
    const time = parseVttTimestamp(match[1]);
    if (time === null) continue;
    chunks.push({ start: cursor, text: cue.text.slice(last, match.index) });
    cursor = time;
    last = (match.index ?? 0) + match[0].length;
  }
  chunks.push({ start: cursor, text: cue.text.slice(last) });

  const segments: CaptionSegment[] = [];
  chunks.forEach((chunk, index) => {
    const clean = stripVttTags(chunk.text).trim();
    if (!clean) return;
    const next = chunks[index + 1]?.start ?? cue.end;
    const end = Math.max(next, chunk.start + 0.05);
    segments.push({
      start: String(chunk.start),
      dur: String(end - chunk.start),
      text: clean,
    });
  });

  return segments.length ? segments : [whole];
}

/** Parse a WebVTT document into the line-level segments the track builder uses. */
export function parseVtt(text: string): CaptionSegment[] {
  return parseVttCues(text).flatMap(cueToSegments);
}
