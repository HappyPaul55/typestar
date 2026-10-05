# AGENTS.md

## What this repo is

A standalone **game site** for **TypeStar** (`typestar.happypaul55.com`). It
follows the agency client-site standard: one self-contained repository, no
monorepo, no shared template, no workspace or submodule dependency. Structure
follows the Lexiphanic reference build; the **visual style follows
`client-happypaul55-com`** (the engineer's-notebook look).

TypeStar is a **rhythm touch-typing game**: a bit like Guitar Hero, a bit like a
keyboard speed game. YouTube supplies the music and visuals, and you type the
lyrics as the words arrive. The game is **built**.

The marketing shell (landing, privacy, 404) is plain Astro and ships no
JavaScript. **`/play` is a React island** (`@astrojs/react`, `client:load`) and
holds the game (`src/components/game/GameApp.tsx`). A **Cloudflare Worker**
(`worker/index.ts`) serves the track API and the pretty play routes.

Routes: `/` (landing), `/play` (track picker), `/play/<youtubeId>` (the game),
`/privacy`, `/404`, and `GET /api/track/<youtubeId>`.

## How the game works

1. `/play/<id>` serves the static play page; the client reads the id from the
   address bar and calls `GET /api/track/<id>`.
2. The Worker returns the track from **R2** if cached, else from the bundled
   seed in `public/tracks/<id>.json`, else it fetches the video's captions with
   `youtube-caption-extractor` (falling back to the `CAPTION_FALLBACK_URL`
   service in `wrangler.jsonc` when YouTube fails or returns nothing), builds a
   word-timed track, caches it in R2 and returns it. Only playable tracks are
   cached — an upstream failure or an empty result is never written, so a
   transient YouTube block cannot poison the cache.
3. The React island plays the video with the YouTube IFrame API and scores
   typing against the caption timings.

Three difficulty modes: **easy** (first letter only), **normal** (whole word,
punctuation optional) and **hard** (whole word, punctuation required). Four run
modes, independent of difficulty: **normal** (fails when the score goes
negative), **instant** (stops on the first mistake), **fun** (never fails) and
**practise** (rewinds 5 seconds on a mistake and counts the replay). Scoring
rewards chains with combo tiers and a perfect-line bonus. Both settings are
chosen on the start screen and persisted locally; the difficulty is also in the
HUD dropdown. The end screen shows the score, rank, fun stats and a local
personal best per track + difficulty + run mode.

Captions are line-level; `src/lib/track/parse.ts` recovers word-level timing
from the raw `json3` transcript (one word per auto-caption event, per-segment
offsets where present) and otherwise shares a line's duration across its words.
It preserves the caption's own line breaks, so the highway reads like the source
captions. `TRACK_VERSION` is bumped when the built shape changes so stale R2 /
dev caches are rebuilt. The pure game rules live in `src/lib/game/engine.ts` and
are unit-tested.

## Commands

```bash
bun install
bun run dev      # dev server on http://localhost:4321
bun run build    # static build into dist/
bun run preview  # serve the built site
bun run check    # astro check — the only type gate
bun test         # unit tests (bun test)
bun run icons    # regenerate public/icons from public/icons/brand-mark.svg
bun run tracks:warm     # fetch + build the featured tracks into public/tracks/
bun run tracks:bucket   # create the R2 bucket (once)
bun run tracks:publish  # upload public/tracks/*.json to the R2 bucket
```

Use **Bun** for everything: `bun` (never `npm`) and `bunx` (never `npx`). The
lockfile is `bun.lock`; do not add `package-lock.json`, `yarn.lock` or
`pnpm-lock.yaml`. Verify every change with `bun run check`, `bun test` and
`bun run build`. There is no linter.

## Key files

- `src/content/site/settings.json` — name, shortName, tagline, description, url,
  author and licence. The `file()` loader requires an **array** with
  `id: "main"`; the site reads `getEntry("site", "main")`.
- `src/content.config.ts` — Astro 5+ location (NOT `src/content/config.ts`).
- `src/content/legal/privacy.md` — privacy notice (rendered by
  `src/pages/privacy.astro`).
- `src/content/tracks/featured.ts` — the curated featured list shown on `/play`.
- `src/pages/play.astro` — page shell that mounts the React island
  `src/components/game/GameApp.tsx`.
- `src/components/game/**` — the game island: `GameApp` (phase machine),
  `PlayerStage`, `LyricHighway`, `Hud`, `Results`, `Calibration`, `TrackPicker`
  and the `hooks/` for the player and game loop.
- `src/lib/track/**` — track types, caption parsing, build, validation and the
  cache abstraction. Pure and tested.
- `src/lib/game/**` — the pure game engine, browser client and storage helpers.
- `src/lib/tracks-api.ts` — the shared get-or-create handler (Worker + dev).
- `src/lib/youtube-captions.ts` — caption fetch with retries and `json3`
  capture.
- `src/components/layout/Seo.astro` / `Header.astro` / `Footer.astro` — the
  notebook shell. Nav is Privacy + Play.
- `src/layouts/BaseLayout.astro` — loads settings, preloads the display font.
- `src/styles/global.css` — Tailwind v4 tokens, the notebook components and the
  game styles.
- `worker/index.ts` — Worker routes: `/api/track/:id`, `/play?v=` → 301,
  `/play/<id>` → the static page.
- `wrangler.jsonc` — `nodejs_compat`, the `TRACKS` R2 binding and
  `run_worker_first: ["/api/*", "/play", "/play/*"]`.
- `astro.config.mjs` — the `devServer` Vite plugin reproduces the Worker routing
  and runs the real API handler locally.
- `public/tracks/*.json` — pre-warmed seed tracks (generated, committed).
- `public/_headers` — CSP. YouTube is allowed for `script-src`, `frame-src` and
  `img-src`.
- `src/components/ui/Mark.astro` + `public/icons/brand-mark.svg` — the **TS**
  tile. `bun run icons` regenerates the icon set.

## Gotchas

- **Captions, not audio.** There is no `yt-dlp`, Whisper or AI. Tracks are built
  from YouTube's captions. Human captions are clean; auto-captions can mis-hear
  sung lyrics. Featured tracks are pre-warmed from a residential connection.
- **YouTube egress is unreliable from Workers** (~70% per request; ~97% with
  retries). R2 caching plus the bundled seed is what makes the game reliable.
- `nodejs_compat` is required: `youtube-caption-extractor` depends on `he` and
  `striptags`.
- The R2 bucket is `typestar-tracks`; create it once with `bun run tracks:bucket`
  (or `bunx wrangler r2 bucket create typestar-tracks`). `tracks:publish` uploads
  the pre-warmed seeds into it and needs Cloudflare credentials. A deploy fails
  if the bucket is missing, since `wrangler.jsonc` binds it.
- URL policy is `trailingSlash: "never"` + `build.format: "file"`. Output is
  `index.html` / `play.html` / etc.; canonical and sitemap URLs have no trailing
  slash. Active-nav logic in `Header.astro` normalises both `.html` and trailing
  slashes.
- The pretty `/play/<id>` route depends on the Worker rewrite; there is no
  Astro dynamic route. In dev the `devServer` plugin rewrites it.
- TypeScript is on 6.x: `astro check` refuses TypeScript 7 (`@astrojs/check` peer
  range is `^5.0.0 || ^6.0.0`). Do not bump to 7.
- The pretty 404 depends on `wrangler.jsonc` setting
  `assets.not_found_handling: "404-page"`.
- Icons are generated with the `favicons` package (`bun run icons`), not
  hand-made. `brand-mark.svg` is the source of truth.

## Removed from the b3 copy

The B3 game, its rules engine, the AI word-generation API (`/api/words`), the
Cloudflare Turnstile human check (`/api/session`), their tests and the `/rules`
page have all been deleted. `@astrojs/react` is kept for the game island.

## Design constraints (do not regress)

- The look is an **engineer's notebook**: ink (`--color-ink`), off-white paper
  (`--color-paper`) and electric yellow (`--color-yellow`).
- Type is **Space Grotesk** (display + body) + **Space Mono** (labels). Do not
  swap in other clients' pairings.
- Structural motifs: graph-paper grid on light sections, dot grid on dark ones,
  monospace `//` "comment" labels, the yellow `.mark` highlighter, hard offset
  shadows, and a black header with a permanent yellow rule.
- The marketing shell ships **no JavaScript**; React belongs on `/play` only.

## Deployment and handover

- Deployed as a **Cloudflare Worker with static assets** via Workers Builds
  (`bun run build` → `bunx wrangler deploy`), configured by `wrangler.jsonc`
  (`name: client-typestar-happypaul55-com`, `main: worker/index.ts`,
  `assets.directory: ./dist`, `assets.binding: ASSETS`,
  `r2_buckets: [{ binding: TRACKS, bucket_name: typestar-tracks }]`).
- `site` is `https://typestar.happypaul55.com`; keep `astro.config.mjs`,
  `settings.json.url` and `public/robots.txt` in step if the domain changes.
- Scores are local to the browser. A leaderboard is a future addition and would
  need a privacy-notice update.
- Keep `README.md` accurate for handover.
