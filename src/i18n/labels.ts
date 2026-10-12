/**
 * Dictionary keys for the small vocabularies shown across the game and the
 * score pages: play styles, difficulties, run modes and the results metrics.
 *
 * The pure engines and the score helpers speak plain identifiers (`hard`,
 * `practise`, `best combo`, `Normal`); this is where one becomes a translated
 * label. Anything unrecognised falls back to the raw value, so a new style or
 * metric still renders sensibly before its key exists.
 */

import type { MessageKey, Translate } from "./index";
import type { FailMode, GameMode } from "../lib/game/engine";
import type { PlayStyle } from "../lib/game/modes";

const STYLE_KEY: Record<PlayStyle, MessageKey> = {
  type: "style.type",
  sing: "style.sing",
};

const DIFFICULTY_KEY: Record<GameMode, MessageKey> = {
  easy: "difficulty.easy",
  normal: "difficulty.normal",
  hard: "difficulty.hard",
};

const RUN_MODE_KEY: Record<FailMode, MessageKey> = {
  normal: "run.normal",
  instant: "run.instant",
  fun: "run.fun",
  practise: "run.practise",
};

/** The results grid: the engines' metric labels, mapped back to keys. */
const METRIC_KEY: Record<string, MessageKey> = {
  difficulty: "metric.difficulty",
  "run mode": "metric.runMode",
  speed: "metric.speed",
  replays: "metric.replays",
  song: "metric.song",
  artist: "metric.artist",
  time: "metric.time",
  "pitch accuracy": "metric.pitchAccuracy",
  notes: "metric.notes",
  "perfect notes": "metric.perfectNotes",
  "best combo": "metric.bestCombo",
  accuracy: "metric.accuracy",
  "perfect hits": "metric.perfectHits",
  "perfect lines": "metric.perfectLines",
  words: "metric.words",
  "wrong keys": "metric.wrongKeys",
  wpm: "metric.wpm",
};

/** A play style's label (`type` → "Type"). */
export function styleLabel(id: string, t: Translate): string {
  const key = STYLE_KEY[id as PlayStyle];
  return key ? t(key) : id;
}

/** A difficulty's label (`hard` → "Hard"). */
export function difficultyLabel(id: string, t: Translate): string {
  const key = DIFFICULTY_KEY[id as GameMode];
  return key ? t(key) : id;
}

/** A run mode's label (`practise` → "Practise"). */
export function runModeLabel(id: string, t: Translate): string {
  const key = RUN_MODE_KEY[id as FailMode];
  return key ? t(key) : id;
}

/** A playback speed's label; only the normal rate is a word. */
export function speedLabel(speed: number, t: Translate): string {
  return speed === 1 ? t("speed.normal") : `${speed}×`;
}

/** A results metric's label. */
export function metricLabel(label: string, t: Translate): string {
  const key = METRIC_KEY[label];
  return key ? t(key) : label;
}

/** A results metric's value, when it names a difficulty, run mode or speed. */
export function metricValue(label: string, value: string, t: Translate): string {
  if (label === "difficulty") return difficultyLabel(value, t);
  if (label === "run mode") return runModeLabel(value, t);
  if (label === "speed") return value === "Normal" ? t("speed.normal") : value;
  return value;
}
