/**
 * The intro cue: a small bar that fills toward the moment the next word
 * becomes typeable, so the opening (and later instrumental gaps) don't look
 * like a broken game.
 *
 * During a long intro a small "Skip" tab pops out from under the bar's right
 * edge, so an impatient player can jump close to the first lyric without the
 * button covering the lyrics. The caller only passes `onSkip` when skipping is
 * worthwhile, so it hides itself when the intro is too short to bother with.
 */

import type { CueInfo } from "../../lib/game/engine";

interface Props {
  cue: CueInfo;
  /** True while the very first word is still ahead. */
  first: boolean;
  /** Skip close to the first lyric; only passed during a long intro. */
  onSkip?(): void;
}

export default function CueBar({ cue, first, onSkip }: Props) {
  // Show for the opening wait, and for any mid-song gap longer than 3 seconds.
  if (!cue.waiting || (!first && cue.span <= 3)) return null;

  return (
    <div className="cue-bar">
      <div className="cue-bar__track">
        <div
          className="cue-bar__fill"
          style={{ width: `${Math.round(cue.progress * 100)}%` }}
        />
      </div>
      <span className="cue-bar__label" role="status" aria-live="off">
        {first ? "first word" : "next word"} in {cue.remaining.toFixed(1)}s
      </span>
      {onSkip ? (
        <button type="button" className="cue-bar__skip" onClick={onSkip}>
          Skip
        </button>
      ) : null}
    </div>
  );
}
