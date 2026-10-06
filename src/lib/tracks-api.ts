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
import type { TrackStore } from "./track/store";
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

/** A YouTube video id. */
export const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** A caption language code such as `en` or `pt-BR`. */
const LANG_RE = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;

export function trackKey(id: string, lang: string): string {
  return `tracks/${id}/${lang}.json`;
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

  const response = await resolveTrack(request, env, id);
  // A HEAD response must not carry a body.
  if (request.method === "HEAD") {
    return new Response(null, { status: response.status, headers: response.headers });
  }
  return response;
}

async function resolveTrack(
  request: Request,
  env: TracksEnv,
  id: string,
): Promise<Response> {
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

  if (env.seed) {
    const seeded = await env.seed(id, lang).catch(() => null);
    const seededTrack = seeded ? parseTrack(seeded) : null;
    if (seededTrack) {
      await env.store.put(trackKey(id, lang), JSON.stringify(seededTrack));
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

  let source;
  try {
    source = await fetchTrackSource(id, lang, {
      fetchImpl: env.fetchImpl,
      attempts: env.retries,
      fallbackUrl: env.fallbackUrl,
    });
  } catch (error) {
    // Upstream failure: return it, but never cache it. The detail is logged
    // server-side and deliberately not sent to the browser.
    const status = error instanceof CaptionError ? error.status : 502;
    console.error(`track upstream failed for ${id}/${lang}:`, error);
    return json({ error: "upstream-failed" }, status);
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
    // An authoritative "no captions" result. Not cached, so a later retry (or a
    // fix on the provider side) can still succeed.
    return json({ error: "no-captions", id, lang, title: source.title }, 422);
  }

  await env.store.put(trackKey(id, lang), JSON.stringify(track));
  return trackResponse(track, "miss");
}
