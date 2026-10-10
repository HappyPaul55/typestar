/**
 * The pitch highway: the singing counterpart of the lyric highway.
 *
 * Notes are drawn as bars positioned by pitch (vertical) and time (horizontal)
 * and scroll past a fixed "now" line. The words are shown by the lyric highway
 * below, so the bars carry no text.
 *
 * The scroll runs on its own animation frame, moving a single transformed layer
 * by the live player clock, so it is smooth at 60fps regardless of how often
 * React re-renders for scoring. Only the note colours (hit/miss/active) and the
 * pitch cursor come from React state.
 */

import { memo, useEffect, useRef } from "react";
import type { NoteResult } from "../../lib/game/sing";
import type { TrackNote } from "../../lib/track/types";

/** Horizontal scale of the lane. */
const PX_PER_SECOND = 90;
/** Where the now line sits, as a fraction of the lane's width. */
const NOW_FRACTION = 0.28;
/** The semitone span the lane always shows at minimum. */
const MIN_PITCH_SPAN = 14;
/** Where unpitched (rap) notes sit, as a percentage from the top. */
const RAP_TOP = 90;
/** A note never renders narrower than this. */
const MIN_NOTE_PX = 4;

interface Props {
  notes: TrackNote[];
  results: NoteResult[];
  pointer: number;
  offset: number;
  /** Live player clock, read every animation frame for a smooth scroll. */
  getTime: () => number;
  /** Live detected MIDI note (a ref, read every frame for a smooth cursor). */
  midiRef: { readonly current: number | null };
}

function PitchHighway({
  notes,
  results,
  pointer,
  offset,
  getTime,
  midiRef,
}: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const nowLineRef = useRef<HTMLDivElement>(null);
  /** The now line's x, in px, measured from the lane's width. */
  const nowXRef = useRef(0);

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

  const percentY = (midiNote: number) =>
    Math.min(100, Math.max(0, ((high - midiNote) / (high - low)) * 100));

  // Read from the animation loop, so it never needs to re-subscribe.
  const percentYRef = useRef(percentY);
  percentYRef.current = percentY;

  // Measure the now line whenever the lane is resized.
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const measure = () => {
      nowXRef.current = outer.clientWidth * NOW_FRACTION;
    };
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(outer);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // The animation loop: move one transformed layer and place the cursor.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const nowX = nowXRef.current;
      const layer = layerRef.current;
      if (layer) {
        layer.style.transform = `translate3d(${nowX - getTime() * PX_PER_SECOND}px, 0, 0)`;
      }
      if (nowLineRef.current) {
        nowLineRef.current.style.left = `${nowX}px`;
      }
      const cursor = cursorRef.current;
      if (cursor) {
        const detected = midiRef.current;
        cursor.style.left = `${nowX}px`;
        cursor.style.opacity = detected === null ? "0" : "1";
        if (detected !== null) cursor.style.top = `${percentYRef.current(detected)}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getTime]);

  return (
    <div ref={outerRef} className="pitch-highway" aria-hidden="true">
      <div className="pitch-highway__grid" />
      <div ref={layerRef} className="pitch-highway__layer">
        {notes.map((note, index) => {
          const left = (note.start + offset) * PX_PER_SECOND;
          const width = Math.max((note.end - note.start) * PX_PER_SECOND, MIN_NOTE_PX);
          const state = results[index] ?? "pending";
          const golden = note.kind === "golden" || note.kind === "goldenRap";
          const isRap = note.pitch === null;
          const top = note.pitch === null ? RAP_TOP : percentY(note.pitch + 60);
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
              style={{ left: `${left}px`, width: `${width}px`, top: `${top}%` }}
            />
          );
        })}
      </div>
      <div ref={nowLineRef} className="pitch-now" />
      <div ref={cursorRef} className="pitch-cursor" />
    </div>
  );
}

// Memoised: the lane re-renders only when a note resolves, not on every tick of
// the island's clock. Its scroll and cursor run on their own animation frame.
export default memo(PitchHighway);
