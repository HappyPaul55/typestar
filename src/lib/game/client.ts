/**
 * Browser-side helpers for loading a track and reading its source.
 */

import type { Track } from "../track/types";
import {
  embedSourceFromPathname,
  parseSourceValue,
  parseYouTubeId,
  playSourceFromPathname,
  type TrackSourceRef,
} from "../track/source";
import type { MessageKey } from "../../i18n";
import { stripLocale } from "../../i18n/paths";
import { isTrack } from "../track/validate";

export class TrackApiError extends Error {
  readonly status: number;
  readonly code?: string;
  /** The user-facing message, as a dictionary key. */
  readonly messageKey: MessageKey;

  constructor(messageKey: MessageKey, status: number, code?: string) {
    super(messageKey);
    this.name = "TrackApiError";
    this.status = status;
    this.code = code;
    this.messageKey = messageKey;
  }
}

/** The dictionary key for an API error code. */
function keyForCode(code: string | undefined): MessageKey {
  switch (code) {
    case "no-captions":
      return "trackError.noCaptions";
    case "bad-video-id":
      return "trackError.badVideoId";
    case "bad-source-url":
    case "blocked-url":
      return "trackError.badUrl";
    case "no-lyrics":
      return "trackError.noLyrics";
    case "no-audio":
      return "trackError.noAudio";
    case "not-found":
      return "trackError.notFound";
    case "too-large":
      return "trackError.tooLarge";
    case "turnstile-required":
    case "turnstile-failed":
      return "trackError.humanCheck";
    default:
      return "trackError.generic";
  }
}

/** Load a processed track, throwing a friendly {@link TrackApiError} on failure. */
export async function loadTrack(
  source: TrackSourceRef,
  lang = "en",
  signal?: AbortSignal,
  turnstileToken?: string,
): Promise<Track> {
  const headers: Record<string, string> = { accept: "application/json" };
  // Must match TURNSTILE_TOKEN_HEADER in src/lib/tracks-api.ts.
  if (turnstileToken) headers["x-turnstile-token"] = turnstileToken;

  const endpoint =
    source.kind === "ultrastar"
      ? `/api/track/ultrastar?url=${encodeURIComponent(source.url)}&lang=${lang}`
      : `/api/track/youtube/${encodeURIComponent(source.id)}?lang=${lang}`;

  let response: Response;
  try {
    response = await fetch(endpoint, { signal, headers });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new TrackApiError("trackError.network", 0, "network");
  }

  if (!response.ok) {
    let code: string | undefined;
    try {
      code = (await response.json() as { error?: string }).error;
    } catch {
      // Non-JSON error body; fall through to the generic message.
    }
    throw new TrackApiError(keyForCode(code), response.status, code);
  }

  const data: unknown = await response.json();
  if (!isTrack(data)) {
    throw new TrackApiError("trackError.unreadable", 502, "invalid");
  }
  return data;
}

/**
 * Read the source from the current URL: `/play/youtube/<id>`,
 * `/play/ultrastar/<encoded>`, the legacy `/play/<id>` or `?v=<id>`.
 */
export function sourceFromLocation(): TrackSourceRef | null {
  if (typeof window === "undefined") return null;
  // The app routes are locale-prefixed (`/de/play/youtube/<id>`), so peel the
  // locale off before reading the route.
  const path = stripLocale(window.location.pathname);
  const fromPath = playSourceFromPathname(path) ?? embedSourceFromPathname(path);
  if (fromPath) return fromPath;

  const params = new URLSearchParams(window.location.search);
  const id = parseYouTubeId(params.get("v") ?? params.get("id") ?? "");
  return id ? { kind: "youtube", id } : null;
}

/**
 * Turn a pasted value into a source, for the picker: a YouTube link/id, or any
 * other `http(s)` URL treated as an UltraStar chart.
 */
export function sourceFromInput(value: string): TrackSourceRef | null {
  return parseSourceValue(value);
}

/** Whether the current URL is the local-file route (`/play/local`). */
export function isLocalRoute(): boolean {
  if (typeof window === "undefined") return false;
  return /^\/play\/local\/?$/.test(stripLocale(window.location.pathname));
}

/**
 * The local song requested in the URL (`/play/local?file=<relative path>`), or
 * `null` for the plain picker. Used to bookmark and share a local song.
 */
export function localFileFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("file");
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
