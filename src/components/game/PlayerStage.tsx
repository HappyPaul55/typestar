/**
 * The left-hand pane: the YouTube player, plus whatever overlay the current
 * phase needs (start prompt, countdown, paused, error).
 */

import type { ReactNode } from "react";

interface Props {
  containerRef: (node: HTMLDivElement | null) => void;
  ready: boolean;
  error: number | null;
  title: string;
  artist?: string;
  /**
   * When true, a transparent layer sits over the player so a click refocuses
   * the page (and its key listener) instead of the cross-origin YouTube iframe.
   */
  shielded?: boolean;
  onShield?(): void;
  children?: ReactNode;
}

const ERROR_MESSAGES: Record<number, string> = {
  2: "That video id is not valid.",
  5: "This video cannot play in the embedded player.",
  100: "This video is private or has been removed.",
  101: "The owner does not allow this video to be embedded.",
  150: "The owner does not allow this video to be embedded.",
};

export default function PlayerStage({
  containerRef,
  ready,
  error,
  title,
  artist,
  shielded = false,
  onShield,
  children,
}: Props) {
  return (
    <div className="player-stage">
      <div className="player-stage__frame">
        <div ref={containerRef} className="player-stage__player" />

        {shielded ? (
          <button
            type="button"
            className="player-stage__shield"
            aria-label="Focus the game"
            onClick={onShield}
          />
        ) : null}

        {!ready && error === null ? (
          <div className="player-stage__placeholder">
            <span className="comment">
              <span className="slash" aria-hidden="true">
                //
              </span>{" "}
              loading player
            </span>
          </div>
        ) : null}

        {error !== null ? (
          <div className="player-stage__placeholder player-stage__placeholder--error">
            <p className="font-display text-lg font-bold">Video unavailable</p>
            <p className="mt-2 text-sm">
              {ERROR_MESSAGES[error] ?? "The player could not start this video."}
            </p>
          </div>
        ) : null}

        {children}
      </div>

      <div className="player-stage__meta">
        <p className="player-stage__title">{title}</p>
        {artist ? <p className="player-stage__artist">{artist}</p> : null}
      </div>
    </div>
  );
}
