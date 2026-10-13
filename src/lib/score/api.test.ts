import { describe, expect, test } from "bun:test";
import { FEATURED_TRACKS } from "../../content/tracks/featured";
import type { Track } from "../track/types";
import { handleScoreRequest, type ScoreEnv } from "./api";
import { featuredTrackId } from "./challenge";
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

interface ChallengeBody {
  id: string;
  trackId: string;
  boards: { type: Array<{ score: number }>; sing: Array<{ score: number }> };
}

interface ChallengesBody {
  daily: ChallengeBody;
  weekly: ChallengeBody;
  previous: { daily: ChallengeBody; weekly: ChallengeBody };
}

async function challenges(env: ScoreEnv): Promise<ChallengesBody> {
  const response = await handleScoreRequest(get("/api/scores/challenge"), env);
  return (await response.json()) as ChallengesBody;
}

/** Insert a stored score directly, bypassing a replay. */
async function insertScore(
  env: ScoreEnv,
  row: {
    id: string;
    trackId: string;
    score: number;
    userId?: string;
    difficulty?: string;
    createdAt?: string;
  },
): Promise<void> {
  await env.store.run(
    `insert into "score" ("id", "userId", "trackId", "trackType", "title", "artist",
       "style", "difficulty", "runMode", "speed", "score", "accuracy", "maxCombo",
       "hits", "misses", "progress", "valid", "invalidReason", "createdAt")
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id, row.userId ?? "u1", row.trackId, "youtube", "Test song", null,
      "type", row.difficulty ?? "normal", "fun", 1, row.score, 0.9, 10, 10, 0, 1, 1, null,
      row.createdAt ?? "2026-10-12T06:00:00.000Z",
    ],
  );
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

  test("the challenge records a song for every period it serves", async () => {
    const env = await makeEnv();
    const body = await challenges(env);
    const ids = [
      body.daily.trackId,
      body.weekly.trackId,
      body.previous.daily.trackId,
      body.previous.weekly.trackId,
    ];
    for (const id of ids) expect(id.startsWith("youtube-")).toBe(true);
    // One request serves four periods, and it never repeats a song while an
    // unused featured track is left.
    expect(new Set(ids).size).toBe(Math.min(ids.length, FEATURED_TRACKS.length));
    expect(body.daily.boards.type).toHaveLength(0);
  });

  test("the recorded song is stable across requests", async () => {
    const env = await makeEnv();
    const first = await challenges(env);
    const second = await challenges(env);
    expect(second.daily.trackId).toBe(first.daily.trackId);
    expect(second.weekly.trackId).toBe(first.weekly.trackId);
    expect(second.previous.daily.trackId).toBe(first.previous.daily.trackId);
  });

  test("the most played featured track is picked first", async () => {
    const env = await makeEnv();
    const popular = FEATURED_TRACKS[FEATURED_TRACKS.length - 1];
    await insertScore(env, { id: "s-pop", trackId: featuredTrackId(popular), score: 10 });

    const body = await challenges(env);
    expect(body.daily.trackId).toBe(featuredTrackId(popular));
  });

  test("the challenge board counts a run at any settings", async () => {
    const env = await makeEnv();
    const { daily } = await challenges(env);
    await env.store.run(
      `insert into "user" ("id", "handle", "displayName") values ('u2', 'player_two', 'Player Two')`,
    );

    // Two players on the challenge song at different difficulties, plus an
    // earlier run of the same song that falls outside the period.
    await insertScore(env, { id: "s-easy", trackId: daily.trackId, difficulty: "easy", score: 100 });
    await insertScore(env, {
      id: "s-hard",
      trackId: daily.trackId,
      userId: "u2",
      difficulty: "hard",
      score: 500,
    });
    await insertScore(env, {
      id: "s-old",
      trackId: daily.trackId,
      difficulty: "hard",
      score: 900,
      createdAt: "2026-10-11T06:00:00.000Z",
    });

    const body = await challenges(env);
    expect(body.daily.boards.type.map((entry) => entry.score)).toEqual([500, 100]);
  });

  test("the previous period keeps its own board", async () => {
    const env = await makeEnv();
    const first = await challenges(env);
    await insertScore(env, {
      id: "s-past",
      trackId: first.previous.daily.trackId,
      score: 700,
      createdAt: "2026-10-11T06:00:00.000Z",
    });

    const body = await challenges(env);
    expect(body.previous.daily.trackId).toBe(first.previous.daily.trackId);
    expect(body.previous.daily.boards.type.map((entry) => entry.score)).toEqual([700]);
    // The current period does not reach back into the one before it.
    expect(body.daily.boards.type).toHaveLength(0);
  });
});
