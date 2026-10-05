/**
 * The heads-up display: score, combo multiplier, accuracy, progress and the
 * controls. Difficulty and run mode are dropdowns so they can be changed
 * mid-session.
 */

import {
  FAIL_MODES,
  GAME_MODES,
  type FailMode,
  type GameMode,
} from "../../lib/game/engine";
import { formatTime } from "../../lib/game/storage";

interface Props {
  score: number;
  combo: number;
  multiplier: number;
  accuracy: number;
  /** True once any key has been typed, so accuracy is meaningful. */
  attempted: boolean;
  progress: number;
  time: number;
  duration: number;
  mode: GameMode;
  failMode: FailMode;
  /** True while a run is in progress, so the dropdowns are disabled. */
  locked: boolean;
  paused: boolean;
  playing: boolean;
  onTogglePause(): void;
  onRestart(): void;
  onSelectMode(mode: GameMode): void;
  onSelectFailMode(mode: FailMode): void;
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
  multiplier,
  accuracy,
  attempted,
  progress,
  time,
  duration,
  mode,
  failMode,
  locked,
  paused,
  playing,
  onTogglePause,
  onRestart,
  onSelectMode,
  onSelectFailMode,
  onCalibrate,
  onFullscreen,
  onChangeSong,
}: Props) {
  const percent = Math.round(accuracy * 100);

  return (
    <div className="hud">
      <div className="hud__stats">
        <Stat label="score" value={score.toLocaleString("en-GB")} />
        <Stat label="combo" value={combo > 0 ? `×${multiplier}` : "—"} />
        <Stat label="accuracy" value={attempted ? `${percent}%` : "—"} />
      </div>

      <div className="hud__progress">
        <div
          className="hud__bar"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
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
            disabled={locked}
            onChange={(event) => onSelectMode(event.target.value as GameMode)}
          >
            {GAME_MODES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="hud__mode" title="Run mode">
          <span className="sr-only">Run mode</span>
          <select
            className="hud__select"
            value={failMode}
            disabled={locked}
            onChange={(event) => onSelectFailMode(event.target.value as FailMode)}
          >
            {FAIL_MODES.map((value) => (
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
