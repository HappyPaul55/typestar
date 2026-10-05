/**
 * End-of-track summary.
 */

import type { GameMode, GameState, Rank } from "../../lib/game/engine";

interface Props {
  state: GameState;
  accuracy: number;
  rank: Rank;
  mode: GameMode;
  onReplay(): void;
  onChangeSong(): void;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="results__metric">
      <span className="results__metric-label">{label}</span>
      <span className="results__metric-value">{value}</span>
    </div>
  );
}

export default function Results({
  state,
  accuracy,
  rank,
  mode,
  onReplay,
  onChangeSong,
}: Props) {
  return (
    <div className="game-overlay game-overlay--results">
      <div className="results">
        <p className="comment">
          <span className="slash" aria-hidden="true">
            //
          </span>{" "}
          results
        </p>

        <div className="results__rank" aria-label={`Rank ${rank}`}>
          {rank}
        </div>

        <div className="results__grid">
          <Metric label="score" value={state.score.toLocaleString("en-GB")} />
          <Metric label="accuracy" value={`${Math.round(accuracy * 100)}%`} />
          <Metric label="best combo" value={`×${state.maxCombo}`} />
          <Metric label="words hit" value={`${state.hits}`} />
          <Metric label="words missed" value={`${state.misses}`} />
          <Metric label="mode" value={mode} />
        </div>

        <div className="results__actions">
          <button type="button" className="btn-game btn-game--primary" onClick={onReplay}>
            Play again
          </button>
          <button type="button" className="btn-game" onClick={onChangeSong}>
            Change song
          </button>
        </div>
      </div>
    </div>
  );
}
