import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { ultraStarHash, youtubeTrackId, youtubeWatchUrl } from "./track/source";
import { memoryStore } from "./track/store";
import { TRACK_VERSION, type Track } from "./track/types";
import {
  getCachedTrack,
  handleTrackRequest,
  hostnameAllowed,
  trackKey,
  TURNSTILE_TOKEN_HEADER,
  verifyTurnstile,
  type TurnstileConfig,
} from "./tracks-api";

// The upstream-failure paths log server-side; keep the test output clean.
let errorSpy: ReturnType<typeof spyOn>;
beforeEach(() => {
  errorSpy = spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  errorSpy.mockRestore();
});

const ID = "dQw4w9WgXcQ";
const YT = { kind: "youtube", id: ID } as const;

const TRACK: Track = {
  version: TRACK_VERSION,
  id: youtubeTrackId(ID),
  type: "youtube",
  title: "Test song",
  description: "",
  lang: "en",
  source: {
    captions: "manual",
    fetchedAt: "2026-01-01T00:00:00.000Z",
    url: youtubeWatchUrl(ID),
  },
  offset: 0,
  lines: [{ start: 0, end: 1, from: 0, to: 1 }],
  words: [{ text: "Hi", match: "hi", start: 0, end: 1, line: 0 }],
};

const BASE: TurnstileConfig = {
  secret: "secret",
  hostnames: ["typestar.happypaul55.com"],
  action: "track",
};

/** A siteverify stub that answers with the given fields. */
function siteverify(overrides: Record<string, unknown> = {}): typeof fetch {
  return async () =>
    Response.json({
      success: true,
      action: "track",
      hostname: "typestar.happypaul55.com",
      ...overrides,
    });
}

function request(token?: string): Request {
  return new Request(`https://typestar.happypaul55.com/api/track/${ID}`, {
    headers: token ? { [TURNSTILE_TOKEN_HEADER]: token } : {},
  });
}

describe("verifyTurnstile", () => {
  test("a request without a token is 'missing'", async () => {
    expect(await verifyTurnstile(request(), BASE)).toBe("missing");
  });

  test("a valid token passes", async () => {
    expect(await verifyTurnstile(request("tok"), { ...BASE, fetchImpl: siteverify() })).toBe("ok");
  });

  test("rejects the wrong action", async () => {
    const result = await verifyTurnstile(request("tok"), {
      ...BASE,
      fetchImpl: siteverify({ action: "login" }),
    });
    expect(result).toBe("failed");
  });

  test("rejects an unapproved hostname", async () => {
    const result = await verifyTurnstile(request("tok"), {
      ...BASE,
      fetchImpl: siteverify({ hostname: "evil.example" }),
    });
    expect(result).toBe("failed");
  });

  test("accepts a subdomain of an approved hostname", async () => {
    const result = await verifyTurnstile(request("tok"), {
      ...BASE,
      fetchImpl: siteverify({ hostname: "feature-login.typestar.happypaul55.com" }),
    });
    expect(result).toBe("ok");
  });

  test("rejects a hostname that only looks like a subdomain", async () => {
    const result = await verifyTurnstile(request("tok"), {
      ...BASE,
      fetchImpl: siteverify({ hostname: "evil-typestar.happypaul55.com" }),
    });
    expect(result).toBe("failed");
  });

  test("fails closed when siteverify reports failure", async () => {
    const result = await verifyTurnstile(request("tok"), {
      ...BASE,
      fetchImpl: siteverify({ success: false }),
    });
    expect(result).toBe("failed");
  });

  test("fails closed when siteverify errors", async () => {
    const fetchImpl = (async () => {
      throw new Error("boom");
    }) as unknown as typeof fetch;
    expect(await verifyTurnstile(request("tok"), { ...BASE, fetchImpl })).toBe("failed");
  });
});

describe("hostnameAllowed", () => {
  const allowed = ["typestar.happypaul55.com"];

  test("allows the exact hostname", () => {
    expect(hostnameAllowed("typestar.happypaul55.com", allowed)).toBe(true);
  });

  test("allows any subdomain", () => {
    expect(hostnameAllowed("feature-x.typestar.happypaul55.com", allowed)).toBe(true);
    expect(hostnameAllowed("a.b.typestar.happypaul55.com", allowed)).toBe(true);
  });

  test("is case-insensitive and tolerates whitespace", () => {
    expect(hostnameAllowed(" Feature-X.TypeStar.HappyPaul55.com ", allowed)).toBe(true);
  });

  test("rejects a parent domain, a sibling and a lookalike", () => {
    expect(hostnameAllowed("happypaul55.com", allowed)).toBe(false);
    expect(hostnameAllowed("other.example.com", allowed)).toBe(false);
    expect(hostnameAllowed("evil-typestar.happypaul55.com", allowed)).toBe(false);
    expect(hostnameAllowed("typestar.happypaul55.com.evil.example", allowed)).toBe(false);
  });

  test("rejects an empty hostname", () => {
    expect(hostnameAllowed("", allowed)).toBe(false);
  });
});

