/**
 * The scoring engine for singing, as a pure reducer.
 *
 * Where the typing engine consumes keystrokes, this one consumes frames of
 * microphone pitch: the browser hook calls it every animation frame with the
 * current player time, the detected MIDI note (or `null`) and the frame's
 * loudness. Each note is graded on how much of its span the singer held in
 * tune, then a hit/miss and a score are produced. Keeping it pure means the
 * scoring is unit-testable without a browser, a microphone or audio.
 *
 * Notes come from the track's `notes` (UltraStar charts). Rap notes ignore
 * pitch and are graded on presence; golden notes score double; the pitch
 * comparison is octave-insensitive by default, matching UltraStar's convention
 * that singers are not penalised for an octave.
 */

import {
  comboTier,
  HIT_BASE,
  MISS_PENALTY,
  NORMAL_FAIL_THRESHOLD,
  PRACTISE_REWIND,
  type FailMode,
  type GameMode,
  type Rank,
} from "./engine";
import type { TrackNote } from "../track/types";

/** Base points for a note held fully in tune. */
export const SING_NOTE_BASE = HIT_BASE;

/** Fraction of a note's span that must be in tune for it to count as a hit. */
export const HIT_FRACTION = 0.4;

/** How far before a note may be sung. */
export const DEFAULT_SING_LEAD = 0.2;
/** Extra time after a note's end before it is judged. */
export const DEFAULT_SING_GRACE = 0.3;
/** Longest gap between samples counted toward a note, in seconds. */
const MAX_SAMPLE_DT = 0.1;
/** RMS above which a rap note counts as performed. */
export const DEFAULT_VOICE_RMS = 0.02;

/** How strictly a singer must match the pitch, by difficulty. */
export const SING_TOLERANCE: Record<GameMode, number> = {
  easy: 2,
  normal: 1,
  hard: 0.5,
};

export interface SingConfig {
  notes: TrackNote[];
  /** Seconds added to every timestamp (the player's sync nudge). */
  offset: number;
  /** Pitch tolerance in semitones. */
  tolerance: number;
  /** How early, in seconds, a note may be sung. */
  lead: number;
  /** Extra time, in seconds, after a note's end before it is judged. */
  grace: number;
  /** Whether an octave difference is forgiven. */
  octaveInsensitive: boolean;
  /** RMS above which a rap note counts as performed. */
  voiceRms: number;
  /** How the run ends: normal (score floor), instant (first miss), fun, practise. */
  failMode: FailMode;
}

export type NoteResult = "pending" | "hit" | "miss";

export interface SingState {
  /** Index of the next note to sing. */
  pointer: number;
  results: NoteResult[];
  score: number;
  combo: number;
  maxCombo: number;
  hits: number;
  misses: number;
  /** Pitched frames heard while a note was active. */
  pitchedSamples: number;
  /** Of those, how many were within tolerance. */
  inTuneSamples: number;
  /** Seconds held in tune, per note (indexed by note). */
  noteInTune: number[];
  /** Time of the previous sample, used to integrate in-tune duration. */
  lastTime: number;
  finished: boolean;
  /** Set when the run is over because of a failure (score or a missed note). */
  failed: boolean;
  failReason: "score" | "mistake" | null;
  /** Practise rewinds taken. */
  replays: number;
  /** Practise: the time the singer should be sent back to, or null. */
  rewindTo: number | null;
  /** Practise: until this time, scoring and further rewinds are ignored. */
  ignoreUntil: number;
}

export type SingAction =
  | { type: "start"; time: number }
  | { type: "sample"; time: number; midi: number | null; rms: number }
  | { type: "reset" }
  | { type: "finish" }
  | { type: "clearRewind" };

export function createSingState(noteCount: number): SingState {
  return {
    pointer: 0,
    results: Array.from({ length: noteCount }, () => "pending" as NoteResult),
    score: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    pitchedSamples: 0,
    inTuneSamples: 0,
    noteInTune: Array.from({ length: noteCount }, () => 0),
    lastTime: Number.NEGATIVE_INFINITY,
    finished: noteCount === 0,
    failed: false,
    failReason: null,
    replays: 0,
    rewindTo: null,
    ignoreUntil: 0,
  };
}

export function makeSingConfig(
  notes: TrackNote[],
  options: Partial<Omit<SingConfig, "notes">> = {},
): SingConfig {
  return {
    notes,
    offset: options.offset ?? 0,
    tolerance: options.tolerance ?? SING_TOLERANCE.normal,
    lead: options.lead ?? DEFAULT_SING_LEAD,
    grace: options.grace ?? DEFAULT_SING_GRACE,
    octaveInsensitive: options.octaveInsensitive ?? true,
    voiceRms: options.voiceRms ?? DEFAULT_VOICE_RMS,
    failMode: options.failMode ?? "fun",
  };
}

