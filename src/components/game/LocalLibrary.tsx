/**
 * The local-file picker: choose one or more folders of songs.
 *
 * Two kinds of local song are recognised:
 *
 * - **UltraStar** — a `.txt` chart that names its own audio (and optional
 *   background video); the lyrics are timed per syllable, so the words line up
 *   exactly with the music.
 * - **Video + WebVTT** — a video file and a same-named `.vtt` caption file.
 *
 * Reachable at `/play/local` (only offered when the browser supports the File
 * System Access API). Folders are remembered in IndexedDB; they can be added
 * and removed, and read permission is re-requested on a click.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { buildLocalTrack } from "../../lib/track/build";
import { parseUltraStar, ultraStarTrack } from "../../lib/track/ultrastar";
import type { Track } from "../../lib/track/types";
import {
  ensureReadPermission,
  isSongTextPath,
  pairLocalFiles,
  pairUltraStarSongs,
  pickDirectory,
  pruneNestedFolders,
  scanDirectory,
  type LocalDirectoryHandle,
  type LocalFileHandle,
  type LocalItem,
  type LocalPair,
  type LocalUltraStarSong,
} from "../../lib/local/library";
import { loadDirectoryHandles, saveDirectoryHandles } from "../../lib/local/idb";
import TrackCard from "./TrackCard";

export interface LocalSelection {
  track: Track;
  /** `video` plays the file as the clock; `audio` uses the hidden audio. */
  kind: "video" | "audio";
  /** Master media: the video for a VTT pair, the audio for UltraStar. */
  media: File;
  /** UltraStar background video, synced to the audio, when the chart names one. */
  backgroundVideo?: File;
  /** UltraStar `#COVER`, shown as the backdrop when there is no background video. */
  cover?: File;
  /** UltraStar `#VIDEOGAP`, in seconds. */
  videoGap?: number;
  /** Deep-link reference (`<folder>/<path>`), used in `/play/local?file=…`. */
  filePath: string;
  /** The song's artist, when the chart names one. */
  artist?: string;
}

type Status = "idle" | "scanning" | "loading";

interface ScannedEntry {
  folderId: string;
  folderName: string;
  path: string;
  handle: LocalFileHandle;
}

