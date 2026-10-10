/**
 * The results modal, shared by every play style.
 *
 * The engine produces a {@link ResultsSummary} (rank or failure, the metric
 * grid, the best-score key and the share settings); this component just renders
 * it, so typing, scored singing and karaoke all finish in the same place.
 */

import { useEffect, useRef, useState } from "react";
import type { ResultsSummary } from "../../lib/game/game";
import { readSetting, writeSetting } from "../../lib/game/storage";
import { buildHash } from "../../lib/game/url";

interface Props {
  summary: ResultsSummary;
  onReplay(): void;
  onChangeSong(): void;
  onClose(): void;
}

export default function ResultsModal({
  summary,
  onReplay,
  onChangeSong,
  onClose,
}: Props) {
  const [best, setBest] = useState<number | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // The results overlay is modal: move focus into it, keep Tab inside it, and
  // restore focus when it closes.
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    focusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, []);

  // Record a personal best for this style + track + settings (scored runs only).
  useEffect(() => {
    if (!summary.scored) return;
    const previous = readSetting<number | null>(summary.bestKey, null);
    if (previous === null || summary.score > previous) {
      writeSetting(summary.bestKey, summary.score);
      setBest(summary.score);
      setNewBest(true);
    } else {
      setBest(previous);
      setNewBest(false);
    }
  }, [summary.bestKey, summary.scored, summary.score]);

  const failed = summary.failed;
  const header = summary.scored
    ? failed
      ? "run over"
      : "results"
    : "karaoke";

  /** Share the same track and settings so someone else can take the same run. */
  async function share() {
    const url = `${window.location.origin}/play/${summary.trackId}${buildHash(summary.share)}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "TypeStar", url });
        return;
      } catch {
        // Cancelled or unsupported; fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable; nothing more to do.
    }
  }

  return (
    <div className="game-overlay game-overlay--results">
      <div
        ref={dialogRef}
        className={"results" + (failed ? " results--failed" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={failed ? "Run over" : "Results"}
      >
        <div className="results__head">
          <p className="comment">
            <span className="slash" aria-hidden="true">
              //
            </span>{" "}
            {header}
          </p>
          <button
            type="button"
            className="results__close"
            onClick={onClose}
            aria-label="Close results"
          >
            ×
          </button>
        </div>

        <div className="results__grade">
          {failed ? (
            <>
              <span className="results__verdict">Failed</span>
              <span className="results__reason">{summary.failMessage ?? ""}</span>
            </>
          ) : summary.rank ? (
            <span className="results__rank" aria-label={`Rank ${summary.rank}`}>
              {summary.rank}
            </span>
          ) : null}
          {summary.scored ? (
            <span className="results__progress">
              {Math.round(summary.progress * 100)}% through
            </span>
          ) : null}
        </div>

        <p className="results__best">
          {summary.scored
            ? newBest
              ? "New best!"
              : `Best ${best?.toLocaleString("en-GB") ?? "—"}`
            : "Thanks for singing!"}
        </p>

        <div className="results__grid">
          {summary.metrics.map((metric) => (
            <div className="results__metric" key={metric.label}>
              <span className="results__metric-label">{metric.label}</span>
              <span className="results__metric-value">{metric.value}</span>
            </div>
          ))}
        </div>

        <div className="results__actions">
          <button type="button" className="btn-game btn-game--primary" onClick={onReplay}>
            {summary.replayLabel}
          </button>
          <button type="button" className="btn-game" onClick={share}>
            {copied ? "Copied!" : "Share"}
          </button>
          <button type="button" className="btn-game" onClick={onChangeSong}>
            Change song
          </button>
        </div>
      </div>
    </div>
  );
}
