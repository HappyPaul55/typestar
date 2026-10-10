/**
 * The track API: "is it cached? if not, fetch and cache it".
 *
 * Shared verbatim by the deployed Worker and the Astro dev server (see the
 * `devServer` Vite plugin in `astro.config.mjs`) so local development exercises
 * the real code path. It is runtime-agnostic: it takes a {@link TrackStore} and
 * an optional seed lookup rather than reaching for R2 or the asset binding
 * itself.
 *
 * Only successful, playable tracks are cached. A failure to reach YouTube (rate
 * limiting, bot blocking, network) is never cached, and neither is an empty
 * result — otherwise a transient upstream problem would poison the cache and
 * make a track permanently unplayable.
 */

import { buildTrack } from "./track/build";
import { fetchRemoteUltraStar, RemoteError, isAllowedRemoteUrl } from "./track/remote";
import {
  isHttpUrl,
  seedIdOf,
  ultraStarHash,
  ultraStarId,
  YOUTUBE_ID_RE,
  type TrackSourceRef,
} from "./track/source";
import type { TrackStore } from "./track/store";
import { ultraStarTrack } from "./track/ultrastar";
import { parseTrack } from "./track/validate";
import type { Track } from "./track/types";
import { CaptionError, fetchTrackSource } from "./youtube-captions";

export interface TracksEnv {
  store: TrackStore;
  /**
   * Bundled, pre-warmed track lookup tried before hitting the network. In
   * production this reads the static `/tracks/<id>.json` assets; in dev it reads
   * the same files from `public/`.
   */
  seed?: (id: string, lang: string) => Promise<string | null>;
  fetchImpl?: typeof fetch;
  /** Upstream attempts for the primary path; defaults to 3. */
  retries?: number;
  /** Base URL of the fallback caption service. */
  fallbackUrl?: string;
  /** Overrides for the UltraStar remote fetch (tests). */
  maxChartBytes?: number;
  timeoutMs?: number;
  /**
   * When set, a track that is not already cached or seeded has to carry a valid
   * Turnstile token before it will be fetched from YouTube. Cached and seeded
   * tracks are served without a check, so the human test only ever appears for
   * a genuinely new song.
   */
  turnstile?: TurnstileConfig;
}

/** Server-side configuration for the Turnstile human check. */
export interface TurnstileConfig {
  /** Widget secret (a Worker secret in production). */
  secret: string;
  /** Hostnames allowed to have produced the token, from siteverify. */
  hostnames: string[];
  /** The expected token action, e.g. `track`. */
  action?: string;
  /** Overridable fetch, for tests. */
  fetchImpl?: typeof fetch;
}

/** The header the browser sends the widget token in. */
export const TURNSTILE_TOKEN_HEADER = "x-turnstile-token";

type TurnstileVerdict = "ok" | "missing" | "failed";

/**
 * Verify a Turnstile token with Cloudflare's siteverify.
 *
 * Fails closed: a missing token is `missing` (the client should run the
 * widget), and anything else — a non-2xx, a network error, a bad action or an
 * unapproved hostname — is `failed`.
 */
export async function verifyTurnstile(
  request: Request,
  config: TurnstileConfig,
): Promise<TurnstileVerdict> {
  const token = request.headers.get(TURNSTILE_TOKEN_HEADER)?.trim() ?? "";
  if (!token) return "missing";
  if (token.length > 2048) return "failed";

  const allowed = new Set(
    config.hostnames.map((hostname) => hostname.trim().toLowerCase()).filter(Boolean),
  );
  if (!config.secret || allowed.size === 0) return "failed";

  const doFetch = config.fetchImpl ?? fetch;
  const remoteip = request.headers.get("cf-connecting-ip");
  let result: { success?: boolean; action?: string; hostname?: string };
  try {
    const response = await doFetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        signal: AbortSignal.timeout(10_000),
        body: new URLSearchParams({
          secret: config.secret,
          response: token,
          ...(remoteip ? { remoteip } : {}),
        }),
      },
    );
    if (!response.ok) return "failed";
    result = (await response.json()) as typeof result;
  } catch {
    return "failed";
  }

  if (result.success !== true) return "failed";
  if (config.action && result.action !== config.action) return "failed";
  if (!result.hostname || !allowed.has(result.hostname.toLowerCase())) return "failed";
  return "ok";
}

/** A caption language code such as `en` or `pt-BR`. */
const LANG_RE = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;

/**
 * The cache key for a track. YouTube keeps its historical `tracks/<id>/…` shape
 * so the existing R2 cache stays valid; UltraStar charts are keyed by a hash of
 * their (normalised) source URL.
 */
export function trackKey(source: TrackSourceRef, lang: string): string {
  return source.kind === "ultrastar"
    ? `tracks/ultrastar/${ultraStarHash(source.url)}/${lang}.json`
    : `tracks/${source.id}/${lang}.json`;
}

/**
 * Read a track from the cache or the bundled seed, without fetching anything.
 *
 * Used to fill per-track SEO on the pretty play route: it never triggers a live
 * lookup or a human check, so an unknown song simply keeps the generic tags.
 */
