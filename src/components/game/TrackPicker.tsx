/**
 * The no-track state: paste a YouTube link, or pick a featured track.
 */

import { useEffect, useState, type MouseEvent } from "react";
import { FEATURED_TRACKS } from "../../content/tracks/featured";
import { parseVideoId } from "../../lib/game/client";
import { supportsLocalLibrary } from "../../lib/local/library";
import { RATING_LABEL, type TrackRating } from "../../lib/track/rating";
import TrackCard from "./TrackCard";

export default function TrackPicker({
  ratings = {},
  onOpen,
  onOpenLocal,
}: {
  /** Track id -> difficulty rating, computed from the pre-warmed seeds. */
  ratings?: Record<string, TrackRating>;
  /** Open a YouTube track in place, instead of a full document navigation. */
  onOpen?(id: string): void;
  /** Switch to the local-file picker in place. */
  onOpenLocal?(): void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  // The File System Access API only exists in some browsers. Checking during
  // SSR would cause a hydration mismatch, so probe after mount and show a
  // neutral placeholder until we know.
  const [localSupport, setLocalSupport] = useState<"unknown" | "yes" | "no">(
    "unknown",
  );

  useEffect(() => {
    setLocalSupport(supportsLocalLibrary() ? "yes" : "no");
  }, []);

  function go(raw: string) {
    const id = parseVideoId(raw);
    if (!id) {
      setError("That does not look like a YouTube link or video id.");
      return;
    }
    if (onOpen) onOpen(id);
    else window.location.href = `/play/${id}${window.location.hash}`;
  }

  // A plain left click switches to the local picker in place; modified clicks
  // are left to the browser so "open in a new tab" still works.
  function openLocal(event: MouseEvent<HTMLAnchorElement>) {
    if (!onOpenLocal) return;
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    onOpenLocal();
  }

  return (
    <div className="track-picker">
      <div className="track-picker__top">
        <form
          className="track-picker__form"
          onSubmit={(event) => {
            event.preventDefault();
            go(value);
          }}
        >
          <label className="track-picker__label" htmlFor="track-url">
            Paste a YouTube link
          </label>
          <div className="track-picker__row">
            <input
              id="track-url"
              className="track-picker__input"
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="https://www.youtube.com/watch?v=…"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError(null);
              }}
            />
            <button type="submit" className="btn-game btn-game--primary">
              Play
            </button>
          </div>
          {error ? <p className="track-picker__error">{error}</p> : null}
          <p className="track-picker__note">
            TypeStar reads the video&rsquo;s captions to time the words. Tracks
            with clear, human-written captions work best.
          </p>
        </form>

        <aside
          className={
            "track-picker__local" +
            (localSupport === "no" ? " track-picker__local--unsupported" : "")
          }
          aria-label="Local files"
        >
          <p className="group-label">On this device</p>
          {localSupport === "yes" ? (
            <>
              <p className="track-picker__note">
                Play songs you already have. Pick a folder of{" "}
                <strong>UltraStar</strong> charts or videos with matching{" "}
                <code>.vtt</code> captions — nothing is uploaded.
              </p>
              <div className="track-picker__local-action">
                <a
                  className="btn-game btn-game--primary"
                  href="/play/local"
                  onClick={openLocal}
                >
                  Open local files
                </a>
              </div>
            </>
          ) : localSupport === "no" ? (
            <p className="track-picker__note track-picker__local-warning">
              Local playback isn&rsquo;t available in this browser — it needs the
              File System Access API. Try Chrome, Edge or Brave to play local
              files.
            </p>
          ) : (
            <p className="track-picker__note track-picker__local-checking">
              Checking this browser&hellip;
            </p>
          )}
        </aside>
      </div>

      <div className="track-picker__featured">
        <p className="group-label">Featured</p>
        <div className="track-picker__grid">
          {FEATURED_TRACKS.map((track) => {
            // YouTube's own cover art. `mq`/`hq`/`sd`/`maxres` are picked by
            // width; the 4:3 variants are cropped to 16:9 by `object-fit`.
            const thumb = `https://i.ytimg.com/vi/${track.id}`;
            const srcSet = [
              `${thumb}/mqdefault.jpg 320w`,
              `${thumb}/hqdefault.jpg 480w`,
              `${thumb}/sddefault.jpg 640w`,
              `${thumb}/maxresdefault.jpg 1280w`,
            ].join(", ");
            const rating = ratings[track.id];
            return (
              <TrackCard
                key={track.id}
                href={`/play/${track.id}`}
                title={track.title}
                subtitle={track.artist}
                onOpen={onOpen ? () => onOpen(track.id) : undefined}
                media={
                  <picture>
                    <source
                      type="image/jpeg"
                      srcSet={srcSet}
                      sizes="(min-width: 640px) 20rem, 92vw"
                    />
                    <img
                      className="track-card__art"
                      src={`${thumb}/hqdefault.jpg`}
                      alt=""
                      width={480}
                      height={270}
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                }
                badge={
                  rating ? (
                    <span
                      className={`track-card__badge track-card__badge--${rating}`}
                      title={`${RATING_LABEL[rating]} — rated from the song's words per second`}
                    >
                      {RATING_LABEL[rating]}
                    </span>
                  ) : null
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
