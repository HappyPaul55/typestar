/**
 * The start screen shown before a run.
 *
 * It offers the play style, the difficulty (with the help line the style gives
 * it) and the start button. The shell supplies the copy, so the same screen
 * serves every engine — including ones added later.
 */

import { GAME_MODES, type GameMode } from "../../lib/game/engine";
import { gameEngineList } from "../../lib/game/engines";
import { DIFFICULTY_LABEL, type PlayStyle } from "../../lib/game/modes";

interface Props {
  style: PlayStyle;
  onSelectStyle(style: PlayStyle): void;
  mode: GameMode;
  onSelectMode(mode: GameMode): void;
  /** The help line for the chosen style (scored or karaoke singing differ). */
  help: string;
  /** Show the difficulty picker (typing, or scored singing's pitch tolerance). */
  showDifficulty: boolean;
  /** The help line for the chosen difficulty. */
  difficultyHelp: string;
  onStart(): void;
}

export default function StartScreen({
  style,
  onSelectStyle,
  mode,
  onSelectMode,
  help,
  showDifficulty,
  difficultyHelp,
  onStart,
}: Props) {
  const title = style === "sing" ? "Sing along." : "Type the words in time.";
  return (
    <div className="game-overlay game-overlay--start" role="dialog" aria-label="Start">
      <p className="comment on-ink">
        <span className="slash" aria-hidden="true">
          //
        </span>{" "}
        ready
      </p>
      <h2 className="game-overlay__title">{title}</h2>
      <p className="game-overlay__help">{help}</p>

      <button
        type="button"
        className="btn-game btn-game--primary btn-game--start"
        onClick={onStart}
      >
        Start
      </button>

      <div className="mode-picker" role="group" aria-label="Play style">
        {gameEngineList().map((engine) => (
          <button
            key={engine.id}
            type="button"
            className={"mode-picker__option" + (engine.id === style ? " is-active" : "")}
            aria-pressed={engine.id === style}
            onClick={() => onSelectStyle(engine.id)}
          >
            {engine.label}
          </button>
        ))}
      </div>

      {showDifficulty ? (
        <>
          <div className="mode-picker" role="group" aria-label="Difficulty">
            {GAME_MODES.map((value) => (
              <button
                key={value}
                type="button"
                className={"mode-picker__option" + (value === mode ? " is-active" : "")}
                aria-pressed={value === mode}
                onClick={() => onSelectMode(value)}
              >
                {DIFFICULTY_LABEL[value]}
              </button>
            ))}
          </div>
          <p className="mode-picker__help">{difficultyHelp}</p>
        </>
      ) : null}
    </div>
  );
}
