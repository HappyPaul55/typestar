/**
 * Fetch a video's title, description and captions.
 *
 * Primary path: `youtube-caption-extractor`, which calls YouTube's internal
 * player API. It is roughly 70% reliable from Cloudflare's egress (datacenter
 * IPs get bot-gated), so every call is retried. The library only exposes
 * line-level subtitles, so a custom `fetch` also captures the raw `json3`
 * caption body, which lets `parse.ts` recover word-level timing.
 *
 * Fallback path: a third-party caption service, used only when the primary
 * path fails or comes back with nothing. It returns the same line-level
 * subtitle shape, so `buildTrack` can still build a playable track.
 *
 * Server-side only: this must never run in the browser (YouTube blocks the
 * cross-origin call and it would leak the request shape).
 */

import { getVideoDetails } from "youtube-caption-extractor";
import type { CaptionKind, CaptionSegment } from "./track/types";

export interface TrackSourceData {
  title: string;
  description: string;
  subtitles: CaptionSegment[];
  /** Raw `json3` transcript, or `null` when it was not captured. */
  json3: unknown;
  /** Whether the chosen caption track was auto-generated, when known. */
  captionKind: CaptionKind;
  /** Which provider supplied the data. */
  provider: "youtube" | "fallback";
}

export interface FetchTrackSourceOptions {
  fetchImpl?: typeof fetch;
  /** Upstream attempts for the primary path; defaults to 3. */
  attempts?: number;
  /** Base URL of the fallback caption service. */
  fallbackUrl?: string;
}

/** Used when YouTube's caption lookup fails or returns nothing. */
const DEFAULT_FALLBACK_URL = "https://youtube.weblinq.dev/api/videoDetails";

export class CaptionError extends Error {
  readonly status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "CaptionError";
    this.status = status;
  }
}

/** Errors worth retrying: bot challenges and transient upstream failures. */
const RETRYABLE =
  /bot|challenge|sign in|429|403|50\d|failed|not playable|timeout|network|fetch/i;

/** The caption endpoint; the player endpoint does not contain this. */
const CAPTION_URL_MARKER = "timedtext";

/** How long to wait on the fallback service. */
const FALLBACK_TIMEOUT_MS = 8000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(run: () => Promise<T>, attempts: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!RETRYABLE.test(message) || attempt === attempts - 1) throw error;
      await sleep(200 * 2 ** attempt + Math.floor(Math.random() * 200));
    }
  }
  throw lastError;
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/** The primary path: YouTube's own captions, with the raw `json3` captured. */
async function fetchFromYouTube(
  videoID: string,
  lang: string,
  fetchImpl: typeof fetch,
  attempts: number,
): Promise<TrackSourceData> {
  let captured: unknown = null;
  let captionKind: CaptionKind = "unknown";

  const capturing: typeof fetch = async (input, init) => {
    const response = await fetchImpl(input, init);
    const url = urlOf(input);
    if (url.includes(CAPTION_URL_MARKER)) {
      // Auto-generated tracks carry `kind=asr`; human/uploaded ones do not.
      captionKind = /(?:[?&])kind=asr\b/i.test(url) ? "asr" : "manual";
      try {
        const text = await response.clone().text();
        if (text.trim()) captured = JSON.parse(text) as unknown;
      } catch {
        // Keep the line-level fallback; the game can still work without it.
      }
    }
    return response;
  };

  let details;
  try {
    details = await withRetry(
      () => getVideoDetails({ videoID, lang, fetch: capturing }),
      attempts,
    );
  } catch (error) {
    throw new CaptionError(error instanceof Error ? error.message : String(error), 502);
  }

  return {
    title: details.title,
    description: details.description,
    subtitles: details.subtitles ?? [],
    json3: captured,
    captionKind,
    provider: "youtube",
  };
}

function toSegment(value: unknown): CaptionSegment | null {
  if (!value || typeof value !== "object") return null;
  const segment = value as { start?: unknown; dur?: unknown; text?: unknown };
  if (typeof segment.text !== "string") return null;
  return {
    start: String(segment.start ?? "0"),
    dur: String(segment.dur ?? "0"),
    text: segment.text,
  };
}

/**
 * The fallback path. Returns `null` when the service cannot be reached or
 * answers with an unusable body, and an (possibly empty) result otherwise —
 * an empty `subtitles` array means the video really has no captions.
 */
async function fetchFromFallback(
  videoID: string,
  lang: string,
  fetchImpl: typeof fetch,
  baseUrl: string,
): Promise<TrackSourceData | null> {
  const url = `${baseUrl}?videoID=${encodeURIComponent(videoID)}&lang=${encodeURIComponent(lang)}`;

  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(FALLBACK_TIMEOUT_MS),
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return null;
  }

  const details = (data as { videoDetails?: unknown })?.videoDetails;
  if (!details || typeof details !== "object") return null;
  const record = details as { title?: unknown; description?: unknown; subtitles?: unknown };
  const subtitles = Array.isArray(record.subtitles)
    ? record.subtitles.map(toSegment).filter((segment): segment is CaptionSegment => segment !== null)
    : [];

  return {
    title: typeof record.title === "string" ? record.title : "",
    description: typeof record.description === "string" ? record.description : "",
    subtitles,
    json3: null,
    captionKind: "unknown",
    provider: "fallback",
  };
}

/**
 * Fetch caption data for a video, preferring YouTube and falling back to the
 * third-party service. Throws a {@link CaptionError} only when no provider
 * could be reached; a resolved result with no subtitles means the video has no
 * captions (and must not be treated as a transient failure).
 */
export async function fetchTrackSource(
  videoID: string,
  lang: string,
  options: FetchTrackSourceOptions = {},
): Promise<TrackSourceData> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const attempts = options.attempts ?? 3;
  const fallbackUrl = options.fallbackUrl ?? DEFAULT_FALLBACK_URL;

  let primary: TrackSourceData | null = null;
  let primaryError: unknown = null;
  try {
    primary = await fetchFromYouTube(videoID, lang, fetchImpl, attempts);
  } catch (error) {
    primaryError = error;
  }

  // YouTube answered and produced captions — done.
  if (primary && (primary.subtitles.length > 0 || primary.json3)) return primary;

  // Otherwise try the fallback provider.
  const fallback = await fetchFromFallback(videoID, lang, fetchImpl, fallbackUrl).catch(
    () => null,
  );
  if (fallback && (fallback.subtitles.length > 0 || fallback.json3)) return fallback;

  // Neither has captions. If a provider answered authoritatively, report that.
  if (fallback) return fallback;
  if (primary) return primary;

  throw primaryError instanceof CaptionError
    ? primaryError
    : new CaptionError(
        primaryError instanceof Error ? primaryError.message : String(primaryError),
        502,
      );
}
