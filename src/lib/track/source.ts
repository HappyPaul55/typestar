/**
 * Track sources and their URL shape.
 *
 * TypeStar plays songs from two kinds of source:
 *
 * - **YouTube** — an 11-character video id, at `/play/youtube/<id>`.
 * - **UltraStar** — a URL to a `.txt` chart (resolved and parsed on the server),
 *   at `/play/ultrastar/<url-encoded song URL>`.
 *
 * This module owns the shared vocabulary — the {@link TrackSourceRef} tag, the
 * canonical `/play` path, the API path, and the stable hash used for UltraStar
 * cache keys and ids. It is pure and runtime-agnostic, so the Worker, the dev
 * server, the React island and the unit tests all agree on the same values.
 */

import type { TrackOrigin } from "./types";

/** A YouTube video id. */
export const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Where a track comes from, in a form the API and the router both speak. */
export type TrackSourceRef =
  | { kind: "youtube"; id: string }
  | { kind: "ultrastar"; url: string };

/** The `origin` of a track, defaulting to YouTube for older cached tracks. */
export function trackOrigin(track: {
  origin?: TrackOrigin;
  sourceUrl?: string;
}): TrackOrigin {
  if (track.origin) return track.origin;
  return track.sourceUrl ? "ultrastar" : "youtube";
}

/** Whether a URL string is plain `http(s)`. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Turn a GitHub `blob` page into its raw file URL. Anything else is returned
 * unchanged. `https://github.com/o/r/blob/main/x/song.txt` becomes
 * `https://raw.githubusercontent.com/o/r/main/x/song.txt`.
 */
export function toRawUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }
  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
    return raw;
  }
  const parts = url.pathname.split("/").filter(Boolean);
  const blob = parts.indexOf("blob");
  if (blob < 2 || parts.length < blob + 3) return raw;
  const [owner, repo] = parts;
  const rest = parts.slice(blob + 1).join("/");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${rest}`;
}

/**
 * Normalise a source URL for use as an identity: drop the fragment and let the
 * URL parser canonicalise the host, port and escaping. Throws on an invalid URL.
 */
export function normaliseSourceUrl(raw: string): string {
  const url = new URL(raw.trim());
  url.hash = "";
  return url.toString();
}

/**
 * A stable 64-bit FNV-1a hash, as 16 hex characters. Used to key the UltraStar
 * cache and to build a short, filesystem-safe id from a long URL.
 */
export function hashUrl(input: string): string {
  const OFFSET = 0xcbf29ce484222325n;
  const PRIME = 0x100000001b3n;
  const MASK = 0xffffffffffffffffn;
  let hash = OFFSET;
  for (const byte of new TextEncoder().encode(input)) {
    hash ^= BigInt(byte);
    hash = (hash * PRIME) & MASK;
  }
  return hash.toString(16).padStart(16, "0");
}

/** The stable hash of an UltraStar source URL (normalised first). */
export function ultraStarHash(url: string): string {
  return hashUrl(normaliseSourceUrl(url));
}

/** The track id for an UltraStar source: `ultrastar-<hash>`. */
export function ultraStarId(url: string): string {
  return `ultrastar-${ultraStarHash(url)}`;
}

/** The bundled-seed file id for a source (see `public/tracks/<id>.json`). */
export function seedIdOf(source: TrackSourceRef): string {
  return source.kind === "ultrastar" ? ultraStarId(source.url) : source.id;
}

/** The canonical `/play/...` path for a track. */
export function trackPath(track: {
  id: string;
  origin?: TrackOrigin;
  sourceUrl?: string;
}): string {
  if (trackOrigin(track) === "ultrastar" && track.sourceUrl) {
    return `/play/ultrastar/${encodeURIComponent(track.sourceUrl)}`;
  }
  return `/play/youtube/${track.id}`;
}

/** Decode a URL path segment, returning `null` when it is malformed. */
function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/**
 * Read a source from a `/play/...` pathname: `/play/youtube/<id>`,
 * `/play/ultrastar/<encoded>` or the legacy `/play/<id>`. Returns `null` for the
 * picker, the local route and anything unrecognised.
 */
export function playSourceFromPathname(pathname: string): TrackSourceRef | null {
  const youtube = /^\/play\/youtube\/([^/]+)\/?$/.exec(pathname);
  if (youtube) {
    const id = safeDecode(youtube[1]);
    return id && YOUTUBE_ID_RE.test(id) ? { kind: "youtube", id } : null;
  }

  const ultra = /^\/play\/ultrastar\/(.+?)\/?$/.exec(pathname);
  if (ultra) {
    const url = safeDecode(ultra[1]);
    return url && isHttpUrl(url) ? { kind: "ultrastar", url } : null;
  }

  const legacy = /^\/play\/([^/]+)\/?$/.exec(pathname);
  if (legacy) {
    const id = safeDecode(legacy[1]);
    if (id && YOUTUBE_ID_RE.test(id)) return { kind: "youtube", id };
  }

  return null;
}

/**
 * Read a source from an `/api/track/...` request. Supports the typed paths
 * (`/api/track/youtube/<id>`, `/api/track/ultrastar?url=…`) and the legacy
 * `/api/track/<id>`. Returns `null` when nothing usable is present.
 */
export function apiSourceFromRequest(
  pathname: string,
  params: URLSearchParams,
): TrackSourceRef | null {
  if (!pathname.startsWith("/api/track/")) return null;
  const rest = pathname.slice("/api/track/".length).replace(/\/+$/, "");

  if (rest === "ultrastar") {
    const url = params.get("url")?.trim();
    return url ? { kind: "ultrastar", url } : null;
  }

  if (rest.startsWith("youtube/")) {
    const id = safeDecode(rest.slice("youtube/".length));
    return id ? { kind: "youtube", id } : null;
  }

  if (rest) {
    const id = safeDecode(rest);
    return id ? { kind: "youtube", id } : null;
  }

  return null;
}

/**
 * Turn a pasted link into a source: a YouTube URL/id, or any other `http(s)`
 * URL treated as an UltraStar chart (with GitHub `blob` links rewritten to
 * raw). Returns `null` when the input is neither.
 */
export function parseSourceValue(value: string): TrackSourceRef | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // A bare YouTube id or any YouTube link.
  const youtube = parseYouTubeId(trimmed);
  if (youtube) return { kind: "youtube", id: youtube };

  if (isHttpUrl(trimmed)) {
    const raw = toRawUrl(trimmed);
    return isHttpUrl(raw) ? { kind: "ultrastar", url: raw } : null;
  }

  return null;
}

/**
 * Pull a video id out of a raw id, a `youtu.be` link, a `watch?v=` link, an
 * embed/shorts/live link, or a YouTube URL. Returns `null` otherwise.
 */
export function parseYouTubeId(value: string): string | null {
  const trimmed = value.trim();
  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return YOUTUBE_ID_RE.test(id) ? id : null;
  }
  if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "music.youtube.com") {
    return null;
  }

  const fromQuery = url.searchParams.get("v");
  if (fromQuery && YOUTUBE_ID_RE.test(fromQuery)) return fromQuery;

  const parts = url.pathname.split("/").filter(Boolean);
  const marker = parts.findIndex((part) => ["embed", "shorts", "live"].includes(part));
  if (marker >= 0) {
    const candidate = parts[marker + 1];
    if (candidate && YOUTUBE_ID_RE.test(candidate)) return candidate;
  }

  return null;
}
