import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { memoryStore } from "./track/store";
import { TRACK_VERSION, type Track } from "./track/types";
import {
  getCachedTrack,
  handleTrackRequest,
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

const TRACK: Track = {
  version: TRACK_VERSION,
  id: ID,
  title: "Test song",
  description: "",
  lang: "en",
  source: { captions: "manual", fetchedAt: "2026-01-01T00:00:00.000Z" },
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

describe("handleTrackRequest turnstile gate", () => {
  test("serves a cached track without a human check", async () => {
    let checks = 0;
    const store = memoryStore({ [trackKey(ID, "en")]: JSON.stringify(TRACK) });
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
      ID,
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
      ID,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-typestar-cache")).toBe("seed");
    expect(checks).toBe(0);
  });

  test("asks for a check when a new song has no token", async () => {
    const response = await handleTrackRequest(
      request(),
      { store: memoryStore(), turnstile: { ...BASE, fetchImpl: siteverify() } },
      ID,
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
      ID,
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
      ID,
    );
    // Past the gate: an upstream failure, not a 403.
    expect(response.status).toBe(502);
    expect((await response.json() as { error: string }).error).toBe("upstream-failed");
  });
});

describe("handleTrackRequest responses", () => {
  test("a HEAD request returns headers with no body", async () => {
    const store = memoryStore({ [trackKey(ID, "en")]: JSON.stringify(TRACK) });
    const response = await handleTrackRequest(
      new Request(`https://typestar.happypaul55.com/api/track/${ID}`, {
        method: "HEAD",
      }),
      { store },
      ID,
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
      ID,
    );
    expect(response.status).toBe(502);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.error).toBe("upstream-failed");
    expect(body.message).toBeUndefined();
  });
});

describe("getCachedTrack", () => {
  test("returns a cached track", async () => {
    const store = memoryStore({ [trackKey(ID, "en")]: JSON.stringify(TRACK) });
    expect((await getCachedTrack({ store }, ID))?.id).toBe(ID);
  });

  test("returns a seeded track", async () => {
    const track = await getCachedTrack(
      { store: memoryStore(), seed: async () => JSON.stringify(TRACK) },
      ID,
    );
    expect(track?.id).toBe(ID);
  });

  test("returns null when neither exists", async () => {
    expect(await getCachedTrack({ store: memoryStore() }, ID)).toBeNull();
  });

  test("returns null for an unusable cached value", async () => {
    const store = memoryStore({ [trackKey(ID, "en")]: "{not json" });
    expect(await getCachedTrack({ store }, ID)).toBeNull();
  });
});
