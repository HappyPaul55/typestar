/**
 * The card for one song: cover art on top, title and subtitle below.
 *
 * Shared by the featured picker on `/play` and the local picker on
 * `/play/local`, so both look and behave the same. It is always an anchor, so
 * the browser keeps its usual link behaviour — right-click to copy the address,
 * middle-click or Ctrl/Cmd-click to open in a new tab.
 */

import type { MouseEvent, ReactNode } from "react";

export default function TrackCard({
  href,
  title,
  subtitle,
  media,
  badge,
  onOpen,
  busy = false,
  square = false,
}: {
  /** Where the card points; a new tab opens this address. */
  href: string;
  title: string;
  /** The secondary line (artist, album, …); omitted when empty. */
  subtitle?: string | null;
  /** The cover art: a `<picture>`/`<img>`, or a placeholder. */
  media: ReactNode;
  /** A pill over the cover, e.g. the rating or the Lyrics/Video tag. */
  badge?: ReactNode;
  /**
   * Open the song in place on a plain left click, instead of navigating. Any
   * modified click (Ctrl/Cmd/Shift/Alt) or a non-primary button is left to the
   * browser, so "open in a new tab" still works.
   */
  onOpen?: () => void;
  /** Dim the card and ignore clicks while a song is being read. */
  busy?: boolean;
  /**
   * Crop the cover to a square. UltraStar cover art is 1:1; video thumbnails
   * (the default) stay 16:9.
   */
  square?: boolean;
}) {
  return (
    <a
      className={
        "track-card" +
        (busy ? " track-card--busy" : "") +
        (square ? " track-card--square" : "")
      }
      href={href}
      aria-busy={busy || undefined}
      aria-disabled={busy || undefined}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (busy) {
          event.preventDefault();
          return;
        }
        if (!onOpen) return;
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        onOpen();
      }}
    >
      <span className="track-card__media">
        {media}
        {badge}
        <span className="track-card__play" aria-hidden="true">
          ▶
        </span>
      </span>
      <span className="track-card__body">
        <span className="track-card__title">{title}</span>
        {subtitle ? (
          <span className="track-card__artist">{subtitle}</span>
        ) : null}
      </span>
    </a>
  );
}
