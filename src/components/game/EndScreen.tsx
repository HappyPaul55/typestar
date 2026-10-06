/**
 * The end screen: shown when a run finishes (or fails). Summarises the run with
 * the score, a rank on a completed run, some fun stats and a local personal
 * best, and offers replay + share.
 */

import { useEffect, useState } from "react";
import type {
  FailMode,
  GameMode,
  GameState,
  PlaybackSpeed,
  Rank,
} from "../../lib/game/engine";
import { formatTime, readSetting, writeSetting } from "../../lib/game/storage";
import { buildHash } from "../../lib/game/url";

interface Props {
  state: GameState;
  accuracy: number;
  rank: Rank;
  mode: GameMode;
  failMode: FailMode;
  speed: PlaybackSpeed;
  trackId: string;
  /** Seconds of video played. */
  elapsed: number;
  /** How far through the words the run got, 0..1. */
  progress: number;
  onReplay(): void;
  onChangeSong(): void;
  onClose(): void;
}

const FAIL_REASON: Record<"score" | "mistake", string> = {
  score: "Your score went negative.",
  mistake: "You made a mistake.",
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="results__metric">
      <span className="results__metric-label">{label}</span>
      <span className="results__metric-value">{value}</span>
    </div>
  );
}

export default function EndScreen({
  state,
  accuracy,
  rank,
  mode,
  failMode,
  speed,
  trackId,
  elapsed,
  progress,
  onReplay,
  onChangeSong,
  onClose,
}: Props) {
  const bestKey = `best:${trackId}:${mode}:${failMode}`;
  const [best, setBest] = useState<number | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [copied, setCopied] = useState(false);

  // Record a personal best for this track + difficulty + run mode.
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

  const wpm = elapsed > 0 ? Math.round(state.correctKeys / 5 / (elapsed / 60)) : 0;
  const failed = state.failed;
  const accuracyPercent = Math.round(accuracy * 100);

  /** Share the same track and settings so someone else can take the same run. */
  async function share() {
    const url = `${window.location.origin}/play/${trackId}${buildHash({ mode, failMode, speed })}`;

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
      <div className={"results" + (failed ? " results--failed" : "")}>
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
          <Metric label="accuracy" value={`${accuracyPercent}%`} />
          <Metric label="best combo" value={`×${state.maxCombo}`} />
          <Metric label="perfect lines" value={`${state.perfectLines}`} />
          <Metric label="words hit" value={`${state.hits}`} />
          <Metric label="words missed" value={`${state.misses}`} />
          <Metric label="wrong keys" value={`${state.errorKeys}`} />
          <Metric label="wpm" value={`${wpm}`} />
          <Metric label="time" value={formatTime(elapsed)} />
          <Metric label="difficulty" value={mode} />
          <Metric label="run mode" value={failMode} />
          {failMode === "practise" ? (
            <Metric label="replays" value={`${state.replays}`} />
          ) : null}
        </div>

        <div className="results__actions">
          <button type="button" className="btn-game btn-game--primary" onClick={onReplay}>
            Play again
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
