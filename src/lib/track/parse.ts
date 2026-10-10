/**
 * Caption parsing.
 *
 * YouTube caption tracks are fetched as `json3`. That format carries a list of
 * events, each with a start/duration and one or more text segments. Human
 * captions usually put a whole lyric line (or a couple, separated by newlines)
 * into one event; auto-generated captions usually emit roughly one word per
 * event. Some events also carry per-segment offsets.
 *
 * The game needs one timed entry per word, grouped into the same lines a viewer
 * would recognise. So this module:
 *   1. turns each event into timed words, splitting on newlines and giving each
 *      display line its share of the event span;
 *   2. tags words that came from a real line with a group id, and leaves
 *      one-word auto-caption events ungrouped so they can flow together;
 *   3. groups by those ids (and, for auto-captions, by gaps).
 *
 * Everything here is pure and unit-tested.
 */

import type { CaptionSegment, CaptionKind, TrackLine, TrackWord } from "./types";

/** A word (or short run of words) with a time span, before line grouping. */
export interface TimedToken {
  text: string;
  start: number;
  end: number;
  /** Index of the source caption event, kept for debugging/inspection. */
  source: number;
  /** Display-line group id, or `-1` for an ungrouped auto-caption word. */
  group: number;
}

export interface ParsedCaptions {
  tokens: TimedToken[];
  kind: CaptionKind;
}

/** A new line is started when this many seconds pass between ungrouped words. */
const LINE_GAP = 0.7;
/** An ungrouped line never holds more than this many words, for readability. */
const LINE_MAX_WORDS = 8;

/** Minimum duration given to a word so nothing is instantaneous. */
const MIN_WORD_DURATION = 0.1;

interface Json3Segment {
  utf8?: string;
  tOffsetMs?: number;
}

interface Json3Event {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: Json3Segment[];
  aAppend?: number;
}

/** A timed span of text before it becomes a {@link TrackWord}. */
interface WordSpan {
  text: string;
  start: number;
  end: number;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Decode the handful of HTML entities YouTube captions can contain. */
function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => {
      const point = Number(code);
      return Number.isFinite(point) ? String.fromCodePoint(point) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => {
      const point = parseInt(code, 16);
      return Number.isFinite(point) ? String.fromCodePoint(point) : "";
    })
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ");
}

/** Remove stage directions (`[Music]`, `(Applause)`) and music notes. */
function stripMarkers(text: string): string {
  return text
    .replace(/[[(][^\])]*[\])]/g, " ")
    .replace(/[\u2669-\u266F\u{1D100}-\u{1D1FF}\u{1F3B5}\u{1F3B6}]/gu, " ");
}

/**
 * The text the player actually types: lower-cased, punctuation removed and
 * apostrophes dropped, so "We're" and "don't" are typed as "were" / "dont".
 * Letters and digits from any script are kept so non-Latin tracks still work.
 */
export function normaliseMatch(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC\u201B]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, " ")
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The text required in hard mode: the word with its punctuation kept, but with
 * curly quotes folded to straight ones so they can actually be typed, and
 * whitespace removed.
 */
export function normaliseHard(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC\u201B]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, "");
}

/** Whether a caption fragment is actual lyric text rather than a marker. */
export function isLyric(text: string): boolean {
  const cleaned = stripMarkers(text).trim();
  if (!cleaned) return false;
  if (!/[\p{L}\p{N}]/u.test(cleaned)) return false;
  return true;
}

/** Normalise a raw caption fragment: decode, strip markers, tidy whitespace
 * while keeping the newlines that separate display lines. */
