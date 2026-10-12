/**
 * The style / difficulty / run-mode / speed selectors shared by the boards and
 * challenge pages. Typing and singing are never mixed, so the style is part of
 * every board.
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
import { DIFFICULTY_LABEL, PLAY_STYLES, type PlayStyle } from "../../lib/game/modes";
import type { ModeQuery } from "../../lib/score/client";

export default function ScoreFilters({
  value,
  onChange,
}: {
  value: ModeQuery;
  onChange: (next: ModeQuery) => void;
}) {
  return (
    <div className="score-filters">
      <label>
        Style
        <select
          className="score-select"
          value={value.style}
          onChange={(event) => onChange({ ...value, style: event.target.value as PlayStyle })}
        >
          {PLAY_STYLES.map((style) => (
            <option key={style} value={style}>
              {style === "type" ? "Typing" : "Singing"}
            </option>
          ))}
        </select>
      </label>
      <label>
        Difficulty
        <select
          className="score-select"
          value={value.difficulty}
          onChange={(event) =>
            onChange({ ...value, difficulty: event.target.value as GameMode })
          }
        >
          {GAME_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {DIFFICULTY_LABEL[mode]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Run mode
        <select
          className="score-select"
          value={value.runMode}
          onChange={(event) => onChange({ ...value, runMode: event.target.value as FailMode })}
        >
          {FAIL_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </label>
      <label>
        Speed
        <select
          className="score-select"
          value={value.speed}
          onChange={(event) =>
            onChange({ ...value, speed: Number(event.target.value) as PlaybackSpeed })
          }
        >
          {PLAYBACK_SPEEDS.map((speed) => (
            <option key={speed} value={speed}>
              {SPEED_LABEL[speed]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
