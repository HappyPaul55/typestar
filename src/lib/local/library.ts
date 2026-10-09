/**
 * The local video library.
 *
 * With the File System Access API the player can point TypeStar at a folder of
 * local songs. Two kinds are recognised:
 *
 * - a video and a same-named WebVTT caption (see {@link pairLocalFiles});
 * - an UltraStar `.txt` song, which references its own audio and optional
 *   background video (see {@link pairUltraStarSongs}).
 *
 * The pairing and path helpers are pure and unit-tested; only
 * {@link pickDirectory}, {@link scanDirectory} and {@link ensureReadPermission}
 * touch browser APIs.
 */

import { parseUltraStarHeaders } from "../track/ultrastar";

/**
 * Video containers the browser can usually play. The `<video>` element decides
 * what it actually supports; anything unplayable simply reports an error.
 */
export const VIDEO_EXTENSIONS = [
  "mp4",
  "m4v",
  "webm",
  "mkv",
  "mov",
  "ogv",
  "ogg",
  "avi",
] as const;

/** Caption formats TypeStar can read. */
export const CAPTION_EXTENSIONS = ["vtt"] as const;

/** How deep the folder walk goes; the chosen folder itself is depth 0. */
export const MAX_SCAN_DEPTH = 4;

/**
 * The subset of the File System Access API TypeStar uses. Declared locally
 * rather than leaning on `lib.dom`, which does not ship `showDirectoryPicker`.
 */
export interface LocalFileHandle {
  readonly kind: "file";
  readonly name: string;
  getFile(): Promise<File>;
}

export interface LocalDirectoryHandle {
  readonly kind: "directory";
  readonly name: string;
  entries(): AsyncIterableIterator<[string, LocalFileHandle | LocalDirectoryHandle]>;
  queryPermission?(descriptor?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
  requestPermission?(descriptor?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
}

type DirectoryPicker = (options?: {
  id?: string;
  mode?: "read" | "readwrite";
}) => Promise<LocalDirectoryHandle>;

function directoryPicker(): DirectoryPicker | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as unknown as { showDirectoryPicker?: unknown })
    .showDirectoryPicker;
  return typeof candidate === "function"
    ? (candidate as DirectoryPicker).bind(window)
    : null;
}

/** Whether this browser can open a local folder (Chromium, and not all of it). */
export function supportsLocalLibrary(): boolean {
  return directoryPicker() !== null;
}

/** Prompt for a folder. Resolves to `null` when the API is unavailable. */
export async function pickDirectory(): Promise<LocalDirectoryHandle | null> {
  const show = directoryPicker();
  if (!show) return null;
  return show({ id: "typestar-local", mode: "read" });
}

/**
 * Make sure we may read the folder, requesting permission when it is not
 * already granted. Call this from a user gesture: browsers refuse to show the
 * permission prompt otherwise.
 */
export async function ensureReadPermission(
  handle: LocalDirectoryHandle,
): Promise<boolean> {
  const descriptor = { mode: "read" as const };
  try {
    if (handle.queryPermission && (await handle.queryPermission(descriptor)) === "granted") {
      return true;
    }
    if (handle.requestPermission) {
      return (await handle.requestPermission(descriptor)) === "granted";
    }
  } catch {
    return false;
  }
  // No permission API: assume a plain read handle is usable.
  return true;
}

/**
 * Whether read permission is already granted, without prompting. Safe to call
 * outside a user gesture (unlike {@link ensureReadPermission}).
 */
export async function hasReadPermission(handle: LocalDirectoryHandle): Promise<boolean> {
  if (!handle.queryPermission) return false;
  try {
    return (await handle.queryPermission({ mode: "read" })) === "granted";
  } catch {
    return false;
  }
}

export interface LocalFileEntry {
  /** Path relative to the chosen folder, using `/` separators. */
  path: string;
}

export interface LocalPair {
  kind: "video";
  /** Stable id derived from the relative path (without its extension). */
  id: string;
  /** Relative path without its extension, e.g. `Album/Song`. */
  base: string;
  /** Display title: the file's base name. */
  title: string;
  /** Relative path of the video file. */
  videoPath: string;
  /** Relative path of the caption file. */
  captionPath: string;
}

/** An UltraStar song: a `.txt` chart plus its referenced audio/video files. */
export interface LocalUltraStarSong {
  kind: "ultrastar";
  id: string;
  base: string;
  title: string;
  artist: string;
  /** Relative path of the `.txt` chart. */
  songPath: string;
  /** Relative path of the `#MP3` audio. */
  audioPath: string;
  /** Relative path of the `#VIDEO`, when present and found. */
  videoPath: string | null;
}

export type LocalItem = LocalPair | LocalUltraStarSong;

export interface ScannedFile {
  path: string;
  handle: LocalFileHandle;
}

