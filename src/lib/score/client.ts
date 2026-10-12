/**
 * Browser helpers for the score API.
 *
 * Thin `fetch` wrappers that return `null`/empty on any failure, so a board that
 * cannot load never breaks the game.
 */

import type { FailMode, GameMode, PlaybackSpeed } from "../game/engine";
import type { PlayStyle } from "../game/modes";
import type { InvalidReason, LeaderboardEntry } from "./types";
import type { TimelineEvent } from "./timeline";

export interface RunSettingsInput {
  trackId: string;
  style: PlayStyle;
  difficulty: GameMode;
  runMode: FailMode;
  speed: PlaybackSpeed;
  offset: number;
}

export interface SubmitResult {
  status: "valid" | "invalid";
  reason: InvalidReason | null;
  score: number;
  accuracy: number;
  maxCombo: number;
  progress: number;
  rank: number | null;
  board: LeaderboardEntry[];
}

export interface RecentEntry {
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

export interface ProfileResponse {
  profile: { handle: string | null; displayName: string | null; createdAt: string };
  stats: { plays: number; validPlays: number; tracks: number; bestScore: number };
  bests: RecentEntry[];
  recent: Array<RecentEntry & { valid: number; invalidReason: string | null }>;
}

export interface ChallengeBoard {
  id: string;
  key: string;
  period: "daily" | "weekly";
  track: { id: string; title: string; artist: string };
  trackId: string;
  startsAt: string;
  endsAt: string;
  boards: { type: LeaderboardEntry[]; sing: LeaderboardEntry[] };
}

export interface ChallengesResponse {
  daily: ChallengeBoard;
  weekly: ChallengeBoard;
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/** Ask for a run nonce. `null` when the player is not signed in or it fails. */
export async function fetchRunNonce(settings: RunSettingsInput): Promise<string | null> {
  const data = await postJson<{ nonce?: string }>("/api/scores/nonce", settings);
  return typeof data?.nonce === "string" ? data.nonce : null;
}

/** Submit a replayed run. */
export async function submitRun(input: {
  nonce: string;
  checksum: string;
  settings: RunSettingsInput;
  events: TimelineEvent[];
}): Promise<SubmitResult | null> {
  return postJson<SubmitResult>("/api/scores", input);
}

export async function fetchRecent(limit = 50): Promise<RecentEntry[]> {
  const data = await getJson<{ recent?: RecentEntry[] }>(`/api/scores/recent?limit=${limit}`);
  return data?.recent ?? [];
}

export async function fetchProfile(handle: string): Promise<ProfileResponse | null> {
  return getJson<ProfileResponse>(
    `/api/scores/profile?handle=${encodeURIComponent(handle)}`,
  );
}

export async function fetchChallenges(): Promise<ChallengesResponse | null> {
  return getJson<ChallengesResponse>("/api/scores/challenge");
}