/** The earliest time a note may be sung. */
export function noteOpenTime(note: TrackNote, config: Pick<SingConfig, "offset" | "lead">): number {
  return note.start + config.offset - config.lead;
}

/** The last time a note may be sung. */
export function noteDeadline(
  note: TrackNote,
  config: Pick<SingConfig, "offset" | "grace">,
): number {
  return note.end + config.offset + config.grace;
}

/** The MIDI number a note expects, or `null` for rap notes. */
export function expectedMidi(note: TrackNote): number | null {
  return note.pitch === null ? null : note.pitch + 60;
}

/**
 * Distance between two MIDI pitches in semitones. With `octaveInsensitive`, the
 * distance wraps at the octave, so singing the same note class an octave away
 * still counts.
 */
export function pitchDistance(a: number, b: number, octaveInsensitive: boolean): number {
  let distance = Math.abs(a - b);
  if (octaveInsensitive) {
    distance %= 12;
    if (distance > 6) distance = 12 - distance;
  }
  return distance;
}

/** Whether a single microphone frame matches the note it is sung against. */
function frameInTune(
  note: TrackNote,
  midi: number | null,
  rmsValue: number,
  config: SingConfig,
): boolean {
  const expected = expectedMidi(note);
  if (expected === null) return rmsValue >= config.voiceRms;
  if (midi === null) return false;
  return pitchDistance(midi, expected, config.octaveInsensitive) <= config.tolerance;
}

/** Send the singer back to replay the last few seconds (Practise mode). */
function practiseRewind(state: SingState, time: number, config: SingConfig): SingState {
  const target = Math.max(0, time - PRACTISE_REWIND);
  let pointer = 0;
  while (
    pointer < config.notes.length &&
    noteDeadline(config.notes[pointer], config) < target
  ) {
    pointer += 1;
  }
  return {
    ...state,
    pointer,
    results: state.results.map((result, index) => (index < pointer ? result : "pending")),
    // Fresh in-tune time for the notes being replayed.
    noteInTune: state.noteInTune.map((seconds, index) => (index < pointer ? seconds : 0)),
    combo: 0,
    replays: state.replays + 1,
    rewindTo: target,
    ignoreUntil: time,
    lastTime: target,
    finished: false,
    failed: false,
  };
}

/**
 * Resolve every note whose window has closed at `time`, applying the run mode:
 * instant fails on the first miss, normal fails below the score floor, practise
 * rewinds instead of penalising, and fun never fails.
 */
function resolveDue(state: SingState, time: number, config: SingConfig): SingState {
  if (state.finished || state.failed) return state;
  if (state.pointer >= config.notes.length) return state;

  const ignoring = config.failMode === "practise" && time < state.ignoreUntil;
  let pointer = state.pointer;
  let results = state.results;
  let score = state.score;
  let combo = state.combo;
  let maxCombo = state.maxCombo;
  let hits = state.hits;
  let misses = state.misses;
  let changed = false;

  while (pointer < config.notes.length) {
    const note = config.notes[pointer];
    if (time <= noteDeadline(note, config)) break;

    const duration = Math.max(note.end - note.start, 0.05);
    const fraction = Math.min(1, state.noteInTune[pointer] / duration);
    const golden = note.kind === "golden" || note.kind === "goldenRap";

    if (fraction >= HIT_FRACTION) {
      if (!changed) {
        results = [...results];
        changed = true;
      }
      results[pointer] = "hit";
      hits += 1;
      if (!ignoring) {
        const points = Math.round(
          HIT_BASE * fraction * (golden ? 2 : 1) * comboTier(combo),
        );
        score += points;
        combo += 1;
        maxCombo = Math.max(maxCombo, combo);
      }
      pointer += 1;
      continue;
    }

    // A miss. Practise replays the section instead of penalising it.
    if (config.failMode === "practise" && !ignoring) {
      return practiseRewind(
        {
          ...state,
          pointer,
          results: changed ? results : state.results,
          score,
          combo,
          maxCombo,
          hits,
          misses,
        },
        time,
        config,
      );
    }

    if (!changed) {
      results = [...results];
      changed = true;
    }
    results[pointer] = "miss";
    misses += 1;
    if (!ignoring) {
      combo = 0;
      score -= MISS_PENALTY;
    }
    pointer += 1;

    if (config.failMode === "instant" && !ignoring) {
      return {
        ...state,
        pointer,
        results,
        score,
        combo,
        maxCombo,
        hits,
        misses,
        finished: pointer >= config.notes.length,
        failed: true,
        failReason: "mistake",
      };
    }
  }

  if (!changed) return state;
  const next: SingState = {
    ...state,
    pointer,
    results,
    score,
    combo,
    maxCombo,
    hits,
    misses,
    finished: pointer >= config.notes.length,
  };
  if (config.failMode === "normal" && score < NORMAL_FAIL_THRESHOLD) {
    return { ...next, failed: true, failReason: "score" };
  }
  return next;
}

