import { describe, expect, test } from "bun:test";
import { FEATURED_TRACKS } from "../../content/tracks/featured";
import {
  currentChallenges,
  dailyChallenge,
  featuredTrackId,
  isoWeekKey,
  pickChallengeTrack,
  previousChallenges,
  utcDateKey,
  weeklyChallenge,
} from "./challenge";

describe("period keys", () => {
  test("utcDateKey", () => {
    expect(utcDateKey(new Date(Date.UTC(2026, 9, 12)))).toBe("2026-10-12");
    expect(utcDateKey(new Date(Date.UTC(2026, 0, 1)))).toBe("2026-01-01");
  });

  test("isoWeekKey", () => {
    expect(isoWeekKey(new Date(Date.UTC(2026, 0, 1)))).toBe("2026-W01");
    // 2026-10-12 is the Monday starting ISO week 42.
    expect(isoWeekKey(new Date(Date.UTC(2026, 9, 12)))).toBe("2026-W42");
  });
});

describe("challenge window", () => {
  test("is deterministic for a given day", () => {
    const date = new Date(Date.UTC(2026, 9, 12, 15, 30));
    const first = dailyChallenge(date);
    const second = dailyChallenge(date);
    expect(first.id).toBe("daily:2026-10-12");
    expect(second).toEqual(first);
  });

  test("carries no song and no modifier of its own", () => {
    const { daily, weekly } = currentChallenges(new Date(Date.UTC(2026, 9, 12)));
    expect("track" in daily).toBe(false);
    expect("trackId" in daily).toBe(false);
    expect("modifier" in daily).toBe(false);
    expect("track" in weekly).toBe(false);
  });

  test("the previous period is the one before", () => {
    // 2026-10-12 is a Monday, in ISO week 42.
    const { daily, weekly } = previousChallenges(new Date(Date.UTC(2026, 9, 12, 6)));
    expect(daily.id).toBe("daily:2026-10-11");
    expect(weekly.id).toBe("weekly:2026-W41");
  });

  test("daily spans a day and weekly a week", () => {
    const { daily, weekly } = currentChallenges(new Date(Date.UTC(2026, 9, 12)));
    expect(new Date(daily.endsAt).getTime() - new Date(daily.startsAt).getTime()).toBe(
      86400000,
    );
    expect(new Date(weekly.endsAt).getTime() - new Date(weekly.startsAt).getTime()).toBe(
      7 * 86400000,
    );
    expect(weekly.period).toBe("weekly");
  });
});

describe("pickChallengeTrack", () => {
  const ids = FEATURED_TRACKS.map(featuredTrackId);
  const noPlays = new Map<string, number>();
  const never = new Map<string, number>();

  test("starts at the first featured track when nothing has been played", () => {
    expect(pickChallengeTrack(new Set(), noPlays, never)).toEqual(FEATURED_TRACKS[0]);
  });

  test("takes the most played track that has not had a turn", () => {
    const plays = new Map([
      [ids[1], 3],
      [ids[2], 9],
    ]);
    expect(pickChallengeTrack(new Set(), plays, never)).toEqual(FEATURED_TRACKS[2]);
  });

  test("skips a track that has already been a challenge", () => {
    const plays = new Map([
      [ids[0], 9],
      [ids[1], 3],
    ]);
    expect(pickChallengeTrack(new Set([ids[0]]), plays, never)).toEqual(FEATURED_TRACKS[1]);
  });

  test("keeps the featured order on a tie", () => {
    const plays = new Map([
      [ids[1], 4],
      [ids[2], 4],
    ]);
    expect(pickChallengeTrack(new Set(), plays, never)).toEqual(FEATURED_TRACKS[1]);
  });

  test("reuses the track used longest ago once every one has had a turn", () => {
    const used = new Set(ids);
    const byOrder = new Map(ids.map((id, index): [string, number] => [id, 1000 + index]));
    expect(pickChallengeTrack(used, noPlays, byOrder)).toEqual(FEATURED_TRACKS[0]);

    // Push the first track to the back of the queue and it moves on.
    const rotated = new Map(ids.map((id, index): [string, number] => [id, index === 0 ? 9999 : 1000 + index]));
    expect(pickChallengeTrack(used, noPlays, rotated)).toEqual(FEATURED_TRACKS[1]);
  });
});
