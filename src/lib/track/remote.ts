/**
 * Fetching an UltraStar chart from the web.
 *
 * A chart is a plain `.txt` file, but the URL is user-supplied, so this is the
 * one place we fetch an arbitrary address. It is deliberately cautious:
 *
 * - only `http(s)`, with no embedded credentials and no obvious private host;
 * - a bounded number of redirects, each re-checked;
 * - a hard cap on how much is read, and a timeout.
 *
 * The chart's referenced media (audio, video, cover, background) is **not**
 * fetched here. It is resolved to absolute URLs and handed to the browser, which
 * hotlinks it straight from the origin.
 *
 * Pure apart from `fetch`, so the Worker, the dev server and the tests share it.
 */

import { parseUltraStar, type UltraStarSong } from "./ultrastar";
import type { TrackMedia } from "./types";

/** An upstream problem with a clear HTTP status to hand back to the client. */
export class RemoteError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "RemoteError";
    this.status = status;
  }
}

/** At most this much of the chart is read. Charts are a few tens of kB. */
const MAX_CHART_BYTES = 1_000_000;
/** How long a single upstream request may take. */
const CHART_TIMEOUT_MS = 10_000;
/** How many redirects to follow before giving up. */
const MAX_REDIRECTS = 3;

const PRIVATE_HOST_RE = /^(localhost|.*\.localhost|.*\.local|.*\.internal)$/i;

/** Whether an IPv4 literal points at a private, loopback or link-local range. */
function isPrivateIPv4(host: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!match) return false;
  const a = Number(match[1]);
  const b = Number(match[2]);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  return false;
}

/**
 * Whether a URL is one we are willing to fetch. Rejects non-http(s), embedded
 * credentials, loopback/private hosts and IP literals.
 */
export function isAllowedRemoteUrl(value: string | URL): boolean {
  let url: URL;
  try {
    url = typeof value === "string" ? new URL(value) : value;
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  if (!host) return false;
  if (host.startsWith("[") || host.includes(":")) return false; // IPv6 literal
  if (PRIVATE_HOST_RE.test(host)) return false;
  if (isPrivateIPv4(host)) return false;
  return true;
}

export interface RemoteFetchOptions {
  /** Overridable fetch, for tests. */
  fetchImpl?: typeof fetch;
  maxBytes?: number;
  timeoutMs?: number;
}

/** Read a response body, stopping (and rejecting) once it exceeds `maxBytes`. */
async function readCapped(
  response: Response,
  maxBytes: number,
): Promise<{ text: string; tooLarge: boolean }> {
  const body = response.body;
  if (!body) {
    const text = await response.text();
    return { text, tooLarge: text.length > maxBytes };
  }
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => {});
      return { text, tooLarge: true };
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return { text, tooLarge: false };
}

/** Fetch the chart text, following a few redirects and re-checking each hop. */
async function fetchChartText(
  url: string,
  options: RemoteFetchOptions,
): Promise<{ text: string; finalUrl: string }> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxBytes = options.maxBytes ?? MAX_CHART_BYTES;
  const timeoutMs = options.timeoutMs ?? CHART_TIMEOUT_MS;

  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isAllowedRemoteUrl(current)) throw new RemoteError("blocked-url", 400);

    let response: Response;
    try {
      response = await fetchImpl(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { accept: "text/plain, application/octet-stream, */*" },
      });
    } catch {
      throw new RemoteError("upstream-failed", 502);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new RemoteError("upstream-failed", 502);
      try {
        current = new URL(location, current).toString();
      } catch {
        throw new RemoteError("upstream-failed", 502);
      }
      continue;
    }

    if (!response.ok) {
      const notFound = response.status === 404;
      throw new RemoteError(notFound ? "not-found" : "upstream-failed", notFound ? 404 : 502);
    }

    const { text, tooLarge } = await readCapped(response, maxBytes);
    if (tooLarge) throw new RemoteError("too-large", 413);
    return { text, finalUrl: current };
  }

  throw new RemoteError("too-many-redirects", 502);
}

export interface RemoteUltraStar {
  song: UltraStarSong;
  /** Absolute media URLs, resolved against the chart's own URL. */
  media: TrackMedia;
  /** The chart URL after any redirects, used as the canonical source. */
  sourceUrl: string;
}

/**
 * Fetch and parse an UltraStar chart from a URL. Throws a {@link RemoteError}
 * when the URL is refused, unreachable, too large, or has no playable lyrics.
 */
export async function fetchRemoteUltraStar(
  url: string,
  options: RemoteFetchOptions = {},
): Promise<RemoteUltraStar> {
  const { text, finalUrl } = await fetchChartText(url, options);
  const song = parseUltraStar(text);

  if (!song.notes.some((note) => note.kind === "note")) {
    throw new RemoteError("no-lyrics", 422);
  }
  if (!song.audio) throw new RemoteError("no-audio", 422);

  const base = new URL(finalUrl);
  const resolve = (reference: string | null): string | undefined => {
    if (!reference) return undefined;
    try {
      return new URL(reference, base).toString();
    } catch {
      return undefined;
    }
  };

  const audio = resolve(song.audio);
  const video = resolve(song.video);
  const background = resolve(song.background);
  const cover = resolve(song.cover);
  if (!audio) throw new RemoteError("no-audio", 422);

  const media: TrackMedia = {
    audio,
    ...(video ? { video } : {}),
    ...(background ? { background } : {}),
    ...(cover ? { cover } : {}),
    ...(song.videoGap ? { videoGap: song.videoGap } : {}),
  };

  return { song, media, sourceUrl: finalUrl };
}
