/**
 * The score API: issue a run nonce, accept a replayed run, and read boards.
 *
 * Runtime-agnostic, like `tracks-api.ts`: it takes a {@link SqlStore}, a session
 * resolver, a track loader and a signing secret, so the Worker (D1 + Better
 * Auth) and the dev server (node:sqlite) run the exact same handler.
 *
 * An invalid submission is **stored, not rejected**, with a reason
 * (`invalid-checksum`, …). Boards read only `valid = 1` rows, so a bad run never
 * competes but is never lost either.
 */

import {
  isFailMode,
  isGameMode,
  isPlaybackSpeed,
  type FailMode,
  type GameMode,
} from "../game/engine";
import type { RunSettings } from "../game/game";
import { isPlayStyle, trackCanSing, type PlayStyle } from "../game/modes";
import type { Track } from "../track/types";
import { currentChallenges, previousChallenges, type Challenge } from "./challenge";
import { issueNonce, MAX_OFFSET, verifyNonce } from "./nonce";
import { replayRun } from "./replay";
import type { SqlStore } from "./store";
import { timelineChecksum, TIMELINE_VERSION, parseTimeline } from "./timeline";
import type {
  InvalidReason,
  LeaderboardEntry,
  RunSettingsPayload,
  ScoreRecord,
} from "./types";

export interface ScoreUser {
  id: string;
  handle: string | null;
}

export interface ScoreEnv {
  store: SqlStore;
  /** Resolve the signed-in user, or `null`. */
  user(request: Request): Promise<ScoreUser | null>;
  /** Load a processed track by its namespaced id, or `null`. */
  loadTrack(id: string): Promise<Track | null>;
  /** The HMAC secret for run nonces (the Better Auth secret). */
  secret: string;
  /** Overridable clock, for tests. */
  now?(): Date;
}

/** The largest submission body accepted, in bytes. */
const MAX_BODY_BYTES = 1_000_000;

interface BoardQuery {
  trackId: string;
  style: PlayStyle;
  /** Omitted by the challenge board, which accepts any settings. */
  difficulty?: GameMode;
  runMode?: FailMode;
  speed?: number;
  since?: string;
  until?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return null;
  try {
    const value: unknown = await request.json();
    return typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function parseSettings(value: unknown): RunSettingsPayload | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.trackId !== "string" || raw.trackId.length === 0 || raw.trackId.length > 200) {
    return null;
  }
  if (!isPlayStyle(raw.style) || !isGameMode(raw.difficulty) || !isFailMode(raw.runMode)) {
    return null;
  }
  if (!isPlaybackSpeed(raw.speed)) return null;
  const offset =
    typeof raw.offset === "number" && Number.isFinite(raw.offset)
      ? Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, raw.offset))
      : 0;
  return {
    trackId: raw.trackId,
    style: raw.style,
    difficulty: raw.difficulty,
    runMode: raw.runMode,
    speed: raw.speed,
    offset,
  };
}

function parseModeQuery(
  params: URLSearchParams,
): Pick<BoardQuery, "style" | "difficulty" | "runMode" | "speed"> | null {
  const style = params.get("style");
  const difficulty = params.get("difficulty");
  const runMode = params.get("runMode");
  const rawSpeed = params.get("speed");
  const speed = rawSpeed === null || rawSpeed === "" ? 1 : Number(rawSpeed);
  if (!isPlayStyle(style) || !isGameMode(difficulty) || !isFailMode(runMode)) return null;
  if (!isPlaybackSpeed(speed)) return null;
  return { style, difficulty, runMode, speed };
}

function parseBoardQuery(params: URLSearchParams): BoardQuery | null {
  const mode = parseModeQuery(params);
  const trackId = (params.get("track") ?? "").trim();
  if (!mode || !trackId || trackId.length > 200) return null;
  return { ...mode, trackId };
}

/** The shared WHERE clause for a board, plus its bound parameters. */
function boardFilter(query: BoardQuery): { where: string; params: unknown[] } {
  const clauses = ["trackId = ?", "style = ?", "valid = 1"];
  const params: unknown[] = [query.trackId, query.style];
  if (query.difficulty !== undefined) {
    clauses.push("difficulty = ?");
    params.push(query.difficulty);
  }
  if (query.runMode !== undefined) {
    clauses.push("runMode = ?");
    params.push(query.runMode);
  }
  if (query.speed !== undefined) {
    clauses.push("speed = ?");
    params.push(query.speed);
  }
  if (query.since) {
    clauses.push("createdAt >= ?");
    params.push(query.since);
  }
  if (query.until) {
    clauses.push("createdAt < ?");
    params.push(query.until);
  }
  return { where: clauses.join(" AND "), params };
}

