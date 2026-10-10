/**
 * The scored-singing results screen: shown when a microphone run finishes.
 * Reports the pitch accuracy, note hits and a rank, and keeps a local personal
 * best per track + difficulty.
 */

import { useEffect, useRef, useState } from "react";
import type { FailMode, GameMode } from "../../lib/game/engine";
import { singPitchAccuracy, singRank, type SingState } from "../../lib/game/sing";
import { formatTime, readSetting, writeSetting } from "../../lib/game/storage";
import { buildHash } from "../../lib/game/url";

interface Props {
  state: SingState;
  mode: GameMode;
  failMode: FailMode;
  trackId: string;
  /** Seconds of song played. */
  elapsed: number;
  /** How far through the notes the run got, 0..1. */
  progress: number;
  onReplay(): void;
  onChangeSong(): void;
  onClose(): void;
}

const FAIL_REASON: Record<"score" | "mistake", string> = {
  score: "Your score went negative.",
  mistake: "You missed a note.",
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="results__metric">
      <span className="results__metric-label">{label}</span>
      <span className="results__metric-value">{value}</span>
    </div>
  );
}

export default function SingResults({
  state,
  mode,
  failMode,
  trackId,
  elapsed,
  progress,
  onReplay,
  onChangeSong,
  onClose,
}: Props) {
  const bestKey = `best:sing:${trackId}:${mode}`;
  const [best, setBest] = useState<number | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    const previous = document.activeElement as HTMLElement | null;
    node.querySelector<HTMLElement>("button")?.focus();
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    const previous = readSetting<number | null>(bestKey, null);
    if (previous === null || state.score > previous) {
      writeSetting(bestKey, state.score);
      setBest(state.score);
      setNewBest(true);
    } else {
      setBest(previous);
      setNewBest(false);
    }
  }, [bestKey, state.score]);

  const rank = singRank(state);
  const accuracy = Math.round(singPitchAccuracy(state) * 100);
  const notes = state.hits + state.misses;
  const failed = state.failed;

  async function share() {
    const url = `${window.location.origin}/play/${trackId}${buildHash({
      mode,
      failMode: "fun",
      style: "sing",
    })}`;
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
        aria-label="Singing results"
      >
        <div className="results__head">
          <p className="comment">
            <span className="slash" aria-hidden="true">
              //
            </span>{" "}
            {failed ? "run over" : "results"}
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
              <span className="results__reason">
                {state.failReason ? FAIL_REASON[state.failReason] : ""}
              </span>
            </>
          ) : (
            <span className="results__rank" aria-label={`Rank ${rank}`}>
              {rank}
            </span>
          )}
          <span className="results__progress">{Math.round(progress * 100)}% through</span>
        </div>

        <p className="results__best">
          {newBest ? "New best!" : `Best ${best?.toLocaleString("en-GB") ?? "—"}`}
        </p>

        <div className="results__grid">
          <Metric label="score" value={state.score.toLocaleString("en-GB")} />
          <Metric label="pitch accuracy" value={`${accuracy}%`} />
          <Metric label="notes hit" value={`${state.hits}`} />
          <Metric label="notes missed" value={`${state.misses}`} />
          <Metric label="best combo" value={`×${state.maxCombo}`} />
          <Metric label="notes" value={`${notes}`} />
          <Metric label="time" value={formatTime(elapsed)} />
          <Metric label="difficulty" value={mode} />
          <Metric label="run mode" value={failMode} />
          {failMode === "practise" ? (
            <Metric label="replays" value={`${state.replays}`} />
          ) : null}
        </div>

        <div className="results__actions">
          <button type="button" className="btn-game btn-game--primary" onClick={onReplay}>
            Sing again
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
