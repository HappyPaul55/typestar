/**
 * The heads-up display: score, combo multiplier, accuracy, progress and the
 * controls. Difficulty and run mode are dropdowns so they can be changed
 * mid-session.
 *
 * The game bar is the same in every style: the score/combo/accuracy block, the
 * difficulty and run-mode dropdowns, and every control are always shown. A
 * karaoke run keeps them too — its stats simply read "—", since there is no
 * score. What is shown is still driven by the active engine's
 * {@link Capabilities}, so a future style can hide a control if it must.
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
import type { Capabilities, RunSummary } from "../../lib/game/game";
import { DIFFICULTY_LABEL } from "../../lib/game/modes";
import { formatTime } from "../../lib/game/storage";
import Calibration from "./Calibration";

interface Props {
  summary: RunSummary;
  capabilities: Capabilities;
  time: number;
  duration: number;
  mode: GameMode;
  failMode: FailMode;
  speed: PlaybackSpeed;
  /** True while a run is in progress, so the dropdowns are disabled. */
  locked: boolean;
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
  /** Nudge the fullscreen button on the first visit, until the player uses it. */
  highlightFullscreen: boolean;
  /** The HUD root, so the shell can measure it and clear the start overlay. */
  rootRef?: React.Ref<HTMLDivElement>;
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
  hint = false,
}: {
  onClick(): void;
  children: React.ReactNode;
  active?: boolean;
  title?: string;
  /** Draw attention to the control (the first-visit fullscreen nudge). */
  hint?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      data-tooltip={title}
      className={
        "hud__control" +
        (active ? " is-active" : "") +
        (hint ? " hud__control--hint" : "")
      }
    >
      {children}
    </button>
  );
}

export default function Hud({
  summary,
  capabilities,
  time,
  duration,
  mode,
  failMode,
  speed,
  locked,
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
  highlightFullscreen,
  rootRef,
}: Props) {
  const percent = Math.round(summary.accuracy * 100);

  return (
    <div className="hud" ref={rootRef}>
      {capabilities.scoreBar ? (
        <div className="hud__stats">
          <Stat label="score" value={summary.score.toLocaleString("en-GB")} />
          <Stat
            label="combo"
            value={summary.combo > 0 ? `×${summary.multiplier}` : "—"}
          />
          <Stat label="accuracy" value={summary.attempted ? `${percent}%` : "—"} />
        </div>
      ) : null}

      <div className="hud__progress">
        <div
          className="hud__bar"
          role="progressbar"
          aria-valuenow={Math.round(summary.progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="hud__bar-fill"
            style={{ width: `${Math.min(100, summary.progress * 100)}%` }}
          />
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
        {capabilities.difficulty ? (
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
                  {DIFFICULTY_LABEL[value]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {capabilities.runMode ? (
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
        ) : null}
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
        <Control
          onClick={onFullscreen}
          title={highlightFullscreen ? "Go fullscreen" : "Fullscreen"}
          hint={highlightFullscreen}
        >
          ⛶
        </Control>
        <Control onClick={onChangeSong} title="Change song">
          song
        </Control>
      </div>
    </div>
  );
}
