/**
 * Build-time helper: rate the pre-warmed seed tracks.
 *
 * The featured cards on `/play` show a rating badge, but the picker never loads
 * a track's full JSON (that only happens once a song is opened). So the page
 * reads the committed seeds from disk while it is being built and hands the
 * resulting `id -> rating` map to the island as a prop.
 *
 * Server-only: this touches the filesystem and must never be imported by the
 * React island (or anything else that ships to the browser).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ratingOf, type TrackRating } from "./rating";
import type { Track } from "./types";

const TRACKS_DIR = join(process.cwd(), "public", "tracks");

/** Rate each id from its seed file, skipping anything missing or unreadable. */
export function loadSeedRatings(
  ids: readonly string[],
): Record<string, TrackRating> {
  const ratings: Record<string, TrackRating> = {};
  for (const id of ids) {
    try {
      const raw = readFileSync(join(TRACKS_DIR, `${id}.json`), "utf8");
      const track = JSON.parse(raw) as Track;
      if (Array.isArray(track.words) && track.words.length) {
        ratings[id] = ratingOf(track);
      }
    } catch {
      // A missing or malformed seed just means no badge for that track.
    }
  }
  return ratings;
}
