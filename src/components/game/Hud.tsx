/**
 * The heads-up display: score, combo multiplier, accuracy, progress and the
 * controls. Difficulty and run mode are dropdowns so they can be changed
 * mid-session.
 */

import {
  FAIL_MODES,
  GAME_MODES,
  PLAYBACK_SPEEDS,
  SPEED_LABEL,
  type FailMode,
  type GameMode,
  type PlaybackSpeed,
} from "../../lib/game/engine";
import { formatTime } from "../../lib/game/storage";
import Calibration from "./Calibration";

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
  speed: PlaybackSpeed;
  /** True while a run is in progress, so the dropdowns are disabled. */
  locked: boolean;
  /** Karaoke: no score is kept, so the stats and scoring dropdowns are hidden. */
  karaoke?: boolean;
  /** Scored singing: difficulty is a pitch tolerance, and run mode does not apply. */
  hideRunMode?: boolean;
  paused: boolean;
  playing: boolean;
  onTogglePause(): void;
  onReset(): void;
  onSelectMode(mode: GameMode): void;
  onSelectFailMode(mode: FailMode): void;
  onSelectSpeed(speed: PlaybackSpeed): void;
  onCalibrate(): void;
  calibrationOpen: boolean;
  offset: number;
  onChangeOffset(offset: number): void;
  onCloseCalibration(): void;
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
      aria-label={title}
      data-tooltip={title}
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
  speed,
  locked,
  karaoke = false,
  hideRunMode = false,
  paused,
  playing,
  onTogglePause,
  onReset,
  onSelectMode,
  onSelectFailMode,
  onSelectSpeed,
  onCalibrate,
  calibrationOpen,
  offset,
  onChangeOffset,
  onCloseCalibration,
  onFullscreen,
  onChangeSong,
}: Props) {
  const percent = Math.round(accuracy * 100);

  return (
    <div className="hud">
      {karaoke ? null : (
        <div className="hud__stats">
          <Stat label="score" value={score.toLocaleString("en-GB")} />
          <Stat label="combo" value={combo > 0 ? `×${multiplier}` : "—"} />
          <Stat label="accuracy" value={attempted ? `${percent}%` : "—"} />
        </div>
      )}

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
        <Control onClick={onReset} title="Reset">
          ↺
        </Control>
        {karaoke ? null : (
          <>
            <label className="hud__mode" data-tooltip="Difficulty">
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
            {hideRunMode ? null : (
              <label className="hud__mode" data-tooltip="Run mode">
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
            )}
          </>
        )}
        <label className="hud__mode" data-tooltip="Playback speed">
          <span className="sr-only">Playback speed</span>
          <select
            className="hud__select"
            value={speed}
            disabled={locked}
            onChange={(event) =>
              onSelectSpeed(Number(event.target.value) as PlaybackSpeed)
            }
          >
            {PLAYBACK_SPEEDS.map((value) => (
              <option key={value} value={value}>
                {SPEED_LABEL[value]}
              </option>
            ))}
          </select>
        </label>
        <div className="hud__sync">
          <Control onClick={onCalibrate} title="Sync offset">
            sync
          </Control>
          {calibrationOpen ? (
            <Calibration
              offset={offset}
              onChange={onChangeOffset}
              onClose={onCloseCalibration}
            />
          ) : null}
        </div>
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