export default function LocalLibrary({
  requestedFile = null,
  onSelect,
}: {
  /** A song to open automatically, from `/play/local?file=…`. */
  requestedFile?: string | null;
  onSelect(selection: LocalSelection): void;
}) {
  const [folders, setFolders] = useState<LocalDirectoryHandle[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [songs, setSongs] = useState<LocalUltraStarSong[]>([]);
  const [videos, setVideos] = useState<LocalPair[]>([]);
  const [handles, setHandles] = useState<Map<string, LocalFileHandle>>(new Map());
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const scan = useCallback(async (folderList: LocalDirectoryHandle[]) => {
    setStatus("scanning");
    setError(null);
    try {
      // A folder inside another would list its songs twice. Keep every folder in
      // the list, but only scan the outermost ones; the nested ones just
      // contribute nothing new.
      const outermost = new Set(await pruneNestedFolders(folderList));
      const entries: ScannedEntry[] = [];
      const denied: string[] = [];
      for (let index = 0; index < folderList.length; index++) {
        const folder = folderList[index];
        if (!outermost.has(folder)) continue;
        const folderId = String(index);
        try {
          const files = await scanDirectory(folder);
          for (const file of files) {
            entries.push({
              folderId,
              folderName: folder.name,
              path: file.path,
              handle: file.handle,
            });
          }
        } catch {
          // Permission not granted (or the folder is gone): note it and move on.
          denied.push(folder.name);
        }
      }

      const map = new Map(entries.map((entry) => [key(entry.folderId, entry.path), entry.handle]));
      const available = new Map(
        entries.map((entry) => [key(entry.folderId, entry.path.toLowerCase()), entry.path]),
      );

      // Read every `.txt` so UltraStar charts can find their audio/video by the
      // relative paths in their headers.
      const charts: {
        folderId: string;
        folderName: string;
        path: string;
        text: string;
      }[] = [];
      for (const entry of entries) {
        if (!isSongTextPath(entry.path)) continue;
        try {
          charts.push({
            folderId: entry.folderId,
            folderName: entry.folderName,
            path: entry.path,
            text: await (await entry.handle.getFile()).text(),
          });
        } catch {
          // Unreadable chart; skip it.
        }
      }

      setHandles(map);
      setVideos(
        pairLocalFiles(
          entries.map((entry) => ({
            folderId: entry.folderId,
            folderName: entry.folderName,
            path: entry.path,
          })),
        ),
      );
      setSongs(pairUltraStarSongs(charts, available));
      setBlocked(denied);
    } catch {
      setError("Those folders could not be read.");
    } finally {
      setStatus("idle");
    }
  }, []);

  // Restore remembered folders and scan the ones already permitted.
  useEffect(() => {
    let cancelled = false;
    void loadDirectoryHandles().then(async (remembered) => {
      if (cancelled || !remembered.length) return;
      setFolders(remembered);
      await scan(remembered);
    });
    return () => {
      cancelled = true;
    };
  }, [scan]);

  const addFolder = useCallback(async () => {
    setError(null);
    try {
      const directory = await pickDirectory();
      if (!directory) {
        setError("This browser cannot open folders.");
        return;
      }
      const next = [...folders, directory];
      await saveDirectoryHandles(next);
      setFolders(next);
      await scan(next);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError("The folder could not be opened.");
    }
  }, [folders, scan]);

  const reopenFolders = useCallback(async () => {
    if (!folders.length) return;
    setError(null);
    try {
      // Best-effort: a browser may only grant one folder per gesture, so the
      // button stays and repeated clicks grant the rest.
      for (const folder of folders) {
        await ensureReadPermission(folder);
      }
      await scan(folders);
    } catch {
      setError("The folders could not be reopened.");
    }
  }, [folders, scan]);

  const removeFolder = useCallback(
    async (folder: LocalDirectoryHandle) => {
      const next = folders.filter((item) => item !== folder);
      setError(null);
      await saveDirectoryHandles(next);
      setFolders(next);
      if (next.length) {
        await scan(next);
      } else {
        // Nothing left: clear the results so the landing shows again.
        setSongs([]);
        setVideos([]);
        setHandles(new Map());
        setBlocked([]);
        setQuery("");
      }
    },
    [folders, scan],
  );

  const openVideo = useCallback(
    async (pair: LocalPair) => {
      const videoHandle = handles.get(key(pair.folderId, pair.videoPath));
      const captionHandle = handles.get(key(pair.folderId, pair.captionPath));
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
        onSelect({ track, kind: "video", media: video, filePath: pair.ref });
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
      const chartHandle = handles.get(key(song.folderId, song.songPath));
      const audioHandle = handles.get(key(song.folderId, song.audioPath));
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
          const videoHandle = handles.get(key(song.folderId, song.videoPath));
          if (videoHandle) backgroundVideo = await videoHandle.getFile();
        }
        // The cover is only shown when there is no background video.
        let cover: File | undefined;
        if (!backgroundVideo && song.coverPath) {
          const coverHandle = handles.get(key(song.folderId, song.coverPath));
          if (coverHandle) cover = await coverHandle.getFile();
        }
        onSelect({
          track,
          kind: "audio",
          media: audio,
          backgroundVideo,
          cover,
          videoGap: parsed.videoGap,
          filePath: song.ref,
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

  // A deep link (`/play/local?file=…`) opens its song once the folders are scanned.
  const openedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!requestedFile || !folders.length) return;
    if (openedRef.current === requestedFile) return;
    const item =
      songs.find((song) => song.ref === requestedFile) ??
      videos.find((pair) => pair.ref === requestedFile);
    if (!item) return;
    openedRef.current = requestedFile;
    void openItem(item);
  }, [requestedFile, folders, songs, videos, openItem]);

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
  const folderNames = folders.map((folder) => folder.name);
  const singleFolder = folders.length === 1;
  // One folder shows its name; two or more show the count (with the tooltip).
  const folderLabel = singleFolder ? folders[0].name : `${folders.length} folders`;
  // How many songs each folder contributes, by its id (its index in the list).
  const countByFolder = new Map<string, number>();
  for (const song of songs) {
    countByFolder.set(song.folderId, (countByFolder.get(song.folderId) ?? 0) + 1);
  }
  for (const pair of videos) {
    countByFolder.set(pair.folderId, (countByFolder.get(pair.folderId) ?? 0) + 1);
  }
  // A deep link whose file is not in these folders (or not readable yet).
  const missing =
    requestedFile &&
    folders.length &&
    !songs.some((song) => song.ref === requestedFile) &&
    !videos.some((pair) => pair.ref === requestedFile)
      ? requestedFile
      : null;

  return (
    <div className="local-library">
      {folders.length ? (
        <div className="local-library__results">
          <div className="local-library__results-head">
            <p className="group-label">
              <span
                className={
                  "local-library__folders" +
                  (singleFolder ? " local-library__folders--single" : "")
                }
                tabIndex={singleFolder ? undefined : 0}
                aria-label={singleFolder ? undefined : `Folders: ${folderNames.join(", ")}`}
              >
                {folderLabel} — {total} {total === 1 ? "song" : "songs"}
                {singleFolder ? null : (
                  <span className="local-library__folders-tip" role="tooltip">
                    {folderNames.map((name) => (
                      <span key={name} className="local-library__folders-name">
                        {name}
                      </span>
                    ))}
                  </span>
                )}
              </span>
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
                onClick={addFolder}
                disabled={busy}
              >
                Add another folder
              </button>
              {blocked.length ? (
                <button
                  type="button"
                  className="btn-game btn-game--primary"
                  onClick={reopenFolders}
                  disabled={busy}
                >
                  Reopen {blocked.length === 1 ? blocked[0] : "folders"}
                </button>
              ) : null}
            </div>
          </div>

          {missing ? (
            <p className="track-picker__error">
              Could not find <code>{missing}</code> in these folders. It may have
              moved, or a folder needs to be reopened.
            </p>
          ) : null}

          {blocked.length ? (
            <p className="track-picker__note">
              {blocked.length === 1
                ? `“${blocked[0]}” needs permission before its songs can be shown.`
                : `${blocked.length} folders need permission before their songs can be shown.`}
            </p>
          ) : null}

          {total === 0 && !blocked.length ? (
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
                  <TrackCard
                    key={song.id}
                    href={`/play/local?file=${encodeURIComponent(song.ref)}`}
                    title={song.title}
                    subtitle={song.artist}
                    busy={busy}
                    square
                    onOpen={() => openItem(song)}
                    media={
                      <LocalCover
                        handle={
                          song.coverPath
                            ? handles.get(key(song.folderId, song.coverPath))
                            : undefined
                        }
                        kind="lyrics"
                      />
                    }
                    badge={
                      <span className="track-card__badge">
                        {song.videoPath ? "Video" : "Lyrics"}
                      </span>
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}

          {shownVideos.length ? (
            <div className="local-library__group">
              <p className="local-library__group-label">Video + captions</p>
              <div className="local-library__grid">
                {shownVideos.map((pair) => {
                  const album = parentPath(pair.base);
                  return (
                    <TrackCard
                      key={pair.id}
                      href={`/play/local?file=${encodeURIComponent(pair.ref)}`}
                      title={pair.title}
                      subtitle={album}
                      busy={busy}
                      onOpen={() => openItem(pair)}
                      media={<LocalCover kind="video" />}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          <p className="local-library__foot">
            This page is made up of{" "}
            {folders.map((folder, index) => {
              const count = countByFolder.get(String(index)) ?? 0;
              const separator =
                index === folders.length - 1
                  ? ""
                  : index === folders.length - 2
                    ? " and "
                    : ", ";
              return (
                <span key={`${folder.name}-${index}`}>
                  <button
                    type="button"
                    className="local-library__remove"
                    onClick={() => removeFolder(folder)}
                    disabled={busy}
                    title={`Remove ${folder.name}`}
                  >
                    {folder.name}
                  </button>{" "}
                  ({songCountLabel(count)}){separator}
                </span>
              );
            })}
            . To remove a folder, click its name.
          </p>
        </div>
      ) : (
        <div className="local-library__actions">
          <a className="local-choice" href="/play">
            <span className="local-choice__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <rect
                  x="2"
                  y="5"
                  width="20"
                  height="14"
                  rx="4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path d="M10 9l5 3-5 3z" fill="currentColor" />
              </svg>
            </span>
            <span className="local-choice__body">
              <span className="local-choice__title">YouTube</span>
              <span className="local-choice__desc">
                Pick a featured track, or paste a YouTube link.
              </span>
            </span>
          </a>

          <button
            type="button"
            className="local-choice local-choice--primary"
            onClick={addFolder}
            disabled={busy}
          >
            <span className="local-choice__icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="28"
                height="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            </span>
            <span className="local-choice__body">
              <span className="local-choice__title">Choose a folder</span>
              <span className="local-choice__desc">
                Play UltraStar songs, or videos with matching .vtt captions,
                from this device. Nothing is uploaded.
              </span>
            </span>
          </button>
        </div>
      )}

      {status === "scanning" ? (
        <p className="local-library__status">Scanning folders…</p>
      ) : null}
      {status === "loading" ? (
        <p className="local-library__status">Reading song…</p>
      ) : null}
      {error ? <p className="track-picker__error">{error}</p> : null}
    </div>
  );
}

/** Key for the per-file handle map, scoped to its folder. */
function key(folderId: string, path: string): string {
  return `${folderId}:${path}`;
}

/** `2 songs`, `1 song`, or `no songs` for the folder summary. */
function songCountLabel(count: number): string {
  if (count === 0) return "no songs";
  return `${count} ${count === 1 ? "song" : "songs"}`;
}

/** The directory part of a relative path, or `""` when it sits at the root. */
function parentPath(path: string): string {
  const slash = path.lastIndexOf("/");
  return slash > 0 ? path.slice(0, slash) : "";
}

/**
 * A song's cover: the UltraStar `#COVER` image when one is found, otherwise a
 * grey placeholder. The image is read from its local file handle and shown via
 * an object URL, which is revoked when the card unmounts or the cover changes.
 */
function LocalCover({
  handle,
  kind,
}: {
  handle?: LocalFileHandle;
  kind: "lyrics" | "video";
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(null);
    if (!handle) return;
    let url: string | null = null;
    let cancelled = false;
    void handle
      .getFile()
      .then((file) => {
        if (cancelled) return;
        url = URL.createObjectURL(file);
        setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [handle]);

  if (src) {
    return (
      <img
        className="track-card__art"
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setSrc(null)}
      />
    );
  }
  return (
    <span className="track-card__placeholder" aria-hidden="true">
      {kind === "video" ? <FilmGlyph /> : <NoteGlyph />}
    </span>
  );
}

function NoteGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" aria-hidden="true">
      <path
        d="M9 17V5l9-2v12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="6.6" cy="17.6" rx="2.5" ry="2" stroke="currentColor" strokeWidth="1.8" />
      <ellipse cx="15.6" cy="15.6" rx="2.5" ry="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function FilmGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
