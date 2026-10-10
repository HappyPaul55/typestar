/**
 * The UltraStar karaoke file format.
 *
 * A song is a `.txt` file with a `#KEY:VALUE` header and a body of timed notes.
 * Unlike YouTube captions, UltraStar times every syllable, so the word timings
 * this produces are measured rather than estimated.
 *
 * Format reference: https://github.com/UltraStar-Deluxe/format
 *
 * This module is pure and unit-tested. It only reads the text; resolving the
 * referenced audio/video files is the local library's job.
 */

import { normaliseMatch } from "./parse";
import {
  TRACK_VERSION,
  type Track,
  type TrackLine,
  type TrackNote,
  type TrackNoteKind,
  type TrackWord,
} from "./types";

/** A note's kind: a sung note, or an end-of-phrase (line break) marker. */
export type UltraStarNoteKind = "note" | "phrase";

export interface UltraStarNote {
  kind: UltraStarNoteKind;
  /** Start time in seconds from the beginning of the audio. */
  start: number;
  /** End time in seconds. For a phrase marker this equals `start`. */
  end: number;
  /** Raw lyric text (leading space / `~` still present). */
  text: string;
  /** The note type character (`:`, `*`, `R`, `G`, `F`), or `-` for a phrase. */
  type: string;
  /**
   * Pitch in semitones relative to C4 (MIDI 60), or `null` for phrase markers
   * and rap notes (whose pitch is ignored by the format).
   */
  pitch: number | null;
  /** How the note is scored (normal, golden, rap, golden rap). */
  noteKind: TrackNoteKind;
  /** 1 or 2 for a duet voice. */
  voice: number;
}

export interface UltraStarSong {
  title: string;
  artist: string;
  /** `#MP3` file reference, relative to the song file. */
  audio: string | null;
  /** `#VIDEO` file reference, relative to the song file. */
  video: string | null;
  /** `#LANGUAGE`, when present. */
  language: string | null;
  /** `#BPM` value as written (beats per minute once multiplied by four). */
  bpm: number;
  /** `#GAP` in milliseconds: the time from the audio start to beat 0. */
  gap: number;
  /** `#VIDEOGAP` in seconds: how far the video is delayed behind the audio. */
  videoGap: number;
  notes: UltraStarNote[];
}

/** Parse the `#KEY:VALUE` header lines, stopping at the first body line. */
export function parseUltraStarHeaders(text: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!trimmed.startsWith("#")) break;
    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;
    const key = trimmed.slice(1, colon).trim().toUpperCase();
    const value = trimmed.slice(colon + 1).trim();
    if (key) headers[key] = value;
  }
  return headers;
}

