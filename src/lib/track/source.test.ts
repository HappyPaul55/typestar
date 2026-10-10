import { describe, expect, test } from "bun:test";
import {
  apiSourceFromRequest,
  hashUrl,
  normaliseSourceUrl,
  parseSourceValue,
  playSourceFromPathname,
  seedIdOf,
  toRawUrl,
  trackPath,
  ultraStarId,
} from "./source";

const SONG_URL = "https://raw.githubusercontent.com/example/songs/main/Code Monkey/song.txt";

describe("hashUrl / ultraStarId", () => {
  test("is stable, deterministic and short", () => {
    expect(hashUrl("hello")).toBe(hashUrl("hello"));
    expect(hashUrl("hello")).toHaveLength(16);
    expect(hashUrl("hello")).not.toBe(hashUrl("world"));
  });

  test("ids are prefixed and ignore the fragment", () => {
    expect(ultraStarId(SONG_URL).startsWith("ultrastar-")).toBe(true);
    expect(ultraStarId(`${SONG_URL}#x`)).toBe(ultraStarId(SONG_URL));
  });
});

describe("normaliseSourceUrl", () => {
  test("drops the fragment and encodes the space", () => {
    expect(normaliseSourceUrl(SONG_URL)).toContain("Code%20Monkey/song.txt");
    expect(normaliseSourceUrl(`${SONG_URL}#frag`)).toBe(normaliseSourceUrl(SONG_URL));
  });
});

describe("toRawUrl", () => {
  test("rewrites a GitHub blob link to raw", () => {
    expect(
      toRawUrl("https://github.com/example/songs/blob/main/Code Monkey/song.txt"),
    ).toBe(
      "https://raw.githubusercontent.com/example/songs/main/Code%20Monkey/song.txt",
    );
  });

  test("leaves other URLs alone", () => {
    expect(toRawUrl(SONG_URL)).toBe(SONG_URL);
  });
});

describe("parseSourceValue", () => {
  test("recognises a YouTube link and a bare id", () => {
    expect(parseSourceValue("dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
    expect(parseSourceValue("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
  });

  test("treats another http URL as an UltraStar chart", () => {
    expect(parseSourceValue(SONG_URL)).toEqual({ kind: "ultrastar", url: SONG_URL });
  });

  test("converts a GitHub blob link", () => {
    expect(
      parseSourceValue("https://github.com/example/songs/blob/main/x/song.txt"),
    ).toEqual({
      kind: "ultrastar",
      url: "https://raw.githubusercontent.com/example/songs/main/x/song.txt",
    });
  });

  test("rejects junk", () => {
    expect(parseSourceValue("hello world")).toBeNull();
    expect(parseSourceValue("")).toBeNull();
  });
});

describe("trackPath", () => {
  test("YouTube uses the id", () => {
    expect(trackPath({ id: "dQw4w9WgXcQ" })).toBe("/play/youtube/dQw4w9WgXcQ");
  });

  test("UltraStar encodes its source URL", () => {
    expect(trackPath({ id: "ultrastar-x", origin: "ultrastar", sourceUrl: SONG_URL })).toBe(
      `/play/ultrastar/${encodeURIComponent(SONG_URL)}`,
    );
  });
});

describe("playSourceFromPathname", () => {
  test("reads the typed routes and the legacy one", () => {
    expect(playSourceFromPathname("/play/youtube/dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
    expect(
      playSourceFromPathname(`/play/ultrastar/${encodeURIComponent(SONG_URL)}`),
    ).toEqual({ kind: "ultrastar", url: SONG_URL });
    expect(playSourceFromPathname("/play/dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
  });

  test("ignores the picker, the local route and junk", () => {
    expect(playSourceFromPathname("/play")).toBeNull();
    expect(playSourceFromPathname("/play/local")).toBeNull();
    expect(playSourceFromPathname("/play/ultrastar/not-a-url")).toBeNull();
  });
});

describe("apiSourceFromRequest", () => {
  test("reads all three API shapes", () => {
    expect(
      apiSourceFromRequest("/api/track/youtube/dQw4w9WgXcQ", new URLSearchParams()),
    ).toEqual({ kind: "youtube", id: "dQw4w9WgXcQ" });
    expect(
      apiSourceFromRequest("/api/track/ultrastar", new URLSearchParams({ url: SONG_URL })),
    ).toEqual({ kind: "ultrastar", url: SONG_URL });
    expect(apiSourceFromRequest("/api/track/dQw4w9WgXcQ", new URLSearchParams())).toEqual({
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
  });

  test("returns null without a url", () => {
    expect(apiSourceFromRequest("/api/track/ultrastar", new URLSearchParams())).toBeNull();
  });
});

describe("seedIdOf", () => {
  test("YouTube is the id, UltraStar is the hash id", () => {
    expect(seedIdOf({ kind: "youtube", id: "dQw4w9WgXcQ" })).toBe("dQw4w9WgXcQ");
    expect(seedIdOf({ kind: "ultrastar", url: SONG_URL })).toBe(ultraStarId(SONG_URL));
  });
});
