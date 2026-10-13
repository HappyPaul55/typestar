/**
 * The server-issued run nonce.
 *
 * Before a scored run begins, the client asks the server for a nonce. It is a
 * compact HMAC-signed token (stateless — nothing is stored) that binds the run
 * to a user and a set of settings and expires after a few hours. The client
 * submits it back with the timeline, and the server uses *its* settings for the
 * replay, so a run cannot claim a different track, difficulty or run mode than
 * the one it was issued for.
 *
 * It is deliberately not single-use: without storing anything, a replayed nonce
 * only ever reproduces the same run, and a board keeps each player's best.
 */

import {
  isFailMode,
  isGameMode,
  isPlaybackSpeed,
  type FailMode,
  type GameMode,
  type PlaybackSpeed,
} from "../game/engine";
import { isPlayStyle, type PlayStyle } from "../game/modes";

/** How long a nonce is valid, in seconds. */
export const NONCE_TTL_SECONDS = 6 * 60 * 60;

/** The largest sync offset a run may claim, in seconds. */
export const MAX_OFFSET = 2;

export interface NoncePayload {
  /** User id the nonce was issued to. */
  u: string;
  /** Namespaced track id. */
  t: string;
  s: PlayStyle;
  d: GameMode;
  rm: FailMode;
  sp: PlaybackSpeed;
  /** The player's sync offset, in seconds. */
  o: number;
  /** A random nonce. */
  n: string;
  /** Expiry, as a Unix timestamp in seconds. */
  exp: number;
}

function toB64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Issue a signed nonce for a run. */
export async function issueNonce(
  secret: string,
  settings: Omit<NoncePayload, "n" | "exp">,
  nowSeconds: number,
): Promise<string> {
  const payload: NoncePayload = {
    ...settings,
    o: Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, settings.o)),
    n: toB64url(crypto.getRandomValues(new Uint8Array(16))),
    exp: nowSeconds + NONCE_TTL_SECONDS,
  };
  const body = toB64url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)),
  );
  return `${body}.${toB64url(signature)}`;
}

/** Verify a signed nonce, returning its payload or `null` when it is not valid. */
export async function verifyNonce(
  secret: string,
  token: string,
  nowSeconds: number,
): Promise<NoncePayload | null> {
  if (typeof token !== "string" || token.length > 2048) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const key = await hmacKey(secret);
  let valid: boolean;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromB64url(signature) as BufferSource,
      new TextEncoder().encode(body),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromB64url(body)));
  } catch {
    return null;
  }
  if (typeof payload !== "object" || payload === null) return null;
  const value = payload as Record<string, unknown>;
  if (typeof value.u !== "string" || typeof value.t !== "string") return null;
  if (!isPlayStyle(value.s) || !isGameMode(value.d) || !isFailMode(value.rm)) return null;
  if (!isPlaybackSpeed(value.sp)) return null;
  if (typeof value.o !== "number" || !Number.isFinite(value.o) || Math.abs(value.o) > MAX_OFFSET) {
    return null;
  }
  if (typeof value.n !== "string" || typeof value.exp !== "number") return null;
  if (value.exp < nowSeconds) return null;
  return value as unknown as NoncePayload;
}
