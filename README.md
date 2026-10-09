# TypeStar

A browser game that is a bit like **Guitar Hero**, and a bit like a **touch
typing / keyboard speed game**.

- It uses **YouTube** as the music backend and the visuals.
- The video sits on the left and the timed lyrics on the right.
- Three difficulties: **Easy** (first letter of each word), **Normal** (every
  word, punctuation optional) and **Hard** (every word, punctuation required).
  Defaults to **Normal**.
- Four run modes: **Normal** (fails once the score drops below −150),
  **Instant** (stops at the first mistake), **Fun** (never stops) and
  **Practise** (rewinds 5 seconds on a mistake, then ignores scoring for that
  replay and counts it). Defaults to **Fun**.
- Playback speed from **0.5×** to **1.5×**, applied to the YouTube player, so a
  fast song can be slowed down while learning it.
- Every song is rated **EASY**, **MEDIUM** or **HARD** from how fast its lyrics
  come (words per second, with long instrumental gaps capped at one second).
  The rating shows as a large chip beside the song header and as a badge on the
  featured cover art. It is a property of the song, separate from the difficulty
  setting above.
- A **Skip** tab appears under the intro cue when a song opens with more than
  two seconds of music, jumping to just before the first lyric.
- Scoring rewards chains: a combo multiplier up to ×3 and a bonus for every
  clean line. Wrong keys cost more than a missed word.
- Typing is forgiving: if you start a later word (say “stra to love” for
  “strangers to love”), the game skips the words you passed over, counts them
  missed and carries on instead of holding you on the old word. A key that isn't
  on the current line but begins the next line is read as moving on to it.
- Line boundaries are forgiving too: across the gap between one line and the
  next (and the intro), the last word stays open and the next line's first word
  opens early — up to one second each way — so you can catch up or get a head
  start rather than staring at dead air.
- Word timing inside a line is only estimated, so a whole line opens at once:
  race ahead and the game won't stop you part-way through a line.
- It makes a fuss: a yellow flash for a perfect line and for combo milestones
  (10, 25, then every 100, with bigger ones every 500), plus a short blip on
  every wrong key.
- New songs get a one-off Cloudflare **Turnstile** human check the first time
  they are requested; songs already in the library play straight away.
- Play **local files**: in a browser with the File System Access API, point
  TypeStar at a folder of **UltraStar** songs or videos with matching `.vtt`
  captions and play them from disk — nothing is uploaded.
- Pick the difficulty on the start screen; difficulty, run mode and playback
  speed are dropdowns in the HUD.
- Share a run: the difficulty, run mode and speed travel in the URL hash, so a
  friend opens the same track with exactly the same setup. Settings left at
  their defaults are omitted, so the common link has no hash at all.
- Accurate link previews: for a song already in the library, the play page's
  title, description and social tags name the song and use its cover art.

It is an Astro site with a React game island, served as a Cloudflare Worker
with static assets, and it caches processed tracks in **R2**.

## How it works

1. You open `/play/<youtubeId>` (or paste a link on `/play`). If the song is
   already cached or seeded, the Worker serves the play page with the song's own
   title and social tags already in the HTML.
