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
   seed in `public/tracks/<id>.json`. If it is in neither, the request must carry
   a valid **Turnstile** token: the client shows the Cloudflare widget, and the
   Worker verifies the token with siteverify before it fetches the video's
   captions with `youtube-caption-extractor` (falling back to the
   `CAPTION_FALLBACK_URL` service when YouTube fails or returns nothing), builds a
   word-timed track, caches it in R2 and returns it. Cached and seeded tracks
   never see the check, so the widget only appears for a genuinely new song. Only
   playable tracks are cached — an upstream failure or an empty result is never
   written, so a transient YouTube block cannot poison the cache.
3. The React island plays the video with the YouTube IFrame API and scores
   typing against the caption timings.

Three difficulty modes: **easy** (first letter only), **normal** (whole word,
punctuation optional) and **hard** (whole word, punctuation required). Four run
modes, independent of difficulty: **normal** (fails once the score drops below
-150), **instant** (stops on the first mistake), **fun** (never fails) and
**practise** (rewinds 5 seconds on a mistake, then ignores scoring for that
replay and counts it). The defaults are difficulty **normal**, run mode **fun**
and playback speed **1**. The HUD also carries a **Speed** dropdown (0.5× to
1.5×) applied to the YouTube player via `setPlaybackRate`. Scoring
rewards chains with combo tiers and a perfect-line bonus. Typing is forgiving:
when a keystroke cannot continue the current word but does begin a later word it
skips ahead — the words passed over are marked missed (a small penalty, and the
chain breaks) and play continues. The search covers the rest of the current
line, then the first word of the next line, so skipping the tail of a word — or
moving on to the next line — does not trap the player. The line boundaries are forgiving too: in the
gap between one line and the next (and the intro) the last word of a line stays
typeable and the first word of the next opens early, each by up to one second
(`LINE_CATCH_UP` / `LINE_HEAD_START` in `engine.ts`), so a player can catch up or
get a head start instead of waiting on dead air. Only the line timings are real —
a line's internal word times are shared out by length — so a whole line opens
together and a player who races ahead is never blocked part-way through it.
Feedback is part of the feel: perfect lines and combo milestones flash on screen
(small at 10/25, medium every 100, large every 500) and every wrong key plays a
short blip. The difficulty is
chosen on the start screen; both difficulty and run mode are dropdowns in the
HUD, and both persist locally. The end screen shows the score, rank, how far
through the song you got, fun stats and a local personal best per track +
difficulty + run mode. The page title and header show the loaded song.

Settings travel in the URL hash so a run can be shared:
`/play/<id>#difficulty=hard&run=practise&speed=1.25`. Values left at their
defaults are omitted, so the common link has no hash. `src/lib/game/url.ts`
builds and parses it, and the end screen has a Share button. Only the setup is
shared, not the score or results.

Each song is also rated **easy**, **medium** or **hard** from its lyrics'
words-per-second pace (`src/lib/track/rating.ts`), with long instrumental gaps
capped at one second so a quiet break cannot make a busy song look easy. The
rating is a property of the song, independent of the difficulty setting: it
shows as a chip beside the play header and as a badge on the featured cards
(rated at build time from the pre-warmed seeds via `src/lib/track/seed.ts`).
During a long intro a small **Skip** tab hangs under the cue bar and jumps to
1.5 seconds before the first lyric; it is hidden when the intro is under two
seconds (`skipIntroTarget` in `engine.ts`).

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
bun run tracks:purge    # delete the cached tracks from R2 (needs an API token)
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
- `src/lib/track/**` — track types, caption parsing, build, validation, the
  song rating (`rating.ts`), the build-time seed reader (`seed.ts`) and the
  cache abstraction. Pure and tested (the seed reader is server-only).
- `src/lib/game/**` — the pure game engine, browser client, audio helpers and
  storage.
- `src/lib/game/audio.ts` + `public/audio/` — preloaded sound effects (the
  wrong-key blip). Voices are pooled and throttled so rapid repeats overlap
  without machine-gunning. `public/audio/error.mp3` is the shipped sound.
- `src/lib/tracks-api.ts` — the shared get-or-create handler (Worker + dev),
  including the Turnstile gate (`verifyTurnstile`) that only runs on a cache and
  seed miss.
- `src/lib/game/turnstile.ts` + `src/components/game/TurnstileChallenge.tsx` —
  the public sitekey and the on-demand widget shown for a new song.
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
- `public/_headers` — CSP. YouTube and `challenges.cloudflare.com` (Turnstile)
  are allowed for `script-src` and `frame-src`; YouTube is allowed for `img-src`.
- `src/components/ui/Mark.astro` + `public/icons/brand-mark.svg` — the **TS**
  tile. `bun run icons` regenerates the icon set.
- `public/og-image.png` — the 1200×630 social card referenced by `Seo.astro`.
  Its source layout is `scripts/og-card.html`, rendered in a browser at
  1200×630 with the self-hosted fonts (a designed asset, not built).
- `.github/workflows/ci.yml` — CI runs `check`, `test` and `build` on pushes
  and pull requests.

## Gotchas

- **Captions, not audio.** There is no `yt-dlp`, Whisper or AI. Tracks are built
  from YouTube's captions. Human captions are clean; auto-captions can mis-hear
  sung lyrics. Featured tracks are pre-warmed from a residential connection.
- **YouTube egress is unreliable from Workers** (~70% per request; ~97% with
  retries). R2 caching plus the bundled seed is what makes the game reliable.
- **Turnstile guards new tracks only.** `TURNSTILE_SECRET` is a Worker secret;
  `TURNSTILE_HOSTNAMES` is a var (see `wrangler.jsonc`). The client sitekey is
  public (`PUBLIC_TURNSTILE_SITEKEY`, falling back to the constant in
  `src/lib/game/turnstile.ts`). The widget's domain list must include the site
  hostname or it will not render. The browser sends the token in the
  `x-turnstile-token` header; the gate is skipped entirely when no secret is
  configured (so local dev needs no setup). To exercise it locally, put
  Cloudflare's test keys in `.env*` (see README).
- `nodejs_compat` is required: `youtube-caption-extractor` depends on `he` and
  `striptags`.
- The R2 bucket is `typestar-tracks`; create it once with `bun run tracks:bucket`
  (or `bunx wrangler r2 bucket create typestar-tracks`). `tracks:publish` uploads
  the pre-warmed seeds into it and needs Cloudflare credentials. A deploy fails
  if the bucket is missing, since `wrangler.jsonc` binds it.
- **Changing the track format is a breaking change.** The cache is keyed by
  `tracks/<id>/<lang>.json`, and `tracks:publish` only adds or overwrites — it
  never removes stale objects. If you change the built track shape, you must
  bump `TRACK_VERSION` (so `isTrack` rejects the old objects) **and** purge the
  `tracks/` prefix in R2 (`bun run tracks:purge`) before republishing, otherwise
  the deployed Worker keeps serving the old format. Avoid format changes unless
  necessary.
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