function cleanCaption(raw: string): string {
  return stripMarkers(decodeEntities(raw ?? ""))
    .replace(/\r/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/**
 * Split a run of text into words and give each a slice of `[start, end]`,
 * weighted by how many characters it has. Used when a caption line contains
 * several words but no per-word timing.
 */
export function distributeWords(
  text: string,
  start: number,
  end: number,
): { text: string; start: number; end: number }[] {
  const words = splitWords(text);
  if (!words.length) return [];

  const span = Math.max(end - start, words.length * 0.12);
  const weights = words.map((word) => Math.max(normaliseMatch(word).length, 1));
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  const out: { text: string; start: number; end: number }[] = [];
  let cursor = start;
  for (let i = 0; i < words.length; i++) {
    const duration = span * (weights[i] / total);
    const wordStart = cursor;
    cursor += duration;
    out.push({
      text: words[i],
      start: wordStart,
      end: i === words.length - 1 ? start + span : cursor,
    });
  }
  return out;
}

/** Tidy a word for display: drop leading dash markers and trailing ellipses. */
function cleanWordText(text: string): string {
  return text.replace(/^[-–—]+/, "").replace(/(?:\.{2,}|\u2026)+$/, "");
}

/** Time every word in a single line of text. */
function wordsInLine(text: string, start: number, end: number): WordSpan[] {
  const words = splitWords(text);
  if (!words.length) return [];
  if (words.length === 1) {
    const text0 = cleanWordText(words[0]);
    if (!normaliseMatch(text0)) return [];
    return [{ text: text0, start, end: Math.max(end, start + MIN_WORD_DURATION) }];
  }
  return distributeWords(text, start, end)
    .map((word) => ({ ...word, text: cleanWordText(word.text) }))
    .filter((word) => normaliseMatch(word.text));
}

/** How much of a span a line should get, by its number of letters/digits. */
function lineWeight(text: string): number {
  return Math.max(normaliseMatch(text).replace(/\s+/g, "").length, 1);
}

/**
 * Turn one caption fragment (which may contain newline-separated display lines)
 * into per-line word groups, sharing the span across lines by character weight.
 * `multiLine` marks fragments whose line breaks are deliberate, so even a
 * single-word line stays on its own.
 */
function fragmentLines(
  raw: string,
  start: number,
  end: number,
): { groups: WordSpan[][]; multiLine: boolean } {
  const lines = cleanCaption(raw)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => isLyric(line));
  if (!lines.length) return { groups: [], multiLine: false };
  if (lines.length === 1) {
    const words = wordsInLine(lines[0], start, end);
    return { groups: words.length ? [words] : [], multiLine: false };
  }

  const weights = lines.map(lineWeight);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const span = Math.max(end - start, lines.length * 0.12);

  const groups: WordSpan[][] = [];
  let cursor = start;
  lines.forEach((line, index) => {
    const duration = span * (weights[index] / total);
    const lineStart = cursor;
    const lineEnd = index === lines.length - 1 ? start + span : cursor + duration;
    cursor += duration;
    const words = wordsInLine(line, lineStart, lineEnd);
    if (words.length) groups.push(words);
  });
  return { groups, multiLine: true };
}

/** Emit a fragment's words, giving each display line its own group id. */
function emitFragment(
  tokens: TimedToken[],
  raw: string,
  start: number,
  end: number,
  source: number,
  state: { nextGroup: number },
): void {
  const { groups, multiLine } = fragmentLines(raw, start, end);
  for (const words of groups) {
    const group = multiLine || words.length >= 2 ? state.nextGroup++ : -1;
    for (const word of words) tokens.push({ ...word, source, group });
  }
}

/** Sort by time and drop repeated auto-caption words that overlap. */
function dedupe(tokens: TimedToken[]): TimedToken[] {
  const sorted = [...tokens].sort((a, b) => a.start - b.start || a.end - b.end);
  const out: TimedToken[] = [];
  for (const token of sorted) {
    const previous = out[out.length - 1];
    if (
      previous &&
      token.text.toLowerCase() === previous.text.toLowerCase() &&
      token.start < previous.end + 0.05
    ) {
      continue;
    }
    out.push(token);
  }
  return out;
}

/**
 * Force word timings to be monotonic and non-overlapping, so the game never has
 * two words active at once. Where a word's span runs into the next word's
 * start, the earlier word is shortened to meet it — the later word's timing is
 * trusted, since that is where the next note must land.
 */
function normaliseTiming(tokens: TimedToken[]): TimedToken[] {
  const out = tokens.map((token) => ({ ...token }));
  for (let i = 0; i < out.length; i++) {
    const current = out[i];
    if (current.end <= current.start) current.end = current.start + MIN_WORD_DURATION;

    const next = out[i + 1];
    if (next && next.start < current.end) {
      if (next.start > current.start) {
        current.end = next.start; // shorten the earlier word
      } else {
        next.start = current.end; // nudge the later word forward
      }
    }
    if (next && next.end <= next.start) next.end = next.start + MIN_WORD_DURATION;
  }
  return out;
}

/**
 * Parse a raw `json3` transcript into timed tokens.
 *
 * Handles three shapes:
 * - one segment per event (auto-generated): the event span is the word span,
 *   left ungrouped so consecutive words flow into lines;
 * - a whole line per event (human captions), possibly with newlines: each
 *   display line becomes a group;
 * - several segments with `tOffsetMs`: each segment is timed, and grouped when
 *   it holds more than one word.
 */
export function tokensFromJson3(json: unknown): ParsedCaptions {
  const events: Json3Event[] = Array.isArray((json as { events?: unknown })?.events)
    ? ((json as { events: Json3Event[] }).events ?? [])
    : [];
  const usable = events.filter(
    (event) =>
      event && Array.isArray(event.segs) && event.segs.length > 0 && event.aAppend !== 1,
  );
  if (!usable.length) return { tokens: [], kind: "unknown" };

  const singleSegment = usable.filter((event) => event.segs?.length === 1).length;
  const kind: CaptionKind = singleSegment / usable.length > 0.6 ? "asr" : "manual";

  const tokens: TimedToken[] = [];
  const state = { nextGroup: 0 };

  usable.forEach((event, index) => {
    const startMs = num(event.tStartMs);
    const endMs = startMs + num(event.dDurationMs);
    const start = startMs / 1000;
    const end = endMs / 1000;
    const segs = event.segs ?? [];
    const hasOffsets =
      segs.length > 1 && segs.some((seg) => num(seg.tOffsetMs) > 0);

    if (hasOffsets) {
      // Each segment carries its own offset (auto-captions time every word),
      // but the whole event is one display line. Time the segments
      // individually, then give them a single group so they stay together.
      const eventWords: WordSpan[] = [];
      segs.forEach((seg, i) => {
        const segStart = (startMs + num(seg.tOffsetMs)) / 1000;
        const next = segs.slice(i + 1).find((s) => typeof s.tOffsetMs === "number");
        const segEnd = next ? (startMs + num(next.tOffsetMs)) / 1000 : end;
        eventWords.push(...wordsInLine(cleanCaption(seg.utf8 ?? ""), segStart, segEnd));
      });
      if (eventWords.length) {
        const group = eventWords.length >= 2 ? state.nextGroup++ : -1;
        for (const word of eventWords) tokens.push({ ...word, source: index, group });
      }
      return;
    }

    emitFragment(tokens, segs.map((seg) => seg.utf8 ?? "").join(""), start, end, index, state);
  });

  return { tokens: normaliseTiming(dedupe(tokens)), kind };
}

/** Fall back to line-level subtitle segments when `json3` was not captured. */
export function tokensFromSegments(segments: CaptionSegment[]): TimedToken[] {
  const tokens: TimedToken[] = [];
  const state = { nextGroup: 0 };
  segments.forEach((segment, index) => {
    const start = Number(segment.start) || 0;
    const dur = Number(segment.dur) || 0;
    emitFragment(tokens, segment.text, start, start + dur, index, state);
  });
  return normaliseTiming(dedupe(tokens));
}

/**
 * Group timed tokens into lines. Words from a real caption line stay together;
 * ungrouped auto-caption words flow until a gap or the line-length cap.
 */
export function groupLines(tokens: TimedToken[]): {
  lines: TrackLine[];
  words: TrackWord[];
} {
  const lines: TrackLine[] = [];
  const words: TrackWord[] = [];

  let lineStart = 0;
  let lineEnd = 0;
  let lineFrom = 0;
  let currentGroup: number | null = null;

  const flush = () => {
    if (lineFrom === words.length) return;
    lines.push({ start: lineStart, end: lineEnd, from: lineFrom, to: words.length });
  };

  let previousEnd = Number.NEGATIVE_INFINITY;
  for (const token of tokens) {
    const match = normaliseMatch(token.text);
    if (!match) continue;

    const count = words.length - lineFrom;
    const sameGroup = token.group !== -1 && token.group === currentGroup;
    const flowContinues =
      token.group === -1 &&
      currentGroup === -1 &&
      token.start - previousEnd <= LINE_GAP &&
      count < LINE_MAX_WORDS;

    if (count > 0 && !sameGroup && !flowContinues) {
      flush();
      lineFrom = words.length;
    }
    if (words.length === lineFrom) lineStart = token.start;

    words.push({
      text: token.text,
      match,
      start: token.start,
      end: token.end,
      line: lines.length,
    });
    lineEnd = token.end;
    previousEnd = token.end;
    currentGroup = token.group;
  }
  flush();

  return { lines, words };
}
