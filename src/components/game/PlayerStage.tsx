/**
 * The media layer behind the game: the YouTube player, a local video, a
 * local UltraStar background video, or a cover image when there is none.
 *
 * It fills the stage; the game (HUD, lyrics, overlays) sits on top of it.
 */

import type { ReactNode } from "react";

interface Props {
  containerRef: (node: HTMLElement | null) => void;
  /** Ref for the background video in `audio` mode (synced to the audio). */
  videoRef?: (node: HTMLElement | null) => void;
  /**
   * `youtube` mounts the IFrame player; `video` mounts an HTML5 `<video>` that
   * is the master clock; `audio` shows a muted background video (or a cover)
   * while the hidden `<audio>` (rendered by the caller) drives the game.
   */
  mode?: "youtube" | "video" | "audio";
  /** A `#BACKGROUND` image shown when there is no video to play. */
  backgroundSrc?: string | null;
  ready: boolean;
  error: number | null;
  /** Overrides the generic message when the source is not YouTube. */
  errorMessage?: string;
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
  videoRef,
  mode = "youtube",
  backgroundSrc = null,
  ready,
  error,
  errorMessage,
}: Props): ReactNode {
  return (
    <div className="player-stage">
      {mode === "audio" ? (
        backgroundSrc ? (
          <img className="player-stage__background" src={backgroundSrc} alt="" />
        ) : (
          <video ref={videoRef} className="player-stage__player" playsInline muted />
        )
      ) : mode === "video" ? (
        <video
          ref={containerRef}
          className="player-stage__player"
          playsInline
          controls
          preload="metadata"
        />
      ) : (
        <div ref={containerRef} className="player-stage__player" />
      )}

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
            {errorMessage ??
              ERROR_MESSAGES[error] ??
              "The player could not start this video."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