function fileNameOf(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

function extensionOf(path: string): string {
  const name = fileNameOf(path);
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/** The path with its final extension removed, keeping the directory. */
export function stripExtension(path: string): string {
  const name = fileNameOf(path);
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return path.slice(0, path.lastIndexOf("/") + 1) + base;
}

export function isVideoPath(path: string): boolean {
  return (VIDEO_EXTENSIONS as readonly string[]).includes(extensionOf(path));
}

export function isCaptionPath(path: string): boolean {
  return (CAPTION_EXTENSIONS as readonly string[]).includes(extensionOf(path));
}

/**
 * Pair videos with same-named WebVTT captions. Matching is case-insensitive on
 * the relative path, so `Song.mp4` pairs with `song.vtt`. Any file without a
 * partner is dropped, and the result is sorted by path.
 */
export function pairLocalFiles(files: readonly LocalFileEntry[]): LocalPair[] {
  interface Slot {
    base: string;
    videoPath?: string;
    captionPath?: string;
  }

  const slots = new Map<string, Slot>();
  for (const file of files) {
    const isVideo = isVideoPath(file.path);
    if (!isVideo && !isCaptionPath(file.path)) continue;
    const base = stripExtension(file.path);
    const key = base.toLowerCase();
    const slot = slots.get(key) ?? { base };
    if (isVideo) slot.videoPath = file.path;
    else slot.captionPath = file.path;
    slots.set(key, slot);
  }

  const pairs: LocalPair[] = [];
  for (const slot of slots.values()) {
    if (!slot.videoPath || !slot.captionPath) continue;
    pairs.push({
      kind: "video",
      id: `local:${slot.base}`,
      base: slot.base,
      title: fileNameOf(slot.base),
      videoPath: slot.videoPath,
      captionPath: slot.captionPath,
    });
  }
  return pairs.sort((a, b) => a.base.localeCompare(b.base));
}

/** Whether a path could be an UltraStar chart (a `.txt` file). */
export function isSongTextPath(path: string): boolean {
  return extensionOf(path) === "txt";
}

/**
 * Resolve a header file reference (which may use `\`, `./` or `../`) against
 * the directory of the song file, giving a path relative to the chosen folder.
 */
export function resolveRelativePath(fromPath: string, reference: string): string {
  const normalised = reference.replace(/\\/g, "/").replace(/^\/+/, "");
  const dir = fromPath.includes("/") ? fromPath.slice(0, fromPath.lastIndexOf("/")) : "";
  const segments = (dir ? `${dir}/${normalised}` : normalised).split("/");
  const stack: string[] = [];
  for (const segment of segments) {
    if (!segment || segment === ".") continue;
    if (segment === "..") stack.pop();
    else stack.push(segment);
  }
  return stack.join("/");
}

/**
 * Pair UltraStar `.txt` charts with their referenced audio (and optional
 * video). `available` maps a lower-cased relative path to its real path, so
 * lookups match Windows/macOS case-insensitivity. Charts without a findable
 * `#MP3` are skipped.
 */
export function pairUltraStarSongs(
  charts: readonly { path: string; text: string }[],
  available: ReadonlyMap<string, string>,
): LocalUltraStarSong[] {
  const songs: LocalUltraStarSong[] = [];
  for (const chart of charts) {
    const headers = parseUltraStarHeaders(chart.text);
    const mp3 = headers.MP3;
    if (!mp3) continue;
    const audioPath = available.get(resolveRelativePath(chart.path, mp3).toLowerCase());
    if (!audioPath) continue;
    const videoRef = headers.VIDEO;
    const videoPath = videoRef
      ? (available.get(resolveRelativePath(chart.path, videoRef).toLowerCase()) ?? null)
      : null;
    const base = stripExtension(chart.path);
    songs.push({
      kind: "ultrastar",
      id: `ultrastar:${base}`,
      base,
      title: headers.TITLE || fileNameOf(base),
      artist: headers.ARTIST ?? "",
      songPath: chart.path,
      audioPath,
      videoPath,
    });
  }
  return songs.sort((a, b) => a.base.localeCompare(b.base));
}

/**
 * Walk a directory for files, up to {@link MAX_SCAN_DEPTH} levels below it.
 * Anything deeper is ignored so a runaway tree cannot stall the picker.
 */
export async function scanDirectory(
  directory: LocalDirectoryHandle,
  depth = 0,
  prefix = "",
  out: ScannedFile[] = [],
): Promise<ScannedFile[]> {
  for await (const [name, handle] of directory.entries()) {
    const path = prefix ? `${prefix}/${name}` : name;
    if (handle.kind === "file") {
      out.push({ path, handle });
    } else if (depth < MAX_SCAN_DEPTH) {
      await scanDirectory(handle, depth + 1, path, out);
    }
  }
  return out;
}