export async function getCachedTrack(
  env: Pick<TracksEnv, "store" | "seed">,
  source: TrackSourceRef,
  lang = "en",
): Promise<Track | null> {
  const cached = await env.store.get(trackKey(source, lang));
  const cachedTrack = cached ? parseTrack(cached) : null;
  if (cachedTrack) return cachedTrack;

  if (!env.seed) return null;
  const seeded = await env.seed(seedIdOf(source), lang).catch(() => null);
  return seeded ? parseTrack(seeded) : null;
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

/**
 * Resolve a track, fetching and caching it on a miss.
 *
 * @param source the YouTube id or UltraStar URL, already parsed by the caller
 */
export async function handleTrackRequest(
  request: Request,
  env: TracksEnv,
  source: TrackSourceRef,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return json({ error: "method-not-allowed" }, 405, { allow: "GET, HEAD" });
  }

  const response = await resolveTrack(request, env, source);
  // A HEAD response must not carry a body.
  if (request.method === "HEAD") {
    return new Response(null, { status: response.status, headers: response.headers });
  }
  return response;
}

async function resolveTrack(
  request: Request,
  env: TracksEnv,
  source: TrackSourceRef,
): Promise<Response> {
  if (source.kind === "youtube") {
    if (!YOUTUBE_ID_RE.test(source.id)) return json({ error: "bad-video-id" }, 400);
  } else {
    if (!isHttpUrl(source.url)) return json({ error: "bad-source-url" }, 400);
    if (!isAllowedRemoteUrl(source.url)) return json({ error: "blocked-url" }, 400);
  }

  const lang = (new URL(request.url).searchParams.get("lang") || "en").toLowerCase();
  if (!LANG_RE.test(lang)) {
    return json({ error: "bad-language" }, 400);
  }

  const cached = await env.store.get(trackKey(source, lang));
  const cachedTrack = cached ? parseTrack(cached) : null;
  if (cachedTrack) return trackResponse(cachedTrack, "hit");

  if (env.seed) {
    const seeded = await env.seed(seedIdOf(source), lang).catch(() => null);
    const seededTrack = seeded ? parseTrack(seeded) : null;
    if (seededTrack) {
      await env.store.put(trackKey(source, lang), JSON.stringify(seededTrack));
      return trackResponse(seededTrack, "seed");
    }
  }

  // Only a genuinely new song reaches the human check: cached and seeded tracks
  // have already returned above.
  if (env.turnstile) {
    const verdict = await verifyTurnstile(request, env.turnstile);
    if (verdict !== "ok") {
      return json(
        {
          error: verdict === "missing" ? "turnstile-required" : "turnstile-failed",
        },
        403,
      );
    }
  }

  if (source.kind === "ultrastar") {
    return resolveUltraStar(source, env, lang);
  }

  let captionSource;
  try {
    captionSource = await fetchTrackSource(source.id, lang, {
      fetchImpl: env.fetchImpl,
      attempts: env.retries,
      fallbackUrl: env.fallbackUrl,
    });
  } catch (error) {
    // Upstream failure: return it, but never cache it. The detail is logged
    // server-side and deliberately not sent to the browser.
    const status = error instanceof CaptionError ? error.status : 502;
    console.error(`track upstream failed for ${source.id}/${lang}:`, error);
    return json({ error: "upstream-failed" }, status);
  }

  const track = buildTrack({
    id: source.id,
    lang,
    title: captionSource.title,
    description: captionSource.description,
    subtitles: captionSource.subtitles,
    json3: captionSource.json3,
    captionKind: captionSource.captionKind,
  });

  if (!track.words.length) {
    // An authoritative "no captions" result. Not cached, so a later retry (or a
    // fix on the provider side) can still succeed.
    return json({ error: "no-captions", id: source.id, lang, title: captionSource.title }, 422);
  }

  await env.store.put(trackKey(source, lang), JSON.stringify(track));
  return trackResponse(track, "miss");
}

/**
 * Fetch an UltraStar chart from its URL, build a track from it and cache it.
 *
 * The cache key comes from the **request** URL (so a later request finds it),
 * while `sourceUrl` records the URL after any redirects, for the canonical link
 * and for resolving the chart's media.
 */
async function resolveUltraStar(
  source: Extract<TrackSourceRef, { kind: "ultrastar" }>,
  env: TracksEnv,
  lang: string,
): Promise<Response> {
  let remote;
  try {
    remote = await fetchRemoteUltraStar(source.url, {
      fetchImpl: env.fetchImpl,
      maxBytes: env.maxChartBytes,
      timeoutMs: env.timeoutMs,
    });
  } catch (error) {
    const code = error instanceof RemoteError ? error.message : "upstream-failed";
    const status = error instanceof RemoteError ? error.status : 502;
    console.error(`ultrastar upstream failed for ${source.url}:`, error);
    return json({ error: code }, status);
  }

  const track = ultraStarTrack(remote.song, {
    id: ultraStarId(source.url),
    lang,
    description: `UltraStar — ${remote.song.artist || "a chart from the web"}`,
    origin: "ultrastar",
    sourceUrl: remote.sourceUrl,
    artist: remote.song.artist,
    media: remote.media,
  });

  if (!track.words.length) {
    // A chart with no lyric notes is not playable; do not cache it.
    return json({ error: "no-lyrics", lang, title: remote.song.title }, 422);
  }

  await env.store.put(trackKey(source, lang), JSON.stringify(track));
  return trackResponse(track, "miss");
}
