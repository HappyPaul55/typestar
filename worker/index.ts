/**
 * Cloudflare Worker entry point.
 *
 * Static assets are uploaded from `dist/` and served by the asset server.
 * `run_worker_first` in wrangler.jsonc sends `/api/*`, `/play` and `/play/*`
 * here; everything else is served as a static asset (with the pretty 404 page).
 *
 * Routes:
 * - `GET /api/track/:id`  → get-or-create a track (R2 cache, then the bundled
 *                           seed, then a live YouTube caption lookup)
 * - `/play?v=<id>`        → 301 redirect to the pretty `/play/<id>` URL
 * - `/play/<id>`          → the static `/play` page; the client reads the id
 *                           from the address bar
 *
 * Types are declared inline rather than pulling in `@cloudflare/workers-types`,
 * which would clash with the DOM lib used by the Astro/React side of the repo.
 */
import { handleTrackRequest, VIDEO_ID_RE } from "../src/lib/tracks-api";
import { r2Store, type R2LikeBucket } from "../src/lib/track/store";

type AssetsBinding = { fetch(request: Request): Promise<Response> };

type Env = {
  ASSETS: AssetsBinding;
  /** R2 bucket binding for the track cache, configured in wrangler.jsonc. */
  TRACKS?: R2LikeBucket;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname.startsWith("/api/track/")) {
      const id = decodeURIComponent(pathname.slice("/api/track/".length)).replace(/\/+$/, "");

      // Pre-warmed tracks are bundled as static assets; try them before the
      // (less reliable) live YouTube lookup. Only the default language is
      // pre-warmed.
      const seed = async (seedId: string, lang: string): Promise<string | null> => {
        if (lang !== "en") return null;
        const asset = await env.ASSETS.fetch(
          new Request(new URL(`/tracks/${seedId}.json`, url)),
        );
        return asset.ok ? asset.text() : null;
      };

      return handleTrackRequest(request, { store: r2Store(env.TRACKS), seed }, id);
    }

    if (pathname === "/play") {
      const video = url.searchParams.get("v");
      if (video && VIDEO_ID_RE.test(video)) {
        return Response.redirect(new URL(`/play/${video}`, url).toString(), 301);
      }
      return env.ASSETS.fetch(request);
    }

    if (pathname.startsWith("/play/")) {
      // Serve the static play page; the browser keeps the pretty URL.
      return env.ASSETS.fetch(new Request(new URL("/play", url), request));
    }

    return env.ASSETS.fetch(request);
  },
};
