import { describe, expect, test } from "bun:test";
import {
  canonicalTimeline,
  parseTimeline,
  timelineChecksum,
  TIMELINE_VERSION,
  type TimelineEvent,
} from "./timeline";

describe("parseTimeline", () => {
  test("accepts a valid timeline", () => {
    const timeline = parseTimeline({
      version: TIMELINE_VERSION,
      events: [{ t: "k", at: 1, key: "a" }],
    });
    expect(timeline?.events).toHaveLength(1);
  });

  test("rejects an empty or wrong-version timeline", () => {
    expect(parseTimeline({ version: TIMELINE_VERSION, events: [] })).toBeNull();
    expect(
      parseTimeline({ version: 99, events: [{ t: "k", at: 1, key: "a" }] }),
    ).toBeNull();
  });

  test("rejects malformed events", () => {
    expect(parseTimeline({ version: TIMELINE_VERSION, events: [{ t: "k", at: 1 }] })).toBeNull();
    expect(parseTimeline({ version: TIMELINE_VERSION, events: [{ t: "z", at: 1 }] })).toBeNull();
    expect(
      parseTimeline({ version: TIMELINE_VERSION, events: [{ t: "k", at: "x", key: "a" }] }),
    ).toBeNull();
    expect(
      parseTimeline({ version: TIMELINE_VERSION, events: [{ t: "s", at: 1, m: 60, r: 0.1 }] }),
    ).not.toBeNull();
  });
});

describe("timelineChecksum", () => {
  test("is stable and order-sensitive", async () => {
    const events: TimelineEvent[] = [
      { t: "k", at: 1, key: "a" },
      { t: "f", at: 2 },
    ];
    const first = await timelineChecksum("nonce", events);
    expect(await timelineChecksum("nonce", events)).toBe(first);
    expect(await timelineChecksum("nonce", [...events].reverse())).not.toBe(first);
  });

  test("depends on the nonce", async () => {
    const events: TimelineEvent[] = [{ t: "f", at: 2 }];
    expect(await timelineChecksum("a", events)).not.toBe(
      await timelineChecksum("b", events),
    );
  });
});

describe("canonicalTimeline", () => {
  test("is independent of key order", () => {
    const a: TimelineEvent[] = [{ t: "k", at: 1, key: "a" }];
    expect(canonicalTimeline(a)).toBe("k:1:a");
  });
});
