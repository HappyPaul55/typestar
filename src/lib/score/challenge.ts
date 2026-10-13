/**
 * The daily and weekly challenge.
 *
 * A period is derived purely from the date, so every server agrees on when it
 * starts and ends and there is no cron to maintain. The song is not derived: it
 * is the most-played featured track that has not been a challenge yet
 * ({@link pickChallengeTrack}), chosen once per period and recorded in the
 * `challenge` table so it stays the same for everyone from then on.
 */

import { FEATURED_TRACKS, type FeaturedTrack } from "../../content/tracks/featured";

export type ChallengePeriod = "daily" | "weekly";

/** A stretch of time: the day or the ISO week a challenge runs for. */
export interface ChallengeWindow {
  period: ChallengePeriod;
  /** Stable id, e.g. `daily:2026-10-12` or `weekly:2026-W42`. */
  id: string;
  /** The period key alone, e.g. `2026-10-12`. */
  key: string;
  startsAt: string;
  endsAt: string;
}

/** A window with the song it was given. */
export interface Challenge extends ChallengeWindow {
  track: FeaturedTrack;
  /** The namespaced track id (`youtube-<id>`). */
  trackId: string;
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
): ChallengeWindow {
  return {
    period,
    id: `${period}:${key}`,
    key,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
  };
}

export function dailyChallenge(date: Date): ChallengeWindow {
  const start = startOfUtcDay(date);
  return build("daily", utcDateKey(start), start, new Date(start.getTime() + 86400000));
}

export function weeklyChallenge(date: Date): ChallengeWindow {
  const start = startOfIsoWeek(date);
  return build("weekly", isoWeekKey(start), start, new Date(start.getTime() + 7 * 86400000));
}

export function currentChallenges(date: Date): { daily: ChallengeWindow; weekly: ChallengeWindow } {
  return { daily: dailyChallenge(date), weekly: weeklyChallenge(date) };
}

/** The periods immediately before the ones containing `date`. */
export function previousChallenges(date: Date): { daily: ChallengeWindow; weekly: ChallengeWindow } {
  return {
    daily: dailyChallenge(new Date(date.getTime() - 86400000)),
    weekly: weeklyChallenge(new Date(date.getTime() - 7 * 86400000)),
  };
}

/** The namespaced track id a featured track is stored and scored under. */
export function featuredTrackId(track: FeaturedTrack): string {
  return `youtube-${track.id}`;
}

/**
 * The next challenge song: the most-played featured track that has not been a
 * challenge yet. Ties keep the featured order, so a cold start (no scores at
 * all) is stable.
 *
 * Once every featured track has had a turn the whole list is eligible again and
 * the one used longest ago wins, so a short list still rotates rather than
 * settling on a single song.
 */
export function pickChallengeTrack(
  used: ReadonlySet<string>,
  plays: ReadonlyMap<string, number>,
  lastUsed: ReadonlyMap<string, number>,
): FeaturedTrack {
  if (FEATURED_TRACKS.length === 0) {
    throw new Error("A challenge needs at least one featured track.");
  }

  const unused = FEATURED_TRACKS.filter((track) => !used.has(featuredTrackId(track)));
  if (unused.length > 0) {
    let best = unused[0];
    for (const track of unused) {
      if ((plays.get(featuredTrackId(track)) ?? 0) > (plays.get(featuredTrackId(best)) ?? 0)) {
        best = track;
      }
    }
    return best;
  }

  let oldest = FEATURED_TRACKS[0];
  for (const track of FEATURED_TRACKS) {
    if ((lastUsed.get(featuredTrackId(track)) ?? 0) < (lastUsed.get(featuredTrackId(oldest)) ?? 0)) {
      oldest = track;
    }
  }
  return oldest;
}
