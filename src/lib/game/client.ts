/**
 * Browser-side helpers for loading a track and reading a video id.
 */

import type { Track } from "../track/types";
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

/** Load a processed track, throwing a friendly {@link TrackApiError} on failure. */
export async function loadTrack(
  id: string,
  lang = "en",
  signal?: AbortSignal,
): Promise<Track> {
  let response: Response;
  try {
    response = await fetch(`/api/track/${encodeURIComponent(id)}?lang=${lang}`, {
      signal,
      headers: { accept: "application/json" },
    });
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
    const message =
      code === "no-captions"
        ? "This video has no captions, so there is nothing to type."
        : code === "bad-video-id"
          ? "That video id looks wrong."
          : "Could not load this track.";
    throw new TrackApiError(message, response.status, code);
  }

  const data: unknown = await response.json();
  if (!isTrack(data)) {
    throw new TrackApiError("The track data was unreadable.", 502, "invalid");
  }
  return data;
}

/**
 * Pull a video id out of a raw id, a `youtu.be` link, a `watch?v=` link, an
 * embed/shorts/live link, or the `?v=` query of the current page.
 */
export function parseVideoId(value: string): string | null {
  const trimmed = value.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.hostname === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  }

  const fromQuery = url.searchParams.get("v");
  if (fromQuery && /^[A-Za-z0-9_-]{11}$/.test(fromQuery)) return fromQuery;

  const parts = url.pathname.split("/").filter(Boolean);
  const marker = parts.findIndex((part) => ["embed", "shorts", "live"].includes(part));
  if (marker >= 0) {
    const candidate = parts[marker + 1];
    if (candidate && /^[A-Za-z0-9_-]{11}$/.test(candidate)) return candidate;
  }

  return null;
}

/** Read the video id from the current URL (`/play/<id>` or `?v=`). */
export function videoIdFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const fromPath = /^\/play\/([A-Za-z0-9_-]{11})\/?$/.exec(window.location.pathname);
  if (fromPath) return fromPath[1];
  const params = new URLSearchParams(window.location.search);
  return parseVideoId(params.get("v") ?? params.get("id") ?? "");
}