function sample(
  state: SingState,
  time: number,
  midi: number | null,
  rmsValue: number,
  config: SingConfig,
): SingState {
  if (state.finished || state.failed) return state;

  const resolved = resolveDue(state, time, config);
  // A finished, failed or rewinding state is not sung against.
  if (resolved.finished || resolved.failed || resolved.rewindTo !== null) {
    return resolved;
  }

  const index = resolved.pointer;
  const note = config.notes[index];
  if (!note) return resolved;

  const open = noteOpenTime(note, config);
  const deadline = noteDeadline(note, config);
  if (time < open || time > deadline) return { ...resolved, lastTime: time };

  const delta = Math.min(Math.max(time - resolved.lastTime, 0), MAX_SAMPLE_DT);
  const tuned = frameInTune(note, midi, rmsValue, config);

  const noteInTune = [...resolved.noteInTune];
  if (tuned) noteInTune[index] += delta;

  let pitchedSamples = resolved.pitchedSamples;
  let inTuneSamples = resolved.inTuneSamples;
  if (note.pitch !== null && midi !== null) {
    pitchedSamples += 1;
    if (tuned) inTuneSamples += 1;
  }

  return { ...resolved, noteInTune, pitchedSamples, inTuneSamples, lastTime: time };
}

/** Judge every remaining note and end the run (e.g. the song ended). */
function finish(state: SingState, config: SingConfig): SingState {
  if (state.finished || state.failed) return state;

  let pointer = state.pointer;
  let results = state.results;
  let score = state.score;
  let combo = state.combo;
  let maxCombo = state.maxCombo;
  let hits = state.hits;
  let misses = state.misses;
  let changed = false;

  while (pointer < config.notes.length) {
    const note = config.notes[pointer];
    const duration = Math.max(note.end - note.start, 0.05);
    const fraction = Math.min(1, state.noteInTune[pointer] / duration);
    const golden = note.kind === "golden" || note.kind === "goldenRap";
    if (!changed) {
      results = [...results];
      changed = true;
    }
    if (fraction >= HIT_FRACTION) {
      results[pointer] = "hit";
      score += Math.round(HIT_BASE * fraction * (golden ? 2 : 1) * comboTier(combo));
      hits += 1;
      combo += 1;
      maxCombo = Math.max(maxCombo, combo);
    } else {
      results[pointer] = "miss";
      misses += 1;
      combo = 0;
    }
    pointer += 1;
  }

  if (!changed) {
    return { ...state, pointer: config.notes.length, finished: true };
  }
  return {
    ...state,
    pointer,
    results,
    score,
    combo,
    maxCombo,
    hits,
    misses,
    finished: true,
  };
}

export function singReducer(
  state: SingState,
  action: SingAction,
  config: SingConfig,
): SingState {
  switch (action.type) {
    case "reset":
      return createSingState(config.notes.length);
    case "start":
      return { ...createSingState(config.notes.length), lastTime: action.time };
    case "sample":
      return sample(state, action.time, action.midi, action.rms, config);
    case "finish":
      return finish(state, config);
    case "clearRewind":
      return state.rewindTo === null ? state : { ...state, rewindTo: null };
  }
}

/** Percentage of sung pitched frames that were in tune, 0..1. */
export function singPitchAccuracy(state: SingState): number {
  return state.pitchedSamples ? state.inTuneSamples / state.pitchedSamples : 0;
}

/** How far through the notes the singer is, 0..1. */
export function singProgress(state: SingState, noteCount: number): number {
  return noteCount ? state.pointer / noteCount : 1;
}

/** A performance rank, weighing pitch accuracy and the note hit rate. */
export function singRank(state: SingState): Rank {
  const accuracy = singPitchAccuracy(state);
  const total = state.hits + state.misses;
  const hitRate = total ? state.hits / total : 0;
  const value = accuracy * 0.6 + hitRate * 0.4;
  if (value >= 0.95) return "S";
  if (value >= 0.85) return "A";
  if (value >= 0.7) return "B";
  if (value >= 0.55) return "C";
  return "D";
}
