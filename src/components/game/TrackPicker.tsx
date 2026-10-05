/**
 * The no-track state: paste a YouTube link, or pick a featured track.
 */

import { useState } from "react";
import { FEATURED_TRACKS } from "../../content/tracks/featured";
import { parseVideoId } from "../../lib/game/client";

export default function TrackPicker() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function go(raw: string) {
    const id = parseVideoId(raw);
    if (!id) {
      setError("That does not look like a YouTube link or video id.");
      return;
    }
    window.location.href = `/play/${id}${window.location.hash}`;
  }

  return (
    <div className="track-picker">
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

      <div className="track-picker__featured">
        <p className="group-label">Featured</p>
        <div className="track-picker__grid">
          {FEATURED_TRACKS.map((track) => (
            <a key={track.id} className="track-card" href={`/play/${track.id}`}>
              <span className="track-card__title">{track.title}</span>
              <span className="track-card__artist">{track.artist}</span>
              <span className="track-card__play" aria-hidden="true">
                ▶
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
