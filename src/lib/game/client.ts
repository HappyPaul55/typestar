/**
 * Browser-side helpers for loading a track and reading its source.
 */

import type { Track } from "../track/types";
import {
  parseSourceValue,
  parseYouTubeId,
  playSourceFromPathname,
  type TrackSourceRef,
} from "../track/source";
import { isTrack } from "../track/validate";

export class TrackApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "TrackApiError";
    this.status = status;
    this.code = code;
  }
}

/** A friendly message for an API error code. */
function messageForCode(code: string | undefined): string {
  switch (code) {
    case "no-captions":
      return "This video has no captions, so there is nothing to type.";
    case "bad-video-id":
      return "That video id looks wrong.";
    case "bad-source-url":
    case "blocked-url":
      return "That song URL can’t be used.";
    case "no-lyrics":
      return "That UltraStar chart has no lyrics to play.";
    case "no-audio":
      return "That UltraStar chart does not name an audio file.";
    case "not-found":
      return "That song file could not be found.";
    case "too-large":
      return "That song file is too large.";
    case "turnstile-required":
    case "turnstile-failed":
      return "Please complete the quick human check to load this new song.";
    default:
      return "Could not load this track.";
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
    throw new TrackApiError("Could not reach the track service.", 0, "network");
  }

  if (!response.ok) {
    let code: string | undefined;
    try {
      code = (await response.json() as { error?: string }).error;
    } catch {
      // Non-JSON error body; fall through to the generic message.
    }
    throw new TrackApiError(messageForCode(code), response.status, code);
  }

  const data: unknown = await response.json();
  if (!isTrack(data)) {
    throw new TrackApiError("The track data was unreadable.", 502, "invalid");
  }
  return data;
}

/**
 * Read the source from the current URL: `/play/youtube/<id>`,
 * `/play/ultrastar/<encoded>`, the legacy `/play/<id>` or `?v=<id>`.
 */
export function sourceFromLocation(): TrackSourceRef | null {
  if (typeof window === "undefined") return null;
  const fromPath = playSourceFromPathname(window.location.pathname);
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
  return /^\/play\/local\/?$/.test(window.location.pathname);
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
