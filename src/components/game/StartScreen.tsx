/**
 * The start screen shown before a run.
 *
 * It offers the play style and the start button. The shell supplies the copy,
 * so the same screen serves every engine — including ones added later. The
 * difficulty is chosen in the game bar (the HUD) instead, so it stays out of
 * the way of starting a run.
 */

import { gameEngineList } from "../../lib/game/engines";
import type { PlayStyle } from "../../lib/game/modes";

interface Props {
  style: PlayStyle;
  onSelectStyle(style: PlayStyle): void;
  /** The help line for the chosen style (scored or karaoke singing differ). */
  help: string;
  onStart(): void;
}

export default function StartScreen({ style, onSelectStyle, help, onStart }: Props) {
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
    </div>
  );
}
