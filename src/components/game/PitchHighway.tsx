/**
 * The pitch highway: the singing counterpart of the lyric highway.
 *
 * Notes are drawn as bars positioned by pitch (vertical) and time (horizontal),
 * scrolling past a fixed "now" line. The singer's detected pitch is a live
 * cursor, so they can see how close they are. Only the window around the
 * playhead is drawn, so a long song stays cheap.
 */

import { memo } from "react";
import type { NoteResult } from "../../lib/game/sing";
import type { TrackNote, TrackWord } from "../../lib/track/types";

/** Seconds of lead-in shown behind the now line. */
const LOOK_BEHIND = 1.2;
/** Seconds of upcoming notes shown ahead of the now line. */
const LOOK_AHEAD = 4.5;
/** The semitone span the lane always shows at minimum. */
const MIN_PITCH_SPAN = 14;
/** Where unpitched (rap) notes sit, as a percentage from the top. */
const RAP_TOP = 90;

interface Props {
  notes: TrackNote[];
  words: TrackWord[];
  results: NoteResult[];
  pointer: number;
  /** Player time, in seconds. */
  time: number;
  offset: number;
  /** Latest detected MIDI note, for the live cursor. */
  midi: number | null;
}

function PitchHighway({ notes, words, results, pointer, time, offset, midi }: Props) {
  const pitched = notes
    .filter((note) => note.pitch !== null)
    .map((note) => (note.pitch as number) + 60);
  const centre =
    pitched.length > 0 ? (Math.min(...pitched) + Math.max(...pitched)) / 2 : 66;
  const span = Math.max(
    pitched.length > 0 ? Math.max(...pitched) - Math.min(...pitched) + 2 : 0,
    MIN_PITCH_SPAN,
  );
  const low = centre - span / 2;
  const high = centre + span / 2;

  const windowStart = time - LOOK_BEHIND;
  const windowSpan = LOOK_BEHIND + LOOK_AHEAD;
  const windowEnd = time + LOOK_AHEAD;
  const nowPercent = (LOOK_BEHIND / windowSpan) * 100;

  const percentX = (seconds: number) => ((seconds - windowStart) / windowSpan) * 100;
  const percentY = (midiNote: number) =>
    Math.min(100, Math.max(0, ((high - midiNote) / (high - low)) * 100));

  return (
    <div className="pitch-highway" aria-hidden="true">
      <div className="pitch-highway__grid" />
      {notes.map((note, index) => {
        const start = note.start + offset;
        const end = note.end + offset;
        if (end < windowStart || start > windowEnd) return null;

        const left = percentX(start);
        const width = Math.max((end - start) / windowSpan * 100, 0.6);
        const isRap = note.pitch === null;
        const top = note.pitch === null ? RAP_TOP : percentY(note.pitch + 60);
        const state = results[index] ?? "pending";
        const golden = note.kind === "golden" || note.kind === "goldenRap";
        const classes = [
          "pitch-note",
          isRap ? "is-rap" : "",
          golden ? "is-golden" : "",
          `is-${state}`,
          index === pointer ? "is-active" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={index}
            className={classes}
            style={{ left: `${left}%`, width: `${width}%`, top: `${top}%` }}
          >
            <span className="pitch-note__lyric">{words[note.word]?.text}</span>
          </div>
        );
      })}

      <div className="pitch-now" style={{ left: `${nowPercent}%` }} />
      {midi !== null ? (
        <div
          className="pitch-cursor"
          style={{ left: `${nowPercent}%`, top: `${percentY(midi)}%` }}
        />
      ) : null}
    </div>
  );
}

export default memo(PitchHighway);
