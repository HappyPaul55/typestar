/**
 * Cloudflare Worker entry point.
 *
 * Static assets are uploaded from `dist/` and served by the asset server.
 * `run_worker_first` in wrangler.jsonc sends `/api/*`, `/play` and `/play/*`
 * here; everything else is served as a static asset (with the pretty 404 page).
 *
 * Routes:
 * - `GET /api/track/youtube/:id`  → get-or-create a YouTube track
 * - `GET /api/track/ultrastar?url=:url` → get-or-create an UltraStar track
 * - `GET /api/track/:id`          → the legacy YouTube path (still supported)
 * - `/play?v=<id>`                → 301 to `/play/youtube/<id>`
 * - `/play/<id>`                  → 301 to `/play/youtube/<id>` (legacy)
 * - `/play/youtube/<id>`          → the static play page; when the song is
 *                                   already cached or seeded its title and
 *                                   social tags are filled in
 * - `/play/ultrastar/<url>`       → the same, for a chart fetched from a URL
 *
 * Types are declared inline rather than pulling in `@cloudflare/workers-types`,
 * which would clash with the DOM lib used by the Astro/React side of the repo.
 */
import {
  apiSourceFromRequest,
  playSourceFromPathname,
  YOUTUBE_ID_RE,
} from "../src/lib/track/source";
import {
  getCachedTrack,
  handleTrackRequest,
} from "../src/lib/tracks-api";
import { injectTrackSeo, trackSeo } from "../src/lib/seo";
import { r2Store, type R2LikeBucket } from "../src/lib/track/store";

type AssetsBinding = { fetch(request: Request): Promise<Response> };

type Env = {
  ASSETS: AssetsBinding;
  /** R2 bucket binding for the track cache, configured in wrangler.jsonc. */
  TRACKS?: R2LikeBucket;
  /** Base URL of the fallback caption service, configured in wrangler.jsonc. */
  CAPTION_FALLBACK_URL?: string;
  /** Turnstile widget secret. When set, new tracks require a human check. */
  TURNSTILE_SECRET?: string;
  /** Comma-separated hostnames allowed on the Turnstile token. */
  TURNSTILE_HOSTNAMES?: string;
};

/** Serve the play page with the track's own title and social tags. */
function withTrackSeo(
  page: Response,
  html: string,
  track: { id: string; title: string },
  origin: string,
): Response {
  const headers = new Headers(page.headers);
  // The body was decoded while reading it, so the original encoding and length
  // no longer apply.
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("etag");
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "public, max-age=3600");
  return new Response(injectTrackSeo(html, trackSeo(track, origin)), {
    status: 200,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    const store = r2Store(env.TRACKS);

    // Pre-warmed tracks are bundled as static assets; try them before the
    // (less reliable) live YouTube lookup. Only the default language is warmed.
    const seed = async (seedId: string, lang: string): Promise<string | null> => {
      if (lang !== "en") return null;
      const asset = await env.ASSETS.fetch(
        new Request(new URL(`/tracks/${seedId}.json`, url)),
      );
      return asset.ok ? asset.text() : null;
    };

    if (pathname.startsWith("/api/track/")) {
      const source = apiSourceFromRequest(pathname, url.searchParams);
      if (!source) {
        return new Response(JSON.stringify({ error: "bad-request" }), {
          status: 400,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      }

      return handleTrackRequest(
        request,
        {
          store,
          seed,
          fallbackUrl: env.CAPTION_FALLBACK_URL,
          turnstile: env.TURNSTILE_SECRET
            ? {
                secret: env.TURNSTILE_SECRET,
                hostnames: (env.TURNSTILE_HOSTNAMES ?? "typestar.happypaul55.com")
                  .split(",")
                  .map((hostname) => hostname.trim())
                  .filter(Boolean),
                action: "track",
              }
            : undefined,
        },
        source,
      );
    }

    if (pathname === "/play") {
      const video = url.searchParams.get("v");
      if (video && YOUTUBE_ID_RE.test(video)) {
        return Response.redirect(new URL(`/play/youtube/${video}`, url).toString(), 301);
      }
      return env.ASSETS.fetch(request);
    }

    // Legacy pretty URL: `/play/<11-char id>` now redirects to its typed form.
    const legacy = /^\/play\/([A-Za-z0-9_-]{11})\/?$/.exec(pathname);
    if (legacy) {
      return Response.redirect(
        new URL(`/play/youtube/${legacy[1]}`, url).toString(),
        301,
      );
    }

    // The typed pretty routes. Fetch the static page once, and if the song is
    // already known, fill in its title and social tags before serving it.
    const source = playSourceFromPathname(pathname);
    if (source) {
      const pageRequest = () =>
        env.ASSETS.fetch(
          new Request(new URL("/play", url), { headers: request.headers }),
        );
      const [page, track] = await Promise.all([
        pageRequest(),
        getCachedTrack({ store, seed }, source),
      ]);
      if (track && page.ok) {
        return withTrackSeo(page, await page.text(), track, url.origin);
      }
      return page;
    }

    if (pathname.startsWith("/play/")) {
      // `/play/local` and a malformed id: serve the static play page as before.
      return env.ASSETS.fetch(
        new Request(new URL("/play", url), { headers: request.headers }),
      );
    }

    return env.ASSETS.fetch(request);
  },
};