describe("handleTrackRequest turnstile gate", () => {
  test("serves a cached track without a human check", async () => {
    let checks = 0;
    const store = memoryStore({ [trackKey(YT, "en")]: JSON.stringify(TRACK) });
    const response = await handleTrackRequest(
      request(),
      {
        store,
        turnstile: {
          ...BASE,
          fetchImpl: (async () => {
            checks++;
            return Response.json({});
          }) as unknown as typeof fetch,
        },
      },
      YT,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-typestar-cache")).toBe("hit");
    expect(checks).toBe(0);
  });

  test("serves a bundled seed without a human check", async () => {
    let checks = 0;
    const response = await handleTrackRequest(
      request(),
      {
        store: memoryStore(),
        seed: async () => JSON.stringify(TRACK),
        turnstile: {
          ...BASE,
          fetchImpl: (async () => {
            checks++;
            return Response.json({});
          }) as unknown as typeof fetch,
        },
      },
      YT,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-typestar-cache")).toBe("seed");
    expect(checks).toBe(0);
  });

  test("asks for a check when a new song has no token", async () => {
    const response = await handleTrackRequest(
      request(),
      { store: memoryStore(), turnstile: { ...BASE, fetchImpl: siteverify() } },
      YT,
    );
    expect(response.status).toBe(403);
    expect((await response.json() as { error: string }).error).toBe("turnstile-required");
  });

  test("rejects a failed check", async () => {
    const response = await handleTrackRequest(
      request("bad"),
      {
        store: memoryStore(),
        turnstile: { ...BASE, fetchImpl: siteverify({ success: false }) },
      },
      YT,
    );
    expect(response.status).toBe(403);
    expect((await response.json() as { error: string }).error).toBe("turnstile-failed");
  });

  test("lets a verified request through to the upstream fetch", async () => {
    const response = await handleTrackRequest(
      request("tok"),
      {
        store: memoryStore(),
        retries: 1,
        turnstile: { ...BASE, fetchImpl: siteverify() },
        fetchImpl: (async () => {
          throw new Error("no network in tests");
        }) as unknown as typeof fetch,
      },
      YT,
    );
    // Past the gate: an upstream failure, not a 403.
    expect(response.status).toBe(502);
    expect((await response.json() as { error: string }).error).toBe("upstream-failed");
  });
});

describe("handleTrackRequest responses", () => {
  test("a HEAD request returns headers with no body", async () => {
    const store = memoryStore({ [trackKey(YT, "en")]: JSON.stringify(TRACK) });
    const response = await handleTrackRequest(
      new Request(`https://typestar.happypaul55.com/api/track/${ID}`, {
        method: "HEAD",
      }),
      { store },
      YT,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-typestar-cache")).toBe("hit");
    expect(await response.text()).toBe("");
  });

  test("an upstream failure never leaks the error detail", async () => {
    const response = await handleTrackRequest(
      request("tok"),
      {
        store: memoryStore(),
        retries: 1,
        turnstile: { ...BASE, fetchImpl: siteverify() },
        fetchImpl: (async () => {
          throw new Error("internal fallback host leaked");
        }) as unknown as typeof fetch,
      },
      YT,
    );
    expect(response.status).toBe(502);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.error).toBe("upstream-failed");
    expect(body.message).toBeUndefined();
  });
});

describe("getCachedTrack", () => {
  test("returns a cached track", async () => {
    const store = memoryStore({ [trackKey(YT, "en")]: JSON.stringify(TRACK) });
    expect((await getCachedTrack({ store }, YT))?.id).toBe(youtubeTrackId(ID));
  });

  test("returns a seeded track", async () => {
    const track = await getCachedTrack(
      { store: memoryStore(), seed: async () => JSON.stringify(TRACK) },
      YT,
    );
    expect(track?.id).toBe(youtubeTrackId(ID));
  });

  test("returns null when neither exists", async () => {
    expect(await getCachedTrack({ store: memoryStore() }, YT)).toBeNull();
  });

  test("returns null for an unusable cached value", async () => {
    const store = memoryStore({ [trackKey(YT, "en")]: "{not json" });
    expect(await getCachedTrack({ store }, YT)).toBeNull();
  });
});

const CHART = [
  "#TITLE:Code Monkey",
  "#ARTIST:Jonathan Coulton",
  "#MP3:audio.mp3",
  "#COVER:cover.jpg",
  "#BPM:320",
  "#GAP:675",
  ": 0 6 -4 Code",
  ": 8 3 -4  Mon",
  ": 12 2 -6 key",
  "- 52",
  "E",
].join("\n");

const SONG_URL = "https://raw.githubusercontent.com/example/songs/main/Code Monkey/song.txt";

describe("trackKey", () => {
  test("namespaces the key by version and source", () => {
    expect(trackKey(YT, "en")).toBe(
      `tracks/v${TRACK_VERSION}/youtube/dQw4w9WgXcQ/en.json`,
    );
    expect(trackKey({ kind: "ultrastar", url: SONG_URL }, "en")).toBe(
      `tracks/v${TRACK_VERSION}/ultrastar/${ultraStarHash(SONG_URL)}/en.json`,
    );
  });
});

describe("handleTrackRequest UltraStar", () => {
  test("fetches, builds, caches and resolves media against the chart URL", async () => {
    const store = memoryStore();
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/song.txt")) return new Response(CHART, { status: 200 });
      return new Response("missing", { status: 404 });
    }) as unknown as typeof fetch;

    const response = await handleTrackRequest(
      new Request(
        `https://typestar.happypaul55.com/api/track/ultrastar?url=${encodeURIComponent(SONG_URL)}&lang=en`,
      ),
      { store, fetchImpl },
      { kind: "ultrastar", url: SONG_URL },
    );

    expect(response.status).toBe(200);
    const track = (await response.json()) as Track;
    expect(track.type).toBe("ultrastar");
    expect(track.id.startsWith("ultrastar-")).toBe(true);
    expect(track.artist).toBe("Jonathan Coulton");
    expect(track.title).toBe("Code Monkey");
    expect(track.words.length).toBeGreaterThan(0);
    expect(track.notes?.length).toBeGreaterThan(0);
    expect(track.source.url).toBe(SONG_URL);
    // The raw headers are kept, known keys first.
    expect(track.headers?.TITLE).toBe("Code Monkey");
    expect(track.headers?.MP3).toBe("audio.mp3");
    expect(Object.keys(track.headers ?? {})[0]).toBe("TITLE");
    expect(track.media?.audio).toBe(
      "https://raw.githubusercontent.com/example/songs/main/Code%20Monkey/audio.mp3",
    );
    expect(track.media?.cover).toBe(
      "https://raw.githubusercontent.com/example/songs/main/Code%20Monkey/cover.jpg",
    );
    expect(await store.get(trackKey({ kind: "ultrastar", url: SONG_URL }, "en"))).not.toBeNull();
  });

  test("refuses a blocked URL before any fetch", async () => {
    let called = 0;
    const response = await handleTrackRequest(
      new Request(
        "https://typestar.happypaul55.com/api/track/ultrastar?url=http%3A%2F%2Flocalhost%2Fsong.txt",
      ),
      {
        store: memoryStore(),
        fetchImpl: (async () => {
          called++;
          return new Response("");
        }) as unknown as typeof fetch,
      },
      { kind: "ultrastar", url: "http://localhost/song.txt" },
    );
    expect(response.status).toBe(400);
    expect((await response.json() as { error: string }).error).toBe("blocked-url");
    expect(called).toBe(0);
  });

  test("serves a cached UltraStar track without a human check", async () => {
    const cached: Track = {
      ...TRACK,
      id: "ultrastar-abc",
      title: "Code Monkey",
      type: "ultrastar",
      source: { ...TRACK.source, url: SONG_URL },
      media: { audio: "https://example.com/audio.mp3" },
    };
    const store = memoryStore({
      [trackKey({ kind: "ultrastar", url: SONG_URL }, "en")]: JSON.stringify(cached),
    });
    let checks = 0;
    const response = await handleTrackRequest(
      new Request(
        `https://typestar.happypaul55.com/api/track/ultrastar?url=${encodeURIComponent(SONG_URL)}`,
      ),
      {
        store,
        turnstile: {
          ...BASE,
          fetchImpl: (async () => {
            checks++;
            return Response.json({});
          }) as unknown as typeof fetch,
        },
      },
      { kind: "ultrastar", url: SONG_URL },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-typestar-cache")).toBe("hit");
    expect(checks).toBe(0);
  });
});