function toNumber(value: string | undefined): number | null {
  if (value === undefined) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Seconds per beat. The `#BPM` value is implicitly quadrupled. */
export function secondsPerBeat(bpm: number): number {
  return bpm > 0 ? 60 / (bpm * 4) : 0;
}

interface RawNote {
  type: string;
  startBeat: number;
  duration: number;
  pitch: number;
  text: string;
}

/**
 * Split a note line into its fields. The lyric is everything after the pitch
 * and exactly one separator, so a leading space (a new-word marker) survives.
 */
function parseNoteFields(line: string): RawNote | null {
  const type = line[0];
  const rest = line.slice(1).replace(/^[ \t]/, "");
  const match = /^(\d+)[ \t]+(\d+)[ \t]+(-?\d+)[ \t](.*)$/.exec(rest);
  if (!match) return null;
  return {
    type,
    startBeat: Number(match[1]),
    duration: Number(match[2]),
    pitch: Number(match[3]),
    text: match[4],
  };
}

/**
 * Map an UltraStar note type character onto its scoring kind. Rap notes carry
 * no meaningful pitch; freestyle notes are dropped before this point.
 */
function noteKindOf(type: string): TrackNoteKind {
  if (type === "*") return "golden";
  if (type === "R") return "rap";
  if (type === "G") return "goldenRap";
  return "normal";
}

/** Whether a note type's pitch is meaningful (rap notes ignore pitch). */
function noteHasPitch(kind: TrackNoteKind): boolean {
  return kind === "normal" || kind === "golden";
}

/**
 * Parse a whole UltraStar document. Handles regular, golden, rap and freestyle
 * notes, `-` end-of-phrase markers, `P1`/`P2` duet voices and relative mode.
 * Freestyle notes are dropped: they are not meant to be typed.
 */
export function parseUltraStar(text: string): UltraStarSong {
  const headers = parseUltraStarHeaders(text);
  const bpm = toNumber(headers.BPM) ?? 0;
  const gapMs = toNumber(headers.GAP) ?? 0;
  const videoGap = toNumber(headers.VIDEOGAP) ?? 0;
  const relative = (headers.RELATIVE ?? "").toLowerCase() === "yes";
  const beat = secondsPerBeat(bpm);
  const gapSeconds = gapMs / 1000;

  const bodyLines: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed === "E") break;
    bodyLines.push(trimmed);
  }

  // Determine the voice to sing: if the song uses voice changes, prefer voice 1.
  let voiceChanged = false;
  const voicesWithNotes = new Set<number>();
  let scanning = 1;
  for (const line of bodyLines) {
    const voice = /^P([12])$/.exec(line);
    if (voice) {
      scanning = Number(voice[1]);
      voiceChanged = true;
      continue;
    }
    if (line.startsWith("-")) continue;
    if (parseNoteFields(line)) voicesWithNotes.add(scanning);
  }
  const chosenVoice = voiceChanged
    ? voicesWithNotes.has(1)
      ? 1
      : ([...voicesWithNotes].sort((a, b) => a - b)[0] ?? 0)
    : 0;

  const notes: UltraStarNote[] = [];
  // In relative mode `rel` counts in beats: it starts at the GAP (expressed in
  // beats) and phrase markers carry an extra offset for the lines that follow.
  let relBeats = beat > 0 ? gapSeconds / beat : 0;
  let currentVoice = 1;

  for (const line of bodyLines) {
    const voice = /^P([12])$/.exec(line);
    if (voice) {
      currentVoice = Number(voice[1]);
      continue;
    }

    const included = chosenVoice === 0 || currentVoice === chosenVoice;

    if (line.startsWith("-")) {
      const fields = line.slice(1).trim().split(/[ \t]+/);
      const startBeat = toNumber(fields[0]) ?? 0;
      const start = relative ? (relBeats + startBeat) * beat : gapSeconds + startBeat * beat;
      if (included) {
        notes.push({
          kind: "phrase",
          start,
          end: start,
          text: "",
          type: "-",
          pitch: null,
          noteKind: "normal",
          voice: currentVoice,
        });
      }
      if (relative) relBeats += toNumber(fields[1]) ?? 0;
      continue;
    }

    const note = parseNoteFields(line);
    if (!note || note.type === "F" || !included) continue;
    const start = relative
      ? (relBeats + note.startBeat) * beat
      : gapSeconds + note.startBeat * beat;
    const noteKind = noteKindOf(note.type);
    notes.push({
      kind: "note",
      start,
      end: start + note.duration * beat,
      text: note.text,
      type: note.type,
      pitch: noteHasPitch(noteKind) ? note.pitch : null,
      noteKind,
      voice: currentVoice,
    });
  }

  return {
    title: headers.TITLE ?? "",
    artist: headers.ARTIST ?? "",
    audio: headers.MP3 ?? null,
    video: headers.VIDEO ?? null,
    language: headers.LANGUAGE ?? null,
    bpm,
    gap: gapMs,
    videoGap,
    notes,
  };
}

