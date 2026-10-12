# TypeStar

A browser game that is a bit like **Guitar Hero**, and a bit like a **touch
typing / keyboard speed game**.

- It uses **YouTube** as the music backend and the visuals.
- The video fills the stage and the game plays on top of it: the HUD sits along
  the top and the lyrics (or the singing pitch lane and lyrics) over the bottom,
  so the whole screen is the performance. When a local song has no video, its
  UltraStar `#BACKGROUND` image, or a plain dark backdrop, fills the stage
  instead.
- Three difficulties: **Easy** (first letter of each word), **Normal** (every
  word, punctuation optional) and **Hard** (every word, punctuation required).
  Defaults to **Normal**.
- Four run modes, shared by typing and scored singing: **Normal** (fails once
  the score drops below −150), **Instant** (fails on the first mistake — a wrong
  key, or a missed word/note), **Fun** (never stops) and **Practise** (rewinds 5
  seconds on a mistake, then ignores scoring for that replay and counts it).
  Defaults to **Fun**. Karaoke is unscored, so run modes do not apply there
  (the controls stay visible, but have no effect).
- Playback speed from **0.5×** to **1.5×**, applied to the YouTube player, so a
  fast song can be slowed down while learning it.
- Every song is rated **EASY**, **MEDIUM** or **HARD** from how fast its lyrics
  come (words per second, with long instrumental gaps capped at one second).
  The rating shows as a large chip beside the song header and as a badge on the
  featured cover art. It is a property of the song, separate from the difficulty
  setting above.
- A **Skip** tab appears under the intro cue when a song opens with more than
  two seconds of music, jumping to just before the first lyric.
- Scoring is **per keystroke**: each correct character is graded **Perfect /
  Great / Good** by how late it is (early is free), scaled by a combo multiplier
  up to ×3, with a bonus for every clean line. Wrong keys cost more than a
  missed word. Singing grades each note by how long it is held in tune, with a
  sustain bonus for long notes and an escalating golden-note chain.
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
- Play **from a URL**: paste a YouTube link, or a link to an **UltraStar**
  `.txt` chart anywhere on the web (GitHub `blob` links are rewritten to raw).
  TypeStar fetches and parses the chart on the server once, then streams its
  audio and any background video straight from the chart's own host — the media
  never passes through TypeStar. A chart's per-note pitch means it can be sung
  and scored, exactly like a local UltraStar song.
- **Sing** as well as type: choose a play style on the start screen. Every track
  can be sung. A local UltraStar chart, which carries per-note pitch, is scored
  with your microphone against the notes; YouTube and `.vtt` tracks play as an
  unscored karaoke sing-along.
- Pick the difficulty on the start screen; difficulty, run mode and playback
  speed are dropdowns in the HUD. While singing, difficulty is the pitch
  tolerance.
- Share a run: the difficulty, run mode and speed travel in the URL hash, so a
  friend opens the same track with exactly the same setup. Settings left at
  their defaults are omitted, so the common link has no hash at all.
- Accurate link previews: for a song already in the library, the play page's
  title, description and social tags name the song and use its cover art.
- **Optional accounts**: sign in with a one-time email link (no password) to
  keep an account across devices and claim a public handle. Signing in is
  optional — the game plays without one.
- **Leaderboards, profiles and challenges**: a signed-in run is verified
  server-side and ranked per song, style, difficulty, run mode and speed. There
  are public profiles (`/u/<handle>`), a recent-scores feed (`/recent`) and a
  daily/weekly challenge (`/challenge`).
- **Embeds**: any song can be dropped into a blog or forum as an `<iframe>`
  (`/embed/youtube/<id>`). Only the embed route may be framed; every other page
  stays unframeable.

It is an Astro site with a React game island, served as a Cloudflare Worker
with static assets, and it caches processed tracks in **R2**.

## How it works

1. You open `/play/youtube/<youtubeId>` or `/play/ultrastar/<songUrl>` (or paste
   a link on `/play`). If the song is already cached or seeded, the Worker serves
   the play page with the song's own title and social tags already in the HTML.
2. The page calls `GET /api/track/youtube/<youtubeId>` (or
   `GET /api/track/ultrastar?url=<songUrl>`).
