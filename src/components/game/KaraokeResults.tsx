/**
 * The karaoke summary: shown when an unscored sing-along finishes. It is
 * deliberately light — there is no score to report, so it just thanks the
 * singer and offers a replay or a change of song, in the results styling.
 */

import { useEffect, useRef } from "react";
import { formatTime } from "../../lib/game/storage";

interface Props {
  title: string;
  artist?: string;
  /** Seconds of song played. */
  elapsed: number;
  onReplay(): void;
  onChangeSong(): void;
  onClose(): void;
}

export default function KaraokeResults({
  title,
  artist,
  elapsed,
  onReplay,
  onChangeSong,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // The overlay is modal: move focus into it and restore it when it closes.
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    const previous = document.activeElement as HTMLElement | null;
    node.querySelector<HTMLElement>("button")?.focus();
    return () => previous?.focus?.();
  }, []);

  return (
    <div className="game-overlay game-overlay--results">
      <div
        ref={dialogRef}
        className="results"
        role="dialog"
        aria-modal="true"
        aria-label="Karaoke finished"
      >
        <div className="results__head">
          <p className="comment">
            <span className="slash" aria-hidden="true">
              //
            </span>{" "}
            karaoke
          </p>
          <button
            type="button"
            className="results__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="results__best">Thanks for singing!</p>

        <div className="results__grid">
          <div className="results__metric">
            <span className="results__metric-label">song</span>
            <span className="results__metric-value">{title}</span>
          </div>
          {artist ? (
            <div className="results__metric">
              <span className="results__metric-label">artist</span>
              <span className="results__metric-value">{artist}</span>
            </div>
          ) : null}
          <div className="results__metric">
            <span className="results__metric-label">time</span>
            <span className="results__metric-value">{formatTime(elapsed)}</span>
          </div>
        </div>

        <div className="results__actions">
          <button type="button" className="btn-game btn-game--primary" onClick={onReplay}>
            Sing again
          </button>
          <button type="button" className="btn-game" onClick={onChangeSong}>
            Change song
          </button>
        </div>
      </div>
    </div>
  );
}
