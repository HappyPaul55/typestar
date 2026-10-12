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
  type FailMode,
  type GameMode,
  type PlaybackSpeed,
} from "../../lib/game/engine";
import type { Capabilities, RunSummary } from "../../lib/game/game";
import { formatTime } from "../../lib/game/storage";
import { difficultyLabel, runModeLabel, speedLabel } from "../../i18n/labels";
import { useT } from "../../i18n/react";
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
  /** Hide the "change song" control (the embed has no picker to return to). */
  compact?: boolean;
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
  compact = false,
  rootRef,
}: Props) {
  const percent = Math.round(summary.accuracy * 100);
  const t = useT();

  return (
    <div className="hud" ref={rootRef}>
      {capabilities.scoreBar ? (
        <div className="hud__stats">
          <Stat label={t("hud.score")} value={summary.score.toLocaleString("en-GB")} />
          <Stat
            label={t("hud.combo")}
            value={summary.combo > 0 ? `×${summary.multiplier}` : "—"}
          />
          <Stat label={t("hud.accuracy")} value={summary.attempted ? `${percent}%` : "—"} />
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
        <Control onClick={onTogglePause} title={paused ? t("hud.resume") : t("hud.pause")}>
          {playing && !paused ? "❚❚" : "▶"}
        </Control>
        <Control onClick={onReset} title={t("hud.reset")}>
          ↺
        </Control>
        {capabilities.difficulty ? (
          <label className="hud__mode" data-tooltip={t("hud.difficulty")}>
            <span className="sr-only">{t("hud.difficulty")}</span>
            <select
              className="hud__select"
              value={mode}
              disabled={locked}
              onChange={(event) => onSelectMode(event.target.value as GameMode)}
            >
              {GAME_MODES.map((value) => (
                <option key={value} value={value}>
                  {difficultyLabel(value, t)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {capabilities.runMode ? (
          <label className="hud__mode" data-tooltip={t("hud.runMode")}>
            <span className="sr-only">{t("hud.runMode")}</span>
            <select
              className="hud__select"
              value={failMode}
              disabled={locked}
              onChange={(event) => onSelectFailMode(event.target.value as FailMode)}
            >
              {FAIL_MODES.map((value) => (
                <option key={value} value={value}>
                  {runModeLabel(value, t)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="hud__mode" data-tooltip={t("hud.speed")}>
          <span className="sr-only">{t("hud.speed")}</span>
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
                {speedLabel(value, t)}
              </option>
            ))}
          </select>
        </label>
        <div className="hud__sync">
          <Control onClick={onCalibrate} title={t("hud.sync")}>
            {t("hud.syncShort")}
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
          title={highlightFullscreen ? t("hud.goFullscreen") : t("hud.fullscreen")}
          hint={highlightFullscreen}
        >
          ⛶
        </Control>
        {compact ? null : (
          <Control onClick={onChangeSong} title={t("hud.changeSong")}>
            {t("hud.songShort")}
          </Control>
        )}
      </div>
    </div>
  );
}
