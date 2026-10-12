import { describe, expect, test } from "bun:test";
import type { Track } from "../track/types";
import { handleScoreRequest, type ScoreEnv } from "./api";
import { createDevScoreStore } from "./dev-store";
import { timelineChecksum, type TimelineEvent } from "./timeline";
import type { SqlStore } from "./store";

const SECRET = "test-secret-that-is-at-least-32-characters-long";

const SETTINGS = {
  trackId: "youtube-abcdefghijk",
  style: "type" as const,
  difficulty: "normal" as const,
  runMode: "fun" as const,
  speed: 1 as const,
  offset: 0,
};

function testTrack(): Track {
  return {
    version: 6,
    id: "youtube-abcdefghijk",
    type: "youtube",
    title: "Test song",
    description: "desc",
    lang: "en",
    source: { captions: "manual", fetchedAt: "2024-01-01T00:00:00Z" },
    offset: 0,
    lines: [
      { start: 1, end: 1.9, from: 0, to: 2 },
      { start: 2.5, end: 2.9, from: 2, to: 3 },
    ],
    words: [
      { text: "Hello", match: "hello", start: 1, end: 1.4, line: 0 },
      { text: "world", match: "world", start: 1.5, end: 1.9, line: 0 },
      { text: "Again", match: "again", start: 2.5, end: 2.9, line: 1 },
    ],
  };
}

async function makeEnv(): Promise<ScoreEnv> {
  const store: SqlStore = createDevScoreStore(":memory:");
  await store.run(
    `create table if not exists "user" ("id" text primary key, "handle" text, "displayName" text)`,
  );
  await store.run(
    `insert into "user" ("id", "handle", "displayName") values ('u1', 'player_one', 'Player One')`,
  );
  const track = testTrack();
  return {
    store,
    user: async () => ({ id: "u1", handle: "player_one" }),
    loadTrack: async () => track,
    secret: SECRET,
    now: () => new Date(Date.UTC(2026, 9, 12, 12, 0, 0)),
  };
}

function post(url: string, body: unknown): Request {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function get(url: string): Request {
  return new Request(`http://localhost${url}`);
}

async function issueNonce(env: ScoreEnv): Promise<string> {
  const response = await handleScoreRequest(post("/api/scores/nonce", SETTINGS), env);
  const body = (await response.json()) as { nonce: string };
  return body.nonce;
}

describe("score API", () => {
  test("a valid run is stored and appears on the board", async () => {
    const env = await makeEnv();
    const nonce = await issueNonce(env);
    const events: TimelineEvent[] = [
      { t: "k", at: 1.02, key: "h" },
      { t: "k", at: 1.12, key: "e" },
      { t: "k", at: 1.17, key: "l" },
      { t: "k", at: 1.22, key: "l" },
      { t: "k", at: 1.27, key: "o" },
    ];
    const checksum = await timelineChecksum(nonce, events);

    const response = await handleScoreRequest(
      post("/api/scores", { nonce, checksum, settings: SETTINGS, events }),
      env,
    );
    const body = (await response.json()) as { status: string; score: number; rank: number };
    expect(body.status).toBe("valid");
    expect(body.score).toBeGreaterThan(0);
    expect(body.rank).toBe(1);

    const boardResponse = await handleScoreRequest(
      get(
        "/api/scores/leaderboard?track=youtube-abcdefghijk&style=type&difficulty=normal&runMode=fun&speed=1",
      ),
      env,
    );
    const board = (await boardResponse.json()) as {
      board: Array<{ handle: string; rank: number; you?: boolean }>;
    };
    expect(board.board).toHaveLength(1);
    expect(board.board[0]?.handle).toBe("player_one");
    expect(board.board[0]?.you).toBe(true);
  });

  test("a bad checksum is stored as invalid, not rejected, and kept off the board", async () => {
    const env = await makeEnv();
    const nonce = await issueNonce(env);
    const events: TimelineEvent[] = [{ t: "k", at: 1.02, key: "h" }];

    const response = await handleScoreRequest(
      post("/api/scores", { nonce, checksum: "deadbeef", settings: SETTINGS, events }),
      env,
    );
    const body = (await response.json()) as { status: string; reason: string };
    expect(body.status).toBe("invalid");
    expect(body.reason).toBe("invalid-checksum");

    const stored = await env.store.first<{ count: number }>(
      "select count(*) as count from score where valid = 0 and invalidReason = 'invalid-checksum'",
    );
    expect(stored?.count).toBe(1);

    const boardResponse = await handleScoreRequest(
      get(
        "/api/scores/leaderboard?track=youtube-abcdefghijk&style=type&difficulty=normal&runMode=fun&speed=1",
      ),
      env,
    );
    const board = (await boardResponse.json()) as { board: unknown[] };
    expect(board.board).toHaveLength(0);
  });

  test("a bad nonce is stored as invalid", async () => {
    const env = await makeEnv();
    const events: TimelineEvent[] = [{ t: "k", at: 1.02, key: "h" }];
    const response = await handleScoreRequest(
      post("/api/scores", {
        nonce: "not-a-real-nonce",
        checksum: "whatever",
        settings: SETTINGS,
        events,
      }),
      env,
    );
    const body = (await response.json()) as { status: string; reason: string };
    expect(body.status).toBe("invalid");
    expect(body.reason).toBe("invalid-nonce");
  });

  test("the challenge carries a seeded track, a modifier and boards", async () => {
    const env = await makeEnv();
    const response = await handleScoreRequest(get("/api/scores/challenge"), env);
    const body = (await response.json()) as {
      daily: { trackId: string; boards: { type: unknown[]; sing: unknown[] } };
      weekly: { trackId: string };
    };
    expect(body.daily.trackId.startsWith("youtube-")).toBe(true);
    expect(body.daily.boards.type).toHaveLength(0);
    expect(body.weekly.trackId.startsWith("youtube-")).toBe(true);
  });
});