interface LeaderboardRow {
  userId: string;
  score: number;
  accuracy: number;
  maxCombo: number;
  progress: number;
  createdAt: string;
  handle: string | null;
  displayName: string | null;
}

/** The top players on a board, each player's best only. */
async function fetchLeaderboard(
  store: SqlStore,
  query: BoardQuery,
  limit: number,
  currentUserId?: string,
): Promise<LeaderboardEntry[]> {
  const { where, params } = boardFilter(query);
  const rows = await store.all<LeaderboardRow>(
    `SELECT s.userId AS userId, s.score AS score, s.accuracy AS accuracy,
            s.maxCombo AS maxCombo, s.progress AS progress, s.createdAt AS createdAt,
            u.handle AS handle, u.displayName AS displayName
       FROM (
         SELECT *, ROW_NUMBER() OVER (PARTITION BY userId ORDER BY score DESC, createdAt ASC) AS rn
           FROM score WHERE ${where}
       ) s
       JOIN user u ON u.id = s.userId
      WHERE s.rn = 1
      ORDER BY s.score DESC, s.createdAt ASC
      LIMIT ?`,
    [...params, limit],
  );
  return rows.map((row, index) => ({
    rank: index + 1,
    handle: row.handle,
    displayName: row.displayName,
    score: row.score,
    accuracy: row.accuracy,
    maxCombo: row.maxCombo,
    progress: row.progress,
    createdAt: row.createdAt,
    ...(currentUserId && row.userId === currentUserId ? { you: true } : {}),
  }));
}

/** A player's rank on a board (1-based), from their best score. */
async function fetchRank(
  store: SqlStore,
  query: BoardQuery,
  score: number,
): Promise<number> {
  const { where, params } = boardFilter(query);
  const row = await store.first<{ better: number }>(
    `SELECT COUNT(*) AS better FROM (
       SELECT userId, MAX(score) AS best FROM score WHERE ${where} GROUP BY userId
     ) WHERE best > ?`,
    [...params, score],
  );
  return (row?.better ?? 0) + 1;
}