2. The page calls `GET /api/track/<youtubeId>`.
3. The Worker returns the track from **R2** if it is cached, or from the bundled
   seed, so songs already in the library play with no check. Otherwise it asks
   for a Cloudflare **Turnstile** human check, then fetches the video's captions
   from YouTube with
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
bun test         # unit tests: parser, game engine, ratings and track cache
bun run icons    # regenerate public/icons from public/icons/brand-mark.svg
```

`astro dev` runs the real track handler through a Vite plugin (see
`astro.config.mjs`), using a filesystem cache in `.cache/` instead of R2, and
serves the bundled seeds in `public/tracks/`. The pretty `/play/<id>` URLs work
in dev too.

`public/og-image.png` is the 1200×630 social card used by the Open Graph and
Twitter tags. It is a committed design asset: its source layout is
`scripts/og-card.html`, rendered at a 1200×630 viewport with the self-hosted
fonts, so the build needs no image tooling.

The Turnstile check is skipped in dev unless you provide keys. To exercise it,
put Cloudflare's documented **test** keys in a git-ignored `.env.local` (or
`.env`):

```dotenv
PUBLIC_TURNSTILE_SITEKEY=1x00000000000000000000AA
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
TURNSTILE_HOSTNAMES=localhost,127.0.0.1
```

Then open a song that is not in `public/tracks/` or `.cache/tracks/`.

## Tracks

The featured list lives in `src/content/tracks/featured.ts`. Each song's
EASY/MEDIUM/HARD rating is derived from the built track's word timing
(`src/lib/track/rating.ts`); the featured cards are rated at build time from
the pre-warmed seeds in `public/tracks/`.

```bash
bun run tracks:warm      # fetch + build the featured tracks into public/tracks/
bun run tracks:bucket    # create the R2 bucket (once)
bun run tracks:publish   # upload public/tracks/*.json to the R2 bucket
bun run tracks:purge     # delete the cached tracks from R2 (needs an API token)
```

`tracks:warm` should be run from a normal residential connection: YouTube gates
datacenter IPs, so the lookup is far more reliable locally than from Cloudflare's
edge (where it succeeds roughly 70% of the time, rising to ~97% with retries).
Pre-warmed tracks are bundled as static assets and are used as a seed before any
live lookup.

`tracks:bucket` and `tracks:publish` need Cloudflare credentials
(`wrangler login`, or `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`).

## Local files

In a browser that supports the File System Access API (Chromium-based), the
picker on `/play` offers **Open local files** (`/play/local`). It scans the
chosen folders (up to four deep each) and finds two kinds of song:

- **UltraStar** charts — a `.txt` file in the
  [UltraStar format](https://github.com/UltraStar-Deluxe/format). Its `#MP3`
  header names the audio (and an optional `#VIDEO` background). Because
  UltraStar times every syllable, the words line up exactly with the music
  rather than being estimated. Syllables are merged into whole words using the
  format's leading-space and `~` rules; `-` markers (or, when absent, musical
  gaps) define the lines. If the chart has a video it plays behind the lyrics,
  kept in step with the audio and offset by `#VIDEOGAP`; if not, the lyric
  highway fills the width.
- **Video + WebVTT** — a video file and a same-named `.vtt` caption file,
  matched case-insensitively (`song.mp4` with `song.vtt`).

Folders are remembered (their handles are kept in IndexedDB) and can be added
to with **Add another folder**; read permission is re-requested on the next
visit. The header shows how many folders are loaded — hover it for the list. A
footer lists each folder with the number of songs it contributes, and clicking
a folder name removes it.
Selecting a song puts its folder and relative path in the URL
(`/play/local?file=Album/song.txt`), so the browser's Back button returns to the
picker and a song can be bookmarked — reopening the link needs the folders to
still be remembered and their permission granted. Nothing is uploaded: the audio
or video plays from a local object URL, and the lyrics are parsed in the browser
into the same word-timed track shape as a YouTube song, so the game, scoring and
ratings all work unchanged. WebVTT inline word timestamps (`<00:00:05.000>`) are
honoured where a caption file provides them. If the browser has no
`showDirectoryPicker`, the picker shows a short notice in place of the button.

## API

| Route | Description |
| --- | --- |
| `GET /api/track/:id?lang=en` | Get-or-create a track. `422` when the video has no captions, `502` when YouTube is unreachable. |
| `/play?v=<id>` | `301` redirect to `/play/<id>`. |
| `/play/<id>` | Serves the play page; its title and social tags name the song when it is already cached or seeded, otherwise the generic page is served. |
| `/play/local` | Serves the play page for the in-browser local-file picker (no server involvement). |

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
