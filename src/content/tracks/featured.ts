/**
 * The featured tracks shown on `/play`.
 *
 * These are pre-warmed into `public/tracks/<id>.json` (and optionally R2) by
 * `bun run tracks:warm`, so the first play is instant and reliable even when
 * YouTube's bot-gating makes a live lookup fail. Any other YouTube URL still
 * works through the on-demand API.
 */

export interface FeaturedTrack {
  id: string;
  title: string;
  artist: string;
}

export const FEATURED_TRACKS: FeaturedTrack[] = [
  { id: "zsmUOdmm02A", title: "True Love", artist: "P!nk feat. Lily Allen" },
  { id: "DyDfgMOUjCI", title: "bad guy", artist: "Billie Eilish" },
  { id: "VQeW62X8rEA", title: "Green Green Grass", artist: "George Ezra" },
  { id: "E597VdaKg1A", title: "Ya Ya Ya", artist: "JONAS LOVV" },
];

export const FEATURED_BY_ID = new Map(FEATURED_TRACKS.map((track) => [track.id, track]));
