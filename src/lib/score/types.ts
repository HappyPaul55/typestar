/**
 * Shared shapes for recorded scores and leaderboards.
 *
 * A score is the *result* of a run, never the run itself: the event timeline is
 * submitted, replayed on the server, and discarded. What is stored is the
 * outcome plus enough context to build a board.
 */

import type { FailMode, GameMode, PlaybackSpeed } from "../game/engine";
import type { PlayStyle } from "../game/modes";

/** Why a stored score is not counted on a board. */
export type InvalidReason =
  | "invalid-nonce"
  | "invalid-checksum"
  | "invalid-timeline"
  | "invalid-track"
  | "invalid-unscorable";

/** The settings a run was played under, as submitted with the timeline. */
export interface RunSettingsPayload {
  trackId: string;
  style: PlayStyle;
  difficulty: GameMode;
  runMode: FailMode;
  speed: PlaybackSpeed;
  /** The player's per-track sync nudge, in seconds (capped server-side). */
  offset: number;
}

/** One stored score. Mirrors a row of the `score` table. */
export interface ScoreRecord {
  id: string;
  userId: string;
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
  hits: number;
  misses: number;
  progress: number;
  valid: boolean;
  invalidReason: InvalidReason | null;
  /** The scoring algorithm version this score was computed with. */
  scoreVersion: number;
  createdAt: string;
}

/** One row of a leaderboard, already deduped to a player's best. */
export interface LeaderboardEntry {
  rank: number;
  handle: string | null;
  displayName: string | null;
  score: number;
  accuracy: number;
  maxCombo: number;
  progress: number;
  createdAt: string;
  /** True for the requesting player's own row. */
  you?: boolean;
}
