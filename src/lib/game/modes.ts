/**
 * Play styles: how a track is played, independent of difficulty.
 *
 * - `type` — type the lyrics before their moment passes (the original game).
 * - `sing` — karaoke. When the track carries measured pitch (UltraStar) it is
 *   scored with the microphone against the note bars; otherwise it is a
 *   time-driven, unscored sing-along.
 *
 * The style is a property of the run, not of the track, so both are always
 * offered; what `sing` actually does is decided by {@link singBehavior}.
 */

import type { Track, TrackNote } from "../track/types";

export type PlayStyle = "type" | "sing";

export const PLAY_STYLES: PlayStyle[] = ["type", "sing"];

export const DEFAULT_PLAY_STYLE: PlayStyle = "type";

export function isPlayStyle(value: unknown): value is PlayStyle {
  return value === "type" || value === "sing";
}

export const PLAY_STYLE_LABEL: Record<PlayStyle, string> = {
  type: "Type",
  sing: "Sing",
};

export const PLAY_STYLE_HELP: Record<PlayStyle, string> = {
  type: "Type each word before its moment passes.",
  sing: "Follow the words and sing along — karaoke style.",
};

/** How a track is sung: scored against pitch data, or an unscored sing-along. */
export type SingBehavior = "scored" | "karaoke";

/** The notes that actually carry a measurable pitch (i.e. can be scored). */
function pitchedNotes(track: Pick<Track, "notes">): TrackNote[] {
  return (track.notes ?? []).filter((note) => note.pitch !== null);
}

/** Whether a track has notes we can score a singer against. */
export function trackCanSing(track: Pick<Track, "notes">): boolean {
  return pitchedNotes(track).length > 0;
}

/** What `sing` means for a track: an unscored karaoke or a scored performance. */
export function singBehavior(track: Pick<Track, "notes">): SingBehavior {
  return trackCanSing(track) ? "scored" : "karaoke";
}

/** The play styles offered for a track. Every track can be typed and sung. */
export function availablePlayStyles(_track: Pick<Track, "notes"> | null): PlayStyle[] {
  return [...PLAY_STYLES];
}
