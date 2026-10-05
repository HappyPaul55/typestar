/**
 * The track API: "is it cached? if not, fetch and cache it".
 *
 * Shared verbatim by the deployed Worker and the Astro dev server (see the
 * `devServer` Vite plugin in `astro.config.mjs`) so local development exercises
 * the real code path. It is runtime-agnostic: it takes a {@link TrackStore} and
 * an optional seed lookup rather than reaching for R2 or the asset binding
 * itself.
 */

import { buildTrack } from "./track/build";
import type { TrackStore } from "./track/store";
import { parseTrack } from "./track/validate";
import type { Track } from "./track/types";
import { CaptionError, fetchTrackSource } from "./youtube-captions";

export interface TracksEnv {
  store: TrackStore;
  /**
   * Bundled, pre-warmed track lookup tried before hitting YouTube. In
   * production this reads the static `/tracks/<id>.json` assets; in dev it reads
   * the same files from `public/`.
   */
  seed?: (id: string, lang: string) => Promise<string | null>;
  fetchImpl?: typeof fetch;
  /** Upstream attempts; defaults to 3. */
  retries?: number;
}

/** A YouTube video id. */
export const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** A caption language code such as `en` or `pt-BR`. */
const LANG_RE = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;

/** How long a "this video has no captions" result is trusted. */
const MISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function trackKey(id: string, lang: string): string {
  return `tracks/${id}/${lang}.json`;
}

export function missKey(id: string, lang: string): string {
  return `misses/${id}/${lang}.json`;
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function trackResponse(track: Track, cache: "hit" | "miss" | "seed"): Response {
  return new Response(JSON.stringify(track), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
      "x-typestar-cache": cache,
    },
  });
}

function isFreshMiss(raw: string): boolean {
  try {
    const value = JSON.parse(raw) as { at?: string };
    const at = value.at ? Date.parse(value.at) : Number.NaN;
    return Number.isFinite(at) && Date.now() - at < MISS_TTL_MS;
  } catch {
    return false;
  }
}

/**
 * Resolve a track, fetching and caching it on a miss.
 *
 * @param id the 11-character YouTube video id (already extracted by the caller)
 */
export async function handleTrackRequest(
  request: Request,
  env: TracksEnv,
  id: string,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return json({ error: "method-not-allowed" }, 405, { allow: "GET, HEAD" });
  }
  if (!VIDEO_ID_RE.test(id)) {
    return json({ error: "bad-video-id" }, 400);
  }

  const lang = (new URL(request.url).searchParams.get("lang") || "en").toLowerCase();
  if (!LANG_RE.test(lang)) {
    return json({ error: "bad-language" }, 400);
  }

  const cached = await env.store.get(trackKey(id, lang));
  const cachedTrack = cached ? parseTrack(cached) : null;
  if (cachedTrack) return trackResponse(cachedTrack, "hit");

  const miss = await env.store.get(missKey(id, lang));
  if (miss && isFreshMiss(miss)) {
    return json({ error: "no-captions", id, lang }, 422);
  }

  if (env.seed) {
    const seeded = await env.seed(id, lang).catch(() => null);
    const seededTrack = seeded ? parseTrack(seeded) : null;
    if (seededTrack) {
      await env.store.put(trackKey(id, lang), JSON.stringify(seededTrack));
      return trackResponse(seededTrack, "seed");
    }
  }

  let source;
  try {
    source = await fetchTrackSource(id, lang, env.fetchImpl ?? fetch, env.retries ?? 3);
  } catch (error) {
    const status = error instanceof CaptionError ? error.status : 502;
    return json(
      {
        error: "upstream-failed",
        message: error instanceof Error ? error.message : String(error),
      },
      status,
    );
  }

  const track = buildTrack({
    id,
    lang,
    title: source.title,
    description: source.description,
    subtitles: source.subtitles,
    json3: source.json3,
    captionKind: source.captionKind,
  });

  if (!track.words.length) {
    await env.store.put(missKey(id, lang), JSON.stringify({ at: new Date().toISOString() }));
    return json({ error: "no-captions", id, lang, title: source.title }, 422);
  }

  await env.store.put(trackKey(id, lang), JSON.stringify(track));
  return trackResponse(track, "miss");
}