3. The Worker returns the track from **R2** if it is cached, or from the bundled
   seed, so songs already in the library play with no check. Otherwise it asks
   for a Cloudflare **Turnstile** human check, then:
   - for a YouTube video, fetches its captions from YouTube with
     [`youtube-caption-extractor`](https://github.com/devhims/youtube-caption-extractor)
     (falling back to a third-party caption service if YouTube fails or returns
     nothing);
   - for an UltraStar URL, fetches the `.txt` chart (http/https only, private
     hosts refused, size- and time-capped) and parses it;

   builds a word-timed track, stores it in R2 and returns it.

Only playable tracks are cached. A failure to reach the upstream source (rate
limiting, bot blocking, network) is never cached, so a transient problem can't
make a track permanently unplayable.
4. The React island plays the video with the YouTube IFrame API (or the audio,
   with any background video, from the chart's own host) and scores your typing
   against the timings.

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
bun test         # unit tests: parser, game engine, ratings, track cache and accounts
bun run icons    # regenerate public/icons from public/icons/brand-mark.svg
```

`astro dev` runs the real track handler through a Vite plugin (see
`astro.config.mjs`), using a filesystem cache in `.cache/` instead of R2, and
serves the bundled seeds in `public/tracks/`. The pretty `/play/youtube/<id>`,
`/play/ultrastar/<url>` and `/play/local` URLs work in dev too; the legacy
`/play/<id>` redirects to its typed form. It also runs the real Better Auth
handler for `/api/auth/*` against a file-backed SQLite database in
`.cache/auth.sqlite`, **logging the sign-in link to the console** instead of
emailing it (there is no D1 locally).

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
bun run tracks:warm           # fetch + build the featured tracks into public/tracks/
bun run tracks:bucket         # create the production R2 bucket (once)
bun run tracks:bucket:preview # create the preview R2 bucket (once)
bun run tracks:publish        # upload public/tracks/*.json to the R2 bucket
bun run tracks:purge          # delete the cached tracks from R2 (needs an API token)
```

Accounts have their own one-time setup:

```bash
bun run auth:schema           # regenerate migrations/0001_auth.sql from the config
bun run db:create             # create the production D1 database (once)
bun run db:create:preview     # create the preview D1 database (once)
bun run db:migrate            # apply the auth schema to D1 (needs credentials)
bun run db:migrate:preview    # apply it to the preview database
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
  [UltraStar format](https://github.com/UltraStar-Deluxe/format). Its `#AUDIO`
  header (or the classic `#MP3`) names the audio (and an optional `#VIDEO`
  background, plus an optional
  `#COVER` image shown on the song's card). Because
  UltraStar times every syllable, the words line up exactly with the music
  rather than being estimated. Syllables are merged into whole words using the
  format's leading-space and `~` rules; `-` markers (or, when absent, musical
  gaps) define the lines. Each note's pitch is kept too, so the chart can be
  **sung and scored** (see Singing below). If the chart has a video it plays
  behind the lyrics, kept in step with the audio and offset by `#VIDEOGAP`; if
  not, the lyric highway fills the width.
- **Video + WebVTT** — a video file and a same-named `.vtt` caption file,
  matched case-insensitively (`song.mp4` with `song.vtt`).

Folders are remembered (their handles are kept in IndexedDB) and can be added
to with **Add another folder**; read permission is re-requested on the next
visit. The header shows how many folders are loaded — hover it for the list. A
footer lists each folder with the number of songs it contributes, and clicking
a folder name removes it. Songs are shown as cards like the featured ones, with
the UltraStar `#COVER` (or a plain placeholder) as their art.
Selecting a song puts its folder and relative path in the URL
(`/play/local?file=Album/song.txt`), so the browser's Back button returns to the
picker and a song can be bookmarked — reopening the link needs the folders to
still be remembered and their permission granted. Nothing is uploaded: the audio
or video plays from a local object URL, and the lyrics are parsed in the browser
into the same word-timed track shape as a YouTube song, so the game, scoring and
ratings all work unchanged. WebVTT inline word timestamps (`<00:00:05.000>`) are
honoured where a caption file provides them. If the browser has no
`showDirectoryPicker`, the picker shows a short notice in place of the button.

## Songs from a URL

Beyond the featured YouTube tracks, you can paste any of:

- a YouTube link or 11-character video id;
- an **UltraStar** `.txt` chart URL (for example a raw GitHub link). A GitHub
  `blob` link is rewritten to its `raw.githubusercontent.com` form automatically.

A YouTube song is timed from its captions. An UltraStar chart is fetched once by
the Worker, parsed into the same word-timed track shape (with per-note pitch, so
it can be scored when sung) and cached in R2 under a hash of its URL. Its `#AUDIO`
(or classic `#MP3`) audio, `#VIDEO` background, `#BACKGROUND` image and `#COVER`
art are resolved
against the chart's own URL and streamed by the browser **directly from that
host** — TypeStar never proxies the media. The first time a song is requested it
goes through the same one-off Turnstile human check as a new YouTube video.

Because the chart URL is user-supplied, the server only fetches `http(s)` URLs,
refuses private/loopback hosts and IP literals, follows at most three redirects
(re-checking each), and caps the response size and time. `media-src` and
`img-src` in `public/_headers` allow `https:` so the hotlinked media can load.

## Accounts

Playing never requires an account. Signing in is optional and exists to keep an
account across devices (and to claim a public handle for the planned
leaderboard).

- **Sign in with a link.** Enter your email on `/signin` and we send a one-time
  sign-in link; there is no password. The link expires after 15 minutes and can
  be used once. New emails become an account the first time a link is used.
- **Your account** (`/account`) shows your email and member-since date, lets you
  choose a **handle** (your public name), sign out, and delete the account and
  everything stored with it.
- **Built on [Better Auth](https://better-auth.com/).** Better Auth 1.5+ speaks
  Cloudflare **D1** natively (`database: env.DB`), so no separate ORM is needed.
  The instance is built once per Worker isolate with a **dynamic base URL**, so
  branch previews authenticate against themselves. OAuth is a later addition:
  Better Auth already records a linked `account` row per provider, so adding a
  provider is a config change, not a migration.
- **Sign-in emails** go through Cloudflare **Email Sending** (the `send_email`
  binding) — no third-party email service or API key.
- **The magic-link request is gated by Turnstile** (action `auth`), like a new
  track, so the endpoint cannot be used to spray emails.
- **In development** there is no D1, so `astro dev` uses a file-backed
  `node:sqlite` database (`.cache/auth.sqlite`) and prints the sign-in link to
  the console instead of emailing it.

The auth module lives in `src/lib/auth/`: `server.ts` (the instance),
`client.ts` (the browser client), `email.ts` (the magic-link email),
`validate.ts` (handle and email rules) and `dev.ts` (the dev database). The
schema is `migrations/0001_auth.sql`, generated from the config by
`bun run auth:schema`.

## Scores and leaderboards

Playing without an account keeps your scores in your browser. Sign in and a
scored run is verified and saved, then ranked.

- **Verified server-side.** The browser records the run's inputs (keystrokes or
  pitch samples, with timings) and submits them with a server-issued **nonce**.
  The server replays them against the song's own timings, through the same pure
  engines the game uses, to derive the score — the score is never trusted from
  the client. The recording is then discarded; only the result is stored.
- **Invalid runs are kept, not rejected.** A submission that fails its integrity
  check is stored with `valid = 0` and a reason (`invalid-checksum`, …), and
  simply left off the boards.
- **Boards are per mode.** A board is keyed by song + style (typing or singing)
  + difficulty + run mode + speed, so typing and singing are never compared.
- **Pages.** `/u/<handle>` is a public profile, `/recent` is the recent-scores
  feed, and `/challenge` is the daily and weekly challenge (one seeded song and
  one modifier per period, with its own boards). A song's board appears after a
  run and on a player's profile; a browsable index of songs is a future release.
- **Where it lives.** `src/lib/score/`: `api.ts` (the handlers), `replay.ts` (the
  server re-score), `nonce.ts` (the signed run token), `timeline.ts` (the
  recorded events), `challenge.ts` (the period's song and modifier), `store.ts`
  (D1) and `dev-store.ts` (dev SQLite). The `score` table is
  `migrations/0002_scores.sql`.

## Embeds

Any song can be embedded in a blog or forum:

```html
<iframe
  src="https://typestar.happypaul55.com/embed/youtube/<id>"
  width="640"
  height="360"
  style="border: 0; max-width: 100%"
  allow="autoplay; fullscreen; microphone"
  loading="lazy"
  title="TypeStar"
></iframe>
```

- The **Embed** button on a song's page copies that snippet.
- The embed is the game in a compact frame: the start screen waits for a click,
  then you type as usual. It loads no accounts and no scores.
- **Only `/embed/*` may be framed.** The global CSP sets `frame-ancestors 'none'`;
  the embed re-declares it with `frame-ancestors *`. `X-Frame-Options` is no
  longer set — CSP `frame-ancestors` is the modern control, and it can be
  overridden per path.
- A brand-new song still gets the Turnstile human check, inside the iframe.
- Singing needs the embedder to add `allow="microphone"`; without it the run
  falls back to karaoke.

## Singing

The start screen offers two play styles: **Type** (the game above) and **Sing**.
Both are available on every track; what Sing does is decided by the track's data.

- **Scored singing** — a local UltraStar chart carries a pitch for every note, so
  Sing shows a **pitch highway** (note bars against a fixed now line, with a live
  cursor for the note you are singing) and scores you with the **microphone**.
  Difficulty sets the pitch tolerance (Easy is forgiving, Hard is strict), the
  pitch comparison ignores octaves (so singing an octave out is not penalised,
  following the format), rap notes are graded on presence rather than pitch and
  golden notes score double. The results screen reports pitch accuracy and notes
  hit, with a local best per track and difficulty.
- **Karaoke** — YouTube captions and local `.vtt` files have no pitch, so Sing is
  an unscored sing-along: the active line and word follow the music and a light
  summary replaces the results screen.

The microphone is used **only** for scored singing, and only after you allow it.
The audio never leaves the device — it is analysed frame by frame in the browser
for its pitch and then discarded (see `src/lib/game/pitch.ts`). If you decline the
microphone, a scored song falls back to the unscored karaoke sing-along.

## Run modes

A run mode decides how a run ends. It is available for **typing** and **scored
singing** alike, and the two engines share the same constants and semantics
(`src/lib/game/engine.ts` and `src/lib/game/sing.ts`) so a mode behaves the same
in both:

| Run mode | Behaviour |
| --- | --- |
| **Normal** | Fails once the score drops below −150. |
| **Instant** | Fails on the first mistake — a wrong key when typing, or a missed note when singing. |
| **Fun** | Never fails; play to the end. |
| **Practise** | Rewinds 5 seconds on a mistake, then ignores scoring for that replay and counts it. |

In the failing modes (Normal and Instant), a run also ends after **20 misses in a
row** — twenty words let past while typing, or twenty notes missed while singing.
Fun and Practise never fail this way.

Karaoke is unscored, so the run-mode choice has no effect there — the game bar
stays the same in every mode.

## API

| Route | Description |
| --- | --- |
| `GET /api/track/youtube/:id?lang=en` | Get-or-create a YouTube track. `422` when the video has no captions, `502` when YouTube is unreachable. |
| `/api/auth/*` | Better Auth: email magic-link sign-in, session, sign-out and account management. |
| `/api/scores/*` | Run nonces, run submission (replayed server-side and stored), leaderboards, recent scores, profiles and the challenge. |
| `GET /api/track/ultrastar?url=:url&lang=en` | Get-or-create an UltraStar track from a chart URL. `422` when the chart has no lyrics or no audio. |
| `GET /api/track/:id?lang=en` | Legacy YouTube path, still supported. |
| `/play?v=<id>` | `301` redirect to `/play/youtube/<id>`. |
| `/play/<id>` | `301` redirect to `/play/youtube/<id>` (legacy). |
| `/play/youtube/<id>` | Serves the play page; its title and social tags name the song when it is already cached or seeded, otherwise the generic page is served. |
| `/play/ultrastar/<url>` | The same, for a chart fetched from a URL. |
| `/play/local` | Serves the play page for the in-browser local-file picker (no server involvement). |

Only `/api/*`, `/play` and `/play/*` run the Worker (`run_worker_first` in
`wrangler.jsonc`); everything else is served from the edge asset cache.

## Cloudflare

- **Workers + static assets** — hosting and routing.
- **R2** (`typestar-tracks`) — the production processed-track cache; branch
  previews use a separate `typestar-tracks-preview` bucket.
- **D1** (`typestar-auth`) — accounts (users, sessions, accounts and the
  short-lived magic-link verification records) and the recorded scores. Branch
  previews use `typestar-auth-preview`.
- **Email Sending** — delivers sign-in links through the `send_email` binding;
  the sending domain must be onboarded first.
- `nodejs_compat` is enabled because the captions library needs it (and Better
  Auth uses `AsyncLocalStorage`).

Scores are still local to the browser; a leaderboard is a future addition and
will build on the accounts above (the `user.handle` is already reserved for it).

## Deployment

Deployed as a Cloudflare Worker with static assets via Workers Builds
(`bun run build` → `bunx wrangler deploy`), configured by `wrangler.jsonc`.

Accounts need three things set up once:

1. **Create the D1 databases** and paste the printed ids into `wrangler.jsonc`:
   `bun run db:create` (production) and `bun run db:create:preview`. Then apply
   the schema with `bun run db:migrate` / `bun run db:migrate:preview`.
2. **Set the Better Auth secret** (≥32 characters) as a Worker secret:
   `bunx wrangler secret put BETTER_AUTH_SECRET`.
3. **Onboard the sending domain** to Email Sending so the `EMAIL` binding can
   deliver sign-in links:
   `bunx wrangler email sending enable typestar.happypaul55.com`.

Keep `astro.config.mjs` (`site`), `src/content/site/settings.json` (`url`) and
`public/robots.txt` in step if the domain changes.

### Branch previews

Pushes to any branch other than `main` build a **Worker Preview**
(`bunx wrangler preview`) under the same Worker, so a branch can be reviewed
before it lands. Each branch is served from
`https://<branch>.typestar.happypaul55.com`.

Production is the apex custom domain and previews are its subdomains, which
needs setting up once in the Cloudflare dashboard:

1. **Create the preview bucket** once: `bun run tracks:bucket:preview`.
   Wrangler only *binds* a bucket, it never creates one, so until it exists a
   preview build fails with `R2 bucket 'typestar-tracks-preview' not found`
   (code 10085).
2. **Enable preview builds.** Worker → **Settings** → **Build** →
   **Branch control** → tick **Enable Preview Builds**, and confirm the
   **Preview command** is `bunx wrangler preview`. The production **deploy
   command** stays `bunx wrangler deploy`.
3. **Serve previews on the subdomains.** Worker → **Domains** → the
   `typestar.happypaul55.com` custom domain → set **Enable for** to
   **Production and Preview**. Cloudflare then serves every Preview as
   `<branch>.typestar.happypaul55.com` and issues the wildcard certificate.
   (If the Worker is still on the older Version URL preview model, the
   **Set up Worker Previews** banner switches it — the switch cannot be undone.)
4. **Give previews their secrets.** Previews do not inherit production settings,
   and secrets cannot live in `wrangler.jsonc`. Set `TURNSTILE_SECRET` **and
   `BETTER_AUTH_SECRET`** in the Previews Base configuration so the human check
   and sign-in still work on previews:
   `bunx wrangler preview base-config secret put TURNSTILE_SECRET` and
   `bunx wrangler preview base-config secret put BETTER_AUTH_SECRET`
   (secrets added there are copied only to *new* previews).

`previews` in `wrangler.jsonc` repeats the vars (`CAPTION_FALLBACK_URL`,
`TURNSTILE_HOSTNAMES`, `AUTH_EMAIL_FROM`) and points the `TRACKS` binding at
`typestar-tracks-preview` and the `DB` binding at `typestar-auth-preview`, so a
branch can fetch and cache new songs and create accounts without writing into
the production data. `TURNSTILE_HOSTNAMES` only lists the apex
domain: a Turnstile token is accepted for a listed hostname **and its
subdomains**, matching how the widget's own hostname allowlist behaves, so no
per-branch entry is needed. Featured seeds are bundled with every build
(`public/tracks/`), so previews still play them with an empty bucket.

Two things worth knowing:

- Preview URLs are public by default and, unlike `workers.dev` previews, custom
  domain previews are **not** given an automatic `X-Robots-Tag: noindex`. Add
  that header with a Transform Rule for `*.typestar.happypaul55.com`, or protect
  the previews with Cloudflare Access.
- Every page still declares `site` (`https://typestar.happypaul55.com`), so a
  preview's canonical and social URLs point at production. That is intentional —
  previews should not compete with production in search.

## Licence

AGPL-3.0. See [LICENSE](./LICENSE).
