# TypeStar

A browser game that is a bit like **Guitar Hero**, and a bit like a **touch
typing / keyboard speed game**.

- It uses **YouTube** as the music backend and the visuals.
- The video sits on the left and the timed lyrics on the right.
- Three modes: **Easy** (first letter of each word), **Normal** (every word,
  punctuation optional) and **Hard** (every word, punctuation required).
- Pick the mode on the start screen, or change it from the dropdown in the HUD.

It is an Astro site with a React game island, served as a Cloudflare Worker
with static assets, and it caches processed tracks in **R2**.

## How it works

1. You open `/play/<youtubeId>` (or paste a link on `/play`).
2. The page calls `GET /api/track/<youtubeId>`.
3. The Worker returns the track from **R2** if it is cached, otherwise it
   fetches the video's captions from YouTube with
   [`youtube-caption-extractor`](https://github.com/devhims/youtube-caption-extractor)
   (falling back to a third-party caption service if YouTube fails or returns
   nothing), builds a word-timed track, stores it in R2 and returns it.

Only playable tracks are cached. A failure to reach YouTube (rate limiting, bot
blocking, network) is never cached, so a transient upstream problem can't make a
track permanently unplayable.
4. The React island plays the video with the YouTube IFrame API and scores your
   typing against the caption timings.

Captions are line-level. TypeStar recovers **word-level timing** by parsing the
raw `json3` transcript (one word per event for auto-captions, per-segment
offsets where present) and otherwise shares a line's duration across its words.
It also keeps each caption's own line breaks, so the lyric highway reads the
same as the source captions. See `src/lib/track/parse.ts`.

> **Caption quality matters.** Human-written captions are clean; auto-generated
> ones can mis-hear sung lyrics. The featured tracks are pre-warmed, so they
> never need a live lookup.

## Local development

```bash
bun install
bun run dev      # dev server on http://localhost:4321
bun run build    # production build into dist/
bun run preview  # serve the built site
bun run check    # astro check — the type gate
bun test         # unit tests for the parser and the game engine
bun run icons    # regenerate public/icons from public/icons/brand-mark.svg
```

`astro dev` runs the real track handler through a Vite plugin (see
`astro.config.mjs`), using a filesystem cache in `.cache/` instead of R2, and
serves the bundled seeds in `public/tracks/`. The pretty `/play/<id>` URLs work
in dev too.

## Tracks

The featured list lives in `src/content/tracks/featured.ts`.

```bash
bun run tracks:warm      # fetch + build the featured tracks into public/tracks/
bun run tracks:bucket    # create the R2 bucket (once)
bun run tracks:publish   # upload public/tracks/*.json to the R2 bucket
```

`tracks:warm` should be run from a normal residential connection: YouTube gates
datacenter IPs, so the lookup is far more reliable locally than from Cloudflare's
edge (where it succeeds roughly 70% of the time, rising to ~97% with retries).
Pre-warmed tracks are bundled as static assets and are used as a seed before any
live lookup.

`tracks:bucket` and `tracks:publish` need Cloudflare credentials
(`wrangler login`, or `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`).

## API

| Route | Description |
| --- | --- |
| `GET /api/track/:id?lang=en` | Get-or-create a track. `422` when the video has no captions, `502` when YouTube is unreachable. |
| `/play?v=<id>` | `301` redirect to `/play/<id>`. |
| `/play/<id>` | Serves the static play page; the client reads the id from the path. |

Only `/api/*`, `/play` and `/play/*` run the Worker (`run_worker_first` in
`wrangler.jsonc`); everything else is served from the edge asset cache.

## Cloudflare

- **Workers + static assets** — hosting and routing.
- **R2** (`typestar-tracks`) — the processed-track cache.
- `nodejs_compat` is enabled because the captions library needs it.

Scores are local to the browser for now; a leaderboard (D1 or Durable Objects)
is a future addition and would need a privacy-notice update.

## Deployment

Deployed as a Cloudflare Worker with static assets via Workers Builds
(`bun run build` → `bunx wrangler deploy`), configured by `wrangler.jsonc`.

Keep `astro.config.mjs` (`site`), `src/content/site/settings.json` (`url`) and
`public/robots.txt` in step if the domain changes.

## Licence

AGPL-3.0. See [LICENSE](./LICENSE).
