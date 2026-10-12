/**
 * The daily and weekly challenge.
 *
 * A challenge is derived purely from the date: one seeded (pre-warmed) track and
 * one modifier — a difficulty, a run mode and a playback speed — for the period.
 * There is no schedule to maintain and no cron: every server computes the same
 * challenge for the same moment, so its board is just a time-boxed query over
 * scores for that track and modifier.
 */

import { FEATURED_TRACKS, type FeaturedTrack } from "../../content/tracks/featured";
import type { FailMode, GameMode, PlaybackSpeed } from "../game/engine";

export type ChallengePeriod = "daily" | "weekly";

export interface ChallengeModifier {
  difficulty: GameMode;
  runMode: FailMode;
  speed: PlaybackSpeed;
}

export interface Challenge {
  period: ChallengePeriod;
  /** Stable id, e.g. `daily:2026-10-12` or `weekly:2026-W42`. */
  id: string;
  /** The period key alone, e.g. `2026-10-12`. */
  key: string;
  track: FeaturedTrack;
  /** The namespaced track id (`youtube-<id>`). */
  trackId: string;
  modifier: ChallengeModifier;
  startsAt: string;
  endsAt: string;
}

const DIFFICULTIES: GameMode[] = ["easy", "normal", "hard"];
const RUN_MODES: FailMode[] = ["fun", "normal", "instant"];
const SPEEDS: PlaybackSpeed[] = [0.75, 1, 1.25];

/** A small deterministic hash of a string (FNV-1a). */
function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function pick<T>(list: readonly T[], seed: number, salt: number): T {
  const value = (seed ^ Math.imul(salt, 0x9e3779b1)) >>> 0;
  return list[value % list.length] as T;
}

function pad(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}

/** The UTC calendar date, `YYYY-MM-DD`. */
export function utcDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** The ISO-8601 week, `YYYY-Www` (week 1 is the week containing 4 January). */
export function isoWeekKey(date: Date): string {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = (target.getUTCDay() + 6) % 7; // Monday = 0
  target.setUTCDate(target.getUTCDate() - day + 3); // Thursday of this week
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${target.getUTCFullYear()}-W${pad(week)}`;
}

/** Midnight UTC at the start of the day containing `date`. */
function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Monday 00:00 UTC at the start of the ISO week containing `date`. */
function startOfIsoWeek(date: Date): Date {
  const start = startOfUtcDay(date);
  const day = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - day);
  return start;
}

function build(
  period: ChallengePeriod,
  key: string,
  start: Date,
  end: Date,
): Challenge {
  if (FEATURED_TRACKS.length === 0) {
    throw new Error("A challenge needs at least one featured track.");
  }
  const id = `${period}:${key}`;
  const seed = hash(id);
  const track = pick(FEATURED_TRACKS, seed, 1);
  return {
    period,
    id,
    key,
    track,
    trackId: `youtube-${track.id}`,
    modifier: {
      difficulty: pick(DIFFICULTIES, seed, 2),
      runMode: pick(RUN_MODES, seed, 3),
      speed: pick(SPEEDS, seed, 4),
    },
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
  };
}

export function dailyChallenge(date: Date): Challenge {
  const start = startOfUtcDay(date);
  return build("daily", utcDateKey(start), start, new Date(start.getTime() + 86400000));
}

export function weeklyChallenge(date: Date): Challenge {
  const start = startOfIsoWeek(date);
  return build("weekly", isoWeekKey(start), start, new Date(start.getTime() + 7 * 86400000));
}

export function currentChallenges(date: Date): { daily: Challenge; weekly: Challenge } {
  return { daily: dailyChallenge(date), weekly: weeklyChallenge(date) };
}
