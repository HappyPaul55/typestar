/**
 * The intro cue: a small bar that fills toward the moment the next word
 * becomes typeable, so the opening (and later instrumental gaps) don't look
 * like a broken game.
 */

import type { CueInfo } from "../../lib/game/engine";

interface Props {
  cue: CueInfo;
  /** True while the very first word is still ahead. */
  first: boolean;
}

export default function CueBar({ cue, first }: Props) {
  // Show for the opening wait, and for any mid-song gap longer than 3 seconds.
  if (!cue.waiting || (!first && cue.span <= 3)) return null;

  return (
    <div className="cue-bar" role="status" aria-live="off">
      <div className="cue-bar__track">
        <div
          className="cue-bar__fill"
          style={{ width: `${Math.round(cue.progress * 100)}%` }}
        />
      </div>
      <span className="cue-bar__label">
        {first ? "first word" : "next word"} in {cue.remaining.toFixed(1)}s
      </span>
    </div>
  );
}
