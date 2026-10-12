import { describe, expect, test } from "bun:test";
import { playHref } from "./format";

describe("playHref", () => {
  test("builds a YouTube play link", () => {
    expect(playHref("youtube-abc123", "youtube", "en")).toBe("/play/youtube/abc123");
  });

  test("prefixes a non-default locale", () => {
    expect(playHref("youtube-abc123", "youtube", "de")).toBe("/de/play/youtube/abc123");
  });

  test("falls back to the picker for a track with no page", () => {
    expect(playHref("ultrastar-deadbeef", "ultrastar", "en")).toBe("/play");
    expect(playHref("ultrastar-deadbeef", "ultrastar", "ja")).toBe("/ja/play");
  });
});
