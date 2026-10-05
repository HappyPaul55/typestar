/**
 * The heads-up display: score, combo, accuracy, progress and controls.
 */

import { GAME_MODES, type GameMode } from "../../lib/game/engine";
import { formatTime } from "../../lib/game/storage";

interface Props {
  score: number;
  combo: number;
  accuracy: number;
  progress: number;
  time: number;
  duration: number;
  mode: GameMode;
  paused: boolean;
  playing: boolean;
  onTogglePause(): void;
  onRestart(): void;
  onSelectMode(mode: GameMode): void;
  onCalibrate(): void;
  onFullscreen(): void;
  onChangeSong(): void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="hud__stat">
      <span className="hud__stat-label">{label}</span>
      <span className="hud__stat-value">{value}</span>
    </div>
  );
}

function Control({
  onClick,
  children,
  active = false,
  title,
}: {
  onClick(): void;
  children: React.ReactNode;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={"hud__control" + (active ? " is-active" : "")}
    >
      {children}
    </button>
  );
}

export default function Hud({
  score,
  combo,
  accuracy,
  progress,
  time,
  duration,
  mode,
  paused,
  playing,
  onTogglePause,
  onRestart,
  onSelectMode,
  onCalibrate,
  onFullscreen,
  onChangeSong,
}: Props) {
  const percent = Math.round(accuracy * 100);

  return (
    <div className="hud">
      <div className="hud__stats">
        <Stat label="score" value={score.toLocaleString("en-GB")} />
        <Stat label="combo" value={combo > 0 ? `×${combo}` : "—"} />
        <Stat label="accuracy" value={`${percent}%`} />
      </div>

      <div className="hud__progress">
        <div className="hud__bar" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="hud__bar-fill" style={{ width: `${Math.min(100, progress * 100)}%` }} />
        </div>
        <div className="hud__time">
          {formatTime(time)} <span aria-hidden="true">/</span> {formatTime(duration)}
        </div>
      </div>

      <div className="hud__controls">
        <Control onClick={onTogglePause} title={paused ? "Resume" : "Pause"}>
          {playing && !paused ? "❚❚" : "▶"}
        </Control>
        <Control onClick={onRestart} title="Restart">
          ↺
        </Control>
        <label className="hud__mode" title="Difficulty">
          <span className="sr-only">Difficulty</span>
          <select
            className="hud__select"
            value={mode}
            onChange={(event) => onSelectMode(event.target.value as GameMode)}
          >
            {GAME_MODES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <Control onClick={onCalibrate} title="Sync offset">
          sync
        </Control>
        <Control onClick={onFullscreen} title="Fullscreen">
          ⛶
        </Control>
        <Control onClick={onChangeSong} title="Change song">
          song
        </Control>
      </div>
    </div>
  );
}
