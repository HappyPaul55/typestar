/**
 * Pure validation and normalisation for account input: the email a magic link
 * is sent to, and the public handle a player chooses.
 *
 * Kept dependency-free so the rules are unit-tested directly, and so the same
 * checks run on the client (for instant feedback) and on the server (as the
 * source of truth, via a Better Auth `update-user` hook).
 */

/**
 * A handle is 3–20 characters of lowercase letters, digits and underscores, and
 * must start and end with a letter or digit. It is the public name on a
 * leaderboard, so it stays simple and URL-safe.
 */
const HANDLE_RE = /^[a-z0-9](?:[a-z0-9_]{1,18}[a-z0-9])$/;

/** Handles that would be confusing or imply authority. Compared lowercased. */
export const RESERVED_HANDLES: ReadonlySet<string> = new Set([
  "admin",
  "administrator",
  "anonymous",
  "api",
  "help",
  "mod",
  "moderator",
  "owner",
  "root",
  "staff",
  "support",
  "system",
  "typestar",
  "you",
]);

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 20;

/** Lowercase and trim a handle, returning `null` when it is not valid. */
export function normalizeHandle(raw: string): string | null {
  const handle = raw.trim().toLowerCase();
  if (!HANDLE_RE.test(handle)) return null;
  if (RESERVED_HANDLES.has(handle)) return null;
  return handle;
}

/** Why a handle was rejected, so the UI can localise the message. */
export type HandleError = "empty" | "length" | "charset" | "reserved";

/** The reason a handle is unusable, or `null` when it is fine. */
export function handleErrorCode(raw: string): HandleError | null {
  const handle = raw.trim().toLowerCase();
  if (!handle) return "empty";
  if (handle.length < HANDLE_MIN || handle.length > HANDLE_MAX) return "length";
  if (!HANDLE_RE.test(handle)) return "charset";
  if (RESERVED_HANDLES.has(handle)) return "reserved";
  return null;
}

/** A permissive but sane email check; the magic link is the real verification. */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

/** Lowercase and trim an email, returning `null` when it is obviously wrong. */
export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (email.length === 0 || email.length > 254) return null;
  if (!EMAIL_RE.test(email)) return null;
  return email;
}
