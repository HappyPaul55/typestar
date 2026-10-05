/**
 * Fetch a video's title, description and captions from YouTube.
 *
 * `youtube-caption-extractor` calls YouTube's internal player API and is
 * roughly 70% reliable from Cloudflare's egress (datacenter IPs get bot-gated),
 * so every call is retried. The library only exposes line-level subtitles, so a
 * custom `fetch` also captures the raw `json3` caption body, which lets
 * `parse.ts` recover word-level timing.
 *
 * Server-side only: it must never run in the browser (YouTube blocks the
 * cross-origin call and it would leak the request shape).
 */

import { getVideoDetails } from "youtube-caption-extractor";
import type { CaptionKind, CaptionSegment } from "./track/types";

export interface TrackSourceData {
  title: string;
  description: string;
  subtitles: CaptionSegment[];
  /** Raw `json3` transcript, or `null` when the capture failed. */
  json3: unknown;
  /** Whether the chosen caption track was auto-generated, from its URL. */
  captionKind: CaptionKind;
}

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

/**
 * Fetch caption data for a video. Throws a {@link CaptionError} when YouTube is
 * unreachable after retries; resolves with an empty `subtitles` array when the
 * video simply has no captions.
 */
export async function fetchTrackSource(
  videoID: string,
  lang: string,
  fetchImpl: typeof fetch = fetch,
  attempts = 3,
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
    throw new CaptionError(
      error instanceof Error ? error.message : String(error),
      502,
    );
  }

  return {
    title: details.title,
    description: details.description,
    subtitles: details.subtitles ?? [],
    json3: captured,
    captionKind,
  };
}
