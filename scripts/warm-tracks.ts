/**
 * Pre-warm the featured tracks.
 *
 * Runs from a residential connection, where the YouTube lookup is reliable
 * (~100%, versus ~70% from Cloudflare's edge), and writes each built track to
 * `public/tracks/<id>.json`. Those files are served as static assets and act as
 * a seed the API falls back to before a live lookup.
 *
 *   bun run tracks:warm            # warm the featured list (skips existing)
 *   bun run tracks:warm --force    # rebuild everything
 *   bun run tracks:warm DyDfgMOUjCI zsmUOdmm02A
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { FEATURED_TRACKS } from "../src/content/tracks/featured";
import { buildTrack } from "../src/lib/track/build";
import { fetchTrackSource } from "../src/lib/youtube-captions";

const OUTPUT_DIR = join(process.cwd(), "public", "tracks");
const LANG = "en";

const args = process.argv.slice(2);
const force = args.includes("--force");
const requested = args.filter((arg) => !arg.startsWith("-"));

const targets = requested.length
  ? requested.map((id) => FEATURED_TRACKS.find((track) => track.id === id) ?? { id, title: "", artist: "" })
  : FEATURED_TRACKS;

async function exists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function warm(id: string, title: string): Promise<void> {
  const path = join(OUTPUT_DIR, `${id}.json`);
  if (!force && (await exists(path))) {
    console.log(`· ${id}  cached, skipping`);
    return;
  }

  const source = await fetchTrackSource(id, LANG);
  const track = buildTrack({
    id,
    lang: LANG,
    title: source.title || title,
    description: source.description,
    subtitles: source.subtitles,
    json3: source.json3,
    captionKind: source.captionKind,
  });

  if (!track.words.length) {
    console.warn(`! ${id}  no usable captions (${source.title})`);
    return;
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path, JSON.stringify(track), "utf8");

  const last = track.words[track.words.length - 1];
  console.log(
    `✓ ${id}  ${track.words.length} words · ${track.lines.length} lines · ` +
      `${track.source.captions} · ends ${last.end.toFixed(1)}s\n  ${track.title}`,
  );
}

let failures = 0;
for (const target of targets) {
  try {
    await warm(target.id, target.title);
  } catch (error) {
    failures++;
    console.error(`✗ ${target.id}  ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures) process.exitCode = 1;