async function insertScore(store: SqlStore, record: ScoreRecord): Promise<void> {
  await store.run(
    `INSERT INTO score (
       id, userId, trackId, trackType, title, artist, style, difficulty, runMode,
       speed, score, accuracy, maxCombo, hits, misses, progress, valid, invalidReason,
       createdAt
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      record.id,
      record.userId,
      record.trackId,
      record.trackType,
      record.title,
      record.artist,
      record.style,
      record.difficulty,
      record.runMode,
      record.speed,
      record.score,
      record.accuracy,
      record.maxCombo,
      record.hits,
      record.misses,
      record.progress,
      record.valid ? 1 : 0,
      record.invalidReason,
      record.createdAt,
    ],
  );
}

async function nonceHandler(
  request: Request,
  env: ScoreEnv,
  now: Date,
): Promise<Response> {
  const user = await env.user(request);
  if (!user) return json({ error: "unauthorized" }, 401);
  const body = await readJson(request);
  const settings = parseSettings(body);
  if (!settings) return json({ error: "bad-settings" }, 400);

  const nonce = await issueNonce(
    env.secret,
    {
      u: user.id,
      t: settings.trackId,
      s: settings.style,
      d: settings.difficulty,
      rm: settings.runMode,
      sp: settings.speed,
      o: settings.offset,
    },
    Math.floor(now.getTime() / 1000),
  );
  return json({ nonce });
}

async function submitHandler(
  request: Request,
  env: ScoreEnv,
  now: Date,
): Promise<Response> {
  const user = await env.user(request);
  if (!user) return json({ error: "unauthorized" }, 401);

  const body = await readJson(request);
  if (!body) return json({ error: "bad-request" }, 400);

  const claimed = parseSettings(body.settings);
  if (!claimed) return json({ error: "bad-settings" }, 400);

  const nonce = typeof body.nonce === "string" ? body.nonce : "";
  const payload = nonce
    ? await verifyNonce(env.secret, nonce, Math.floor(now.getTime() / 1000))
    : null;
  const timeline = parseTimeline({ version: TIMELINE_VERSION, events: body.events });

  // The nonce's settings are trusted; the client's are only a fallback so an
  // invalid run can still be recorded (and explained) rather than dropped.
  const settings: RunSettingsPayload = payload
    ? {
        trackId: payload.t,
        style: payload.s,
        difficulty: payload.d,
        runMode: payload.rm,
        speed: payload.sp,
        offset: payload.o,
      }
    : claimed;

  let reason: InvalidReason | null = null;
  if (!payload || payload.u !== user.id) reason = "invalid-nonce";
  else if (!timeline) reason = "invalid-timeline";
  else {
    const expected = await timelineChecksum(nonce, timeline.events);
    if (typeof body.checksum !== "string" || body.checksum !== expected) {
      reason = "invalid-checksum";
    }
  }

  // Load and replay whenever the timeline is usable, even for an invalid run, so
  // the stored row carries a real score to go with its reason.
  let track: Track | null = null;
  let score = 0;
  let accuracy = 0;
  let maxCombo = 0;
  let hits = 0;
  let misses = 0;
  let progress = 0;

  if (timeline) {
    track = await env.loadTrack(settings.trackId).catch(() => null);
    if (!track) {
      if (reason === null) reason = "invalid-track";
    } else if (settings.style === "sing" && !trackCanSing(track)) {
      if (reason === null) reason = "invalid-unscorable";
    } else {
      const run: RunSettings = {
        difficulty: settings.difficulty,
        runMode: settings.runMode,
        speed: settings.speed,
        style: settings.style,
        offset: settings.offset,
      };
      const replayed = replayRun(settings.style, track, run, timeline.events);
      score = replayed.score;
      accuracy = replayed.accuracy;
      maxCombo = replayed.maxCombo;
      hits = replayed.hits;
      misses = replayed.misses;
      progress = replayed.progress;
    }
  }

  const valid = reason === null;
  const record: ScoreRecord = {
    id: crypto.randomUUID(),
    userId: user.id,
    trackId: settings.trackId,
    trackType: track?.type ?? (settings.trackId.startsWith("ultrastar-") ? "ultrastar" : "youtube"),
    title: track?.title ?? settings.trackId,
    artist: track?.artist ?? null,
    style: settings.style,
    difficulty: settings.difficulty,
    runMode: settings.runMode,
    speed: settings.speed,
    score,
    accuracy,
    maxCombo,
    hits,
    misses,
    progress,
    valid,
    invalidReason: reason,
    createdAt: now.toISOString(),
  };
  await insertScore(env.store, record);

  const query: BoardQuery = {
    trackId: settings.trackId,
    style: settings.style,
    difficulty: settings.difficulty,
    runMode: settings.runMode,
    speed: settings.speed,
  };
  const board = valid ? await fetchLeaderboard(env.store, query, 5, user.id) : [];
  const rank = valid ? await fetchRank(env.store, query, score) : null;

  return json({
    status: valid ? "valid" : "invalid",
    reason,
    score,
    accuracy,
    maxCombo,
    progress,
    rank,
    board,
  });
}

async function leaderboardHandler(url: URL, env: ScoreEnv): Promise<Response> {
  const query = parseBoardQuery(url.searchParams);
  if (!query) return json({ error: "bad-query" }, 400);
  const user = await env.user(new Request(url.toString()));
  const board = await fetchLeaderboard(env.store, query, 25, user?.id);
  const rank = user ? await fetchRank(env.store, query, board.find((e) => e.you)?.score ?? 0) : null;
  return json({ board, rank: board.some((e) => e.you) ? rank : null });
}

interface RecentRow {
  trackId: string;
  trackType: string;
  title: string;
  artist: string | null;
  style: PlayStyle;
  difficulty: GameMode;
  runMode: FailMode;
  speed: number;
  score: number;
  accuracy: number;
  maxCombo: number;
  progress: number;
  createdAt: string;
  handle: string | null;
  displayName: string | null;
}

async function recentHandler(url: URL, env: ScoreEnv): Promise<Response> {
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50) || 50));
  const recent = await env.store.all<RecentRow>(
    `SELECT s.trackId, s.trackType, s.title, s.artist, s.style, s.difficulty, s.runMode,
            s.speed, s.score, s.accuracy, s.maxCombo, s.progress, s.createdAt,
            u.handle, u.displayName
       FROM score s JOIN user u ON u.id = s.userId
      WHERE s.valid = 1
      ORDER BY s.createdAt DESC
      LIMIT ?`,
    [limit],
  );
  return json({ recent });
}

async function profileHandler(url: URL, env: ScoreEnv): Promise<Response> {
  const handle = (url.searchParams.get("handle") ?? "").trim().toLowerCase();
  if (!handle || handle.length > 40) return json({ error: "bad-handle" }, 400);

  const account = await env.store.first<{
    id: string;
    handle: string | null;
    displayName: string | null;
    createdAt: string;
  }>("SELECT id, handle, displayName, createdAt FROM user WHERE handle = ?", [handle]);
  if (!account) return json({ error: "not-found" }, 404);

  const stats = await env.store.first<{
    plays: number;
    validPlays: number;
    tracks: number;
    bestScore: number | null;
  }>(
    `SELECT COUNT(*) AS plays,
            COALESCE(SUM(valid), 0) AS validPlays,
            COUNT(DISTINCT trackId) AS tracks,
            MAX(CASE WHEN valid = 1 THEN score END) AS bestScore
       FROM score WHERE userId = ?`,
    [account.id],
  );

  const bests = await env.store.all<RecentRow>(
    `SELECT trackId, trackType, title, artist, style, difficulty, runMode, speed,
            score, accuracy, maxCombo, progress, createdAt, NULL AS handle, NULL AS displayName
       FROM (
         SELECT *, ROW_NUMBER() OVER (
           PARTITION BY trackId, style, difficulty, runMode, speed ORDER BY score DESC, createdAt ASC
         ) AS rn
         FROM score WHERE userId = ? AND valid = 1
       ) WHERE rn = 1
      ORDER BY score DESC
      LIMIT 10`,
    [account.id],
  );

  const recent = await env.store.all<RecentRow & { valid: number; invalidReason: string | null }>(
    `SELECT trackId, trackType, title, artist, style, difficulty, runMode, speed,
            score, accuracy, maxCombo, progress, createdAt, valid, invalidReason,
            NULL AS handle, NULL AS displayName
       FROM score WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT 20`,
    [account.id],
  );

  return json({
    profile: {
      handle: account.handle,
      displayName: account.displayName,
      createdAt: account.createdAt,
    },
    stats: {
      plays: stats?.plays ?? 0,
      validPlays: stats?.validPlays ?? 0,
      tracks: stats?.tracks ?? 0,
      bestScore: stats?.bestScore ?? 0,
    },
    bests,
    recent,
  });
}

async function challengeBoards(env: ScoreEnv, challenge: Challenge) {
  // No modifier: the board takes any difficulty, run mode or speed, so it is
  // simply every valid run of the song inside the period.
  const base = {
    trackId: challenge.trackId,
    since: challenge.startsAt,
    until: challenge.endsAt,
  };
  const [type, sing] = await Promise.all([
    fetchLeaderboard(env.store, { ...base, style: "type" }, 10),
    fetchLeaderboard(env.store, { ...base, style: "sing" }, 10),
  ]);
  return { type, sing };
}

async function challengeHandler(env: ScoreEnv, now: Date): Promise<Response> {
  const current = currentChallenges(now);
  const previous = previousChallenges(now);
  const [daily, weekly, pastDaily, pastWeekly] = await Promise.all([
    challengeBoards(env, current.daily),
    challengeBoards(env, current.weekly),
    challengeBoards(env, previous.daily),
    challengeBoards(env, previous.weekly),
  ]);
  return json({
    daily: { ...current.daily, boards: daily },
    weekly: { ...current.weekly, boards: weekly },
    previous: {
      daily: { ...previous.daily, boards: pastDaily },
      weekly: { ...previous.weekly, boards: pastWeekly },
    },
  });
}

/** Dispatch a `/api/scores/*` request. */
export async function handleScoreRequest(
  request: Request,
  env: ScoreEnv,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/scores/, "").replace(/\/+$/, "");
  const now = env.now?.() ?? new Date();

  if (path === "/nonce" && request.method === "POST") return nonceHandler(request, env, now);
  if (path === "" && request.method === "POST") return submitHandler(request, env, now);
  if (path === "/leaderboard" && request.method === "GET") return leaderboardHandler(url, env);
  if (path === "/recent" && request.method === "GET") return recentHandler(url, env);
  if (path === "/profile" && request.method === "GET") return profileHandler(url, env);
  if (path === "/challenge" && request.method === "GET") return challengeHandler(env, now);
  return json({ error: "not-found" }, 404);
}
