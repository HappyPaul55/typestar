/**
 * The media layer behind the game: the YouTube player, a local video, a
 * local UltraStar background video, or a cover image when there is none.
 *
 * It fills the stage; the game (HUD, lyrics, overlays) sits on top of it.
 */

import type { ReactNode } from "react";
import type { MessageKey } from "../../i18n";
import { useT } from "../../i18n/react";

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

const ERROR_KEYS: Record<number, MessageKey> = {
  2: "player.errInvalidId",
  5: "player.errEmbedded",
  100: "player.errPrivate",
  101: "player.errNotEmbeddable",
  150: "player.errNotEmbeddable",
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
  const t = useT();
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
            {t("player.loading")}
          </span>
        </div>
      ) : null}

      {error !== null ? (
        <div className="player-stage__placeholder player-stage__placeholder--error">
          <p className="font-display text-lg font-bold">{t("player.unavailable")}</p>
          <p className="mt-2 text-sm">
            {errorMessage ??
              (ERROR_KEYS[error] ? t(ERROR_KEYS[error]) : t("player.startFailed"))}
          </p>
        </div>
      ) : null}
    </div>
  );
}
