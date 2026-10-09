/**
 * The local-file picker: choose a folder of songs.
 *
 * Two kinds of local song are recognised:
 *
 * - **UltraStar** — a `.txt` chart that names its own audio (and optional
 *   background video); the lyrics are timed per syllable, so the words line up
 *   exactly with the music.
 * - **Video + WebVTT** — a video file and a same-named `.vtt` caption file.
 *
 * Reachable at `/play/local` (only offered when the browser supports the File
 * System Access API). The chosen folder handle is remembered in IndexedDB, and
 * its read permission is re-requested on a click so the files can be scanned
 * again on a later visit.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { buildLocalTrack } from "../../lib/track/build";
import { parseUltraStar, ultraStarTrack } from "../../lib/track/ultrastar";
import type { Track } from "../../lib/track/types";
import {
  ensureReadPermission,
  hasReadPermission,
  isSongTextPath,
  pairLocalFiles,
  pairUltraStarSongs,
  pickDirectory,
  scanDirectory,
  type LocalDirectoryHandle,
  type LocalFileHandle,
  type LocalItem,
  type LocalPair,
  type LocalUltraStarSong,
} from "../../lib/local/library";
import { loadDirectoryHandle, saveDirectoryHandle } from "../../lib/local/idb";

export interface LocalSelection {
  track: Track;
  /** `video` plays the file as the clock; `audio` uses the hidden audio. */
  kind: "video" | "audio";
  /** Master media: the video for a VTT pair, the audio for UltraStar. */
  media: File;
  /** UltraStar background video, synced to the audio, when the chart names one. */
  backgroundVideo?: File;
  /** UltraStar `#VIDEOGAP`, in seconds. */
  videoGap?: number;
  /** Relative path used to deep-link the song (`/play/local?file=…`). */
  filePath: string;
  /** The song's artist, when the chart names one. */
  artist?: string;
}

type Status = "idle" | "scanning" | "loading";

