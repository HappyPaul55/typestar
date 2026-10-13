import { describe, expect, test } from "bun:test";
import {
  currentChallenges,
  dailyChallenge,
  isoWeekKey,
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

describe("challenge", () => {
  test("is deterministic for a given day", () => {
    const date = new Date(Date.UTC(2026, 9, 12, 15, 30));
    const first = dailyChallenge(date);
    const second = dailyChallenge(date);
    expect(first.id).toBe("daily:2026-10-12");
    expect(second).toEqual(first);
  });

  test("picks a seeded track", () => {
    const daily = dailyChallenge(new Date(Date.UTC(2026, 9, 12)));
    expect(daily.trackId).toBe(`youtube-${daily.track.id}`);
  });

  test("carries no modifier", () => {
    const { daily, weekly } = currentChallenges(new Date(Date.UTC(2026, 9, 12)));
    expect("modifier" in daily).toBe(false);
    expect("modifier" in weekly).toBe(false);
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
