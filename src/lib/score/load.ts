/**
 * Load a track by its namespaced id, for the server-side replay.
 *
 * The id (`youtube-<videoId>` or `ultrastar-<hash>`) maps straight onto the
 * cache key, so the server reads the same processed track the player did —
 * never a copy sent by the client.
 */

import { TRACK_VERSION, type Track } from "../track/types";
import type { TrackStore } from "../track/store";
import { parseTrack } from "../track/validate";

const YOUTUBE_PREFIX = "youtube-";
const ULTRASTAR_PREFIX = "ultrastar-";

/** The cache key for a namespaced track id, or `null` when it is not one. */
function cacheKeyFromTrackId(id: string, lang = "en"): string | null {
  if (id.startsWith(YOUTUBE_PREFIX)) {
    return `tracks/v${TRACK_VERSION}/youtube/${id.slice(YOUTUBE_PREFIX.length)}/${lang}.json`;
  }
  if (id.startsWith(ULTRASTAR_PREFIX)) {
    return `tracks/v${TRACK_VERSION}/ultrastar/${id.slice(ULTRASTAR_PREFIX.length)}/${lang}.json`;
  }
  return null;
}

/** The bundled-seed file id for a namespaced track id, or `null`. */
function seedIdFromTrackId(id: string): string | null {
  if (id.startsWith(YOUTUBE_PREFIX)) return id.slice(YOUTUBE_PREFIX.length);
  if (id.startsWith(ULTRASTAR_PREFIX)) return id;
  return null;
}

/** The cache key + seed id, or `null` when the id is not a playable track id. */
function trackRefFromId(
  id: string,
  lang = "en",
): { key: string; seedId: string } | null {
  const key = cacheKeyFromTrackId(id, lang);
  const seedId = seedIdFromTrackId(id);
  return key && seedId ? { key, seedId } : null;
}

/** Read a track from the cache or the bundled seed. */
export async function loadTrackById(
  id: string,
  env: {
    store: TrackStore;
    seed?: (seedId: string, lang: string) => Promise<string | null>;
  },
  lang = "en",
): Promise<Track | null> {
  const ref = trackRefFromId(id, lang);
  if (!ref) return null;

  const cached = await env.store.get(ref.key);
  const track = cached ? parseTrack(cached) : null;
  if (track) return track;

  if (env.seed) {
    const seeded = await env.seed(ref.seedId, lang).catch(() => null);
    const seededTrack = seeded ? parseTrack(seeded) : null;
    if (seededTrack) return seededTrack;
  }
  return null;
}
