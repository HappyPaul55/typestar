import { describe, expect, test } from "bun:test";
import { memoryStore } from "./track/store";
import { TRACK_VERSION, type Track } from "./track/types";
import {
  handleTrackRequest,
  trackKey,
  TURNSTILE_TOKEN_HEADER,
  verifyTurnstile,
  type TurnstileConfig,
} from "./tracks-api";

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