/** Merge UltraStar syllables into whole words, using the leading-space/`~` rules. */
export function ultraStarWords(notes: readonly UltraStarNote[]): {
  words: TrackWord[];
  lines: TrackLine[];
  notes: TrackNote[];
} {
  const words: TrackWord[] = [];
  const lines: TrackLine[] = [];
  const trackNotes: TrackNote[] = [];
  let lineFrom = 0;
  let word: {
    text: string;
    start: number;
    end: number;
    notes: { start: number; end: number; pitch: number | null; kind: TrackNoteKind }[];
  } | null = null;
  let phrases = 0;

  const flushWord = () => {
    if (!word) return;
    const match = normaliseMatch(word.text);
    if (match) {
      // The word index it is about to get, before it is pushed.
      const wordIndex = words.length;
      words.push({
        text: word.text,
        match,
        start: word.start,
        end: word.end,
        line: lines.length,
      });
      // Only keep notes that belong to a real (non-empty) word.
      for (const note of word.notes) {
        trackNotes.push({ word: wordIndex, ...note });
      }
    }
    word = null;
  };
  const flushLine = () => {
    flushWord();
    if (words.length > lineFrom) {
      lines.push({
        start: words[lineFrom].start,
        end: words[words.length - 1].end,
        from: lineFrom,
        to: words.length,
      });
    }
    lineFrom = words.length;
  };

  for (const note of notes) {
    if (note.kind === "phrase") {
      phrases += 1;
      flushLine();
      continue;
    }

    let text = note.text;
    let newWord = false;
    if (text.startsWith("~")) {
      // Continuation: glue to the current word without a space.
      text = text.slice(1).replace(/^[ \t]+/, "");
    } else if (/^[ \t]/.test(text)) {
      // A leading space marks the start of a new word.
      newWord = true;
      text = text.replace(/^[ \t]+/, "");
    }

    const noteData = {
      start: note.start,
      end: note.end,
      pitch: note.pitch,
      kind: note.noteKind,
    };

    if (newWord || !word) {
      flushWord();
      word = { text, start: note.start, end: note.end, notes: [noteData] };
    } else {
      word.text += text;
      word.end = note.end;
      word.notes.push(noteData);
    }
  }
  flushLine();

  // Songs without explicit phrase markers get lines split on musical gaps, so a
  // whole verse is not a single (unwinnable) line. Note→word links are
  // unaffected: splitting only regroups words.
  if (phrases === 0 && words.length) {
    const split = splitLinesByGaps(words);
    return { words: split.words, lines: split.lines, notes: trackNotes };
  }
  return { words, lines, notes: trackNotes };
}

/** Rebuild lines by splitting on gaps between words (for marker-less songs). */
function splitLinesByGaps(
  words: TrackWord[],
  gap = 1.5,
  maxWords = 10,
): { words: TrackWord[]; lines: TrackLine[] } {
  const lines: TrackLine[] = [];
  let from = 0;
  for (let i = 1; i <= words.length; i++) {
    const previous = words[i - 1];
    const next = words[i];
    const brk = !next || next.start - previous.end > gap || i - from >= maxWords;
    if (!brk) continue;
    for (let j = from; j < i; j++) words[j].line = lines.length;
    lines.push({ start: words[from].start, end: words[i - 1].end, from, to: i });
    from = i;
  }
  return { words, lines };
}

export interface UltraStarTrackMeta {
  id: string;
  lang: string;
  description: string;
}

/** Build a {@link Track} from a parsed UltraStar song. */
export function ultraStarTrack(song: UltraStarSong, meta: UltraStarTrackMeta): Track {
  const { words, lines, notes } = ultraStarWords(song.notes);
  return {
    version: TRACK_VERSION,
    id: meta.id,
    title: song.title,
    description: meta.description,
    lang: meta.lang,
    source: { captions: "manual", fetchedAt: new Date().toISOString() },
    offset: 0,
    lines,
    words,
    // Pitch data is what lets a singer be scored; caption tracks have none.
    ...(notes.length ? { notes } : {}),
  };
}