export default function LocalLibrary({
  requestedFile = null,
  onSelect,
}: {
  /** A song to open automatically, from `/play/local?file=…`. */
  requestedFile?: string | null;
  onSelect(selection: LocalSelection): void;
}) {
  const [folder, setFolder] = useState<string | null>(null);
  const [songs, setSongs] = useState<LocalUltraStarSong[]>([]);
  const [videos, setVideos] = useState<LocalPair[]>([]);
  const [handles, setHandles] = useState<Map<string, LocalFileHandle>>(new Map());
  const [remembered, setRemembered] = useState<LocalDirectoryHandle | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const scan = useCallback(async (directory: LocalDirectoryHandle) => {
    setStatus("scanning");
    setError(null);
    try {
      const files = await scanDirectory(directory);
      const map = new Map(files.map((file) => [file.path, file.handle]));
      const available = new Map(files.map((file) => [file.path.toLowerCase(), file.path]));

      // Read every `.txt` so UltraStar charts can find their audio/video by the
      // relative paths in their headers.
      const charts: { path: string; text: string }[] = [];
      for (const file of files) {
        if (!isSongTextPath(file.path)) continue;
        const handle = map.get(file.path);
        if (!handle) continue;
        try {
          charts.push({ path: file.path, text: await (await handle.getFile()).text() });
        } catch {
          // Unreadable chart; skip it.
        }
      }

      setHandles(map);
      setVideos(pairLocalFiles(files.map((file) => ({ path: file.path }))));
      setSongs(pairUltraStarSongs(charts, available));
      setFolder(directory.name);
    } catch {
      setError("That folder could not be read.");
    } finally {
      setStatus("idle");
    }
  }, []);

  // Offer a folder from a previous visit. If its permission is still granted,
  // rescan it straight away; otherwise wait for the player to click to reopen.
  useEffect(() => {
    let cancelled = false;
    void loadDirectoryHandle().then(async (handle) => {
      if (cancelled || !handle) return;
      setRemembered(handle);
      if (await hasReadPermission(handle)) {
        if (!cancelled) await scan(handle);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [scan]);

  const chooseFolder = useCallback(async () => {
    setError(null);
    try {
      const directory = await pickDirectory();
      if (!directory) {
        setError("This browser cannot open folders.");
        return;
      }
      await saveDirectoryHandle(directory);
      setRemembered(directory);
      await scan(directory);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError("The folder could not be opened.");
    }
  }, [scan]);

  const reopenFolder = useCallback(async () => {
    if (!remembered) return;
    setError(null);
    try {
      if (!(await ensureReadPermission(remembered))) {
        setError("Permission to read that folder was declined.");
        return;
      }
      await scan(remembered);
    } catch {
      setError("The folder could not be reopened.");
    }
  }, [remembered, scan]);

  const openVideo = useCallback(
    async (pair: LocalPair) => {
      const videoHandle = handles.get(pair.videoPath);
      const captionHandle = handles.get(pair.captionPath);
      if (!videoHandle || !captionHandle) return;
      setStatus("loading");
      setError(null);
      try {
        const [video, captions] = await Promise.all([
          videoHandle.getFile(),
          captionHandle.getFile(),
        ]);
        const track = buildLocalTrack({
          id: pair.id,
          lang: "en",
          title: pair.title,
          description: `Local video — ${pair.base}`,
          vtt: await captions.text(),
        });
        if (!track.words.length) {
          setError(`No timed lyrics were found in ${pair.captionPath}.`);
          return;
        }
        onSelect({ track, kind: "video", media: video, filePath: pair.videoPath });
      } catch {
        setError("That video and caption pair could not be loaded.");
      } finally {
        setStatus("idle");
      }
    },
    [handles, onSelect],
  );

  const openSong = useCallback(
    async (song: LocalUltraStarSong) => {
      const chartHandle = handles.get(song.songPath);
      const audioHandle = handles.get(song.audioPath);
      if (!chartHandle || !audioHandle) return;
      setStatus("loading");
      setError(null);
      try {
        const [chart, audio] = await Promise.all([
          chartHandle.getFile(),
          audioHandle.getFile(),
        ]);
        const parsed = parseUltraStar(await chart.text());
        const track = ultraStarTrack(parsed, {
          id: song.id,
          lang: "en",
          description: `UltraStar — ${parsed.artist || song.artist}`,
        });
        if (!track.words.length) {
          setError(`No lyrics were found in ${song.songPath}.`);
          return;
        }
        let backgroundVideo: File | undefined;
        if (song.videoPath) {
          const videoHandle = handles.get(song.videoPath);
          if (videoHandle) backgroundVideo = await videoHandle.getFile();
        }
        onSelect({
          track,
          kind: "audio",
          media: audio,
          backgroundVideo,
          videoGap: parsed.videoGap,
          filePath: song.songPath,
          artist: parsed.artist || song.artist,
        });
      } catch {
        setError("That UltraStar song could not be loaded.");
      } finally {
        setStatus("idle");
      }
    },
    [handles, onSelect],
  );

  const openItem = useCallback(
    (item: LocalItem) => (item.kind === "video" ? openVideo(item) : openSong(item)),
    [openVideo, openSong],
  );

  // A deep link (`/play/local?file=…`) opens its song once the folder is scanned.
  const openedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!requestedFile || !folder) return;
    if (openedRef.current === requestedFile) return;
    const item =
      songs.find((song) => song.songPath === requestedFile) ??
      videos.find((pair) => pair.videoPath === requestedFile);
    if (!item) return;
    openedRef.current = requestedFile;
    void openItem(item);
  }, [requestedFile, folder, songs, videos, openItem]);

  const busy = status !== "idle";
  const total = songs.length + videos.length;
  const needle = query.trim().toLowerCase();
  const matches = (text: string) => text.toLowerCase().includes(needle);
  const shownSongs = needle
    ? songs.filter(
        (song) =>
          matches(song.title) || matches(song.artist) || matches(song.base),
      )
    : songs;
  const shownVideos = needle
    ? videos.filter((pair) => matches(pair.title) || matches(pair.base))
    : videos;
  const shownTotal = shownSongs.length + shownVideos.length;
  // A deep link whose file is not in this folder (or not readable yet).
  const missing =
    requestedFile && folder && !songs.some((s) => s.songPath === requestedFile) &&
    !videos.some((v) => v.videoPath === requestedFile)
      ? requestedFile
      : null;

  return (
    <div className="local-library">
      {folder ? (
        <div className="local-library__results">
          <div className="local-library__results-head">
            <p className="group-label">
              {folder} — {total} {total === 1 ? "song" : "songs"}
            </p>
            <div className="local-library__tools">
              {total > 0 ? (
                <input
                  className="local-library__search"
                  type="search"
                  placeholder="Search songs…"
                  aria-label="Search local songs"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              ) : null}
              <button
                type="button"
                className="btn-game"
                onClick={chooseFolder}
                disabled={busy}
              >
                Choose another folder
              </button>
              {remembered && remembered.name !== folder ? (
                <button
                  type="button"
                  className="btn-game"
                  onClick={reopenFolder}
                  disabled={busy}
                >
                  Reopen {remembered.name}
                </button>
              ) : null}
            </div>
          </div>

          {missing ? (
            <p className="track-picker__error">
              Could not find <code>{missing}</code> in this folder. It may have
              moved, or the folder needs to be reopened.
            </p>
          ) : null}

          {total === 0 ? (
            <p className="track-picker__note">
              Nothing playable was found. TypeStar reads UltraStar charts
              (<code>#MP3</code> plus timed lyrics) and videos with a same-named{" "}
              <code>.vtt</code> caption — for example <code>song.mp4</code> and{" "}
              <code>song.vtt</code>.
            </p>
          ) : null}

          {total > 0 && shownTotal === 0 ? (
            <p className="track-picker__note">
              No songs match &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : null}

          {shownSongs.length ? (
            <div className="local-library__group">
              <p className="local-library__group-label">UltraStar</p>
              <div className="local-library__grid">
                {shownSongs.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    className="local-card"
                    onClick={() => openItem(song)}
                    disabled={busy}
                  >
                    <span className="local-card__title">{song.title}</span>
                    {song.artist ? (
                      <span className="local-card__artist">{song.artist}</span>
                    ) : null}
                    <span className="local-card__path">{song.base}</span>
                    <span className="local-card__files">
                      <span className="local-card__file">
                        {song.songPath.split("/").pop()}
                      </span>
                      <span className="local-card__file">
                        {song.audioPath.split("/").pop()}
                      </span>
                    </span>
                    <span className="local-card__badge">
                      {song.videoPath ? "Video" : "Lyrics"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {shownVideos.length ? (
            <div className="local-library__group">
              <p className="local-library__group-label">Video + captions</p>
              <div className="local-library__grid">
                {shownVideos.map((pair) => (
                  <button
                    key={pair.id}
                    type="button"
                    className="local-card"
                    onClick={() => openItem(pair)}
                    disabled={busy}
                  >
                    <span className="local-card__title">{pair.title}</span>
                    <span className="local-card__path">{pair.base}</span>
                    <span className="local-card__files">
                      <span className="local-card__file">
                        {pair.videoPath.split("/").pop()}
                      </span>
                      <span className="local-card__file">
                        {pair.captionPath.split("/").pop()}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="local-library__actions">
          <button
            type="button"
            className="btn-game btn-game--primary"
            onClick={chooseFolder}
            disabled={busy}
          >
            Choose folder
          </button>
          {remembered ? (
            <button
              type="button"
              className="btn-game"
              onClick={reopenFolder}
              disabled={busy}
            >
              Reopen {remembered.name}
            </button>
          ) : null}
        </div>
      )}

      {status === "scanning" ? (
        <p className="local-library__status">Scanning folder…</p>
      ) : null}
      {status === "loading" ? (
        <p className="local-library__status">Reading song…</p>
      ) : null}
      {error ? <p className="track-picker__error">{error}</p> : null}
    </div>
  );
}
