import { describe, expect, test } from "bun:test";
import {
  isCaptionPath,
  isSongTextPath,
  isVideoPath,
  MAX_SCAN_DEPTH,
  pairLocalFiles,
  pairUltraStarSongs,
  resolveRelativePath,
  scanDirectory,
  stripExtension,
  type LocalDirectoryHandle,
  type LocalFileHandle,
} from "./library";

function fakeFile(name: string): LocalFileHandle {
  return {
    kind: "file",
    name,
    getFile: async () => ({ name }) as unknown as File,
  };
}

function fakeDir(
  name: string,
  children: Record<string, LocalFileHandle | LocalDirectoryHandle>,
): LocalDirectoryHandle {
  return {
    kind: "directory",
    name,
    entries() {
      return (async function* () {
        for (const [childName, handle] of Object.entries(children)) {
          yield [childName, handle] as [string, LocalFileHandle | LocalDirectoryHandle];
        }
      })();
    },
  };
}

describe("path helpers", () => {
  test("recognise video and caption extensions case-insensitively", () => {
    expect(isVideoPath("Album/Song.MP4")).toBe(true);
    expect(isVideoPath("clip.webm")).toBe(true);
    expect(isVideoPath("song.vtt")).toBe(false);
    expect(isCaptionPath("Album/Song.VTT")).toBe(true);
    expect(isCaptionPath("song.srt")).toBe(false);
  });

  test("stripExtension keeps the directory and drops the final extension", () => {
    expect(stripExtension("Album/Song.mp4")).toBe("Album/Song");
    expect(stripExtension("no-extension")).toBe("no-extension");
    expect(stripExtension("weird.name.vtt")).toBe("weird.name");
  });
});

describe("pairLocalFiles", () => {
  test("pairs a video with its same-named caption file", () => {
    const pairs = pairLocalFiles([
      { path: "Album/Song.mp4" },
      { path: "Album/Song.vtt" },
    ]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({
      base: "Album/Song",
      title: "Song",
      videoPath: "Album/Song.mp4",
      captionPath: "Album/Song.vtt",
    });
  });

  test("matches case-insensitively and sorts by path", () => {
    const pairs = pairLocalFiles([
      { path: "b/Song.mp4" },
      { path: "b/song.VTT" },
      { path: "a/Other.webm" },
      { path: "a/other.vtt" },
    ]);
    expect(pairs.map((pair) => pair.base)).toEqual(["a/Other", "b/Song"]);
  });

  test("drops files without a partner and ignores unrelated files", () => {
    const pairs = pairLocalFiles([
      { path: "only-video.mp4" },
      { path: "only-captions.vtt" },
      { path: "cover.jpg" },
      { path: "notes.txt" },
      { path: "ok.mp4" },
      { path: "ok.vtt" },
    ]);
    expect(pairs.map((pair) => pair.base)).toEqual(["ok"]);
  });
});

describe("resolveRelativePath", () => {
  test("resolves a reference against the song's folder", () => {
    expect(resolveRelativePath("Album/song.txt", "audio.mp3")).toBe("Album/audio.mp3");
    expect(resolveRelativePath("song.txt", "audio.mp3")).toBe("audio.mp3");
    expect(resolveRelativePath("Album/song.txt", "sub\\audio.mp3")).toBe(
      "Album/sub/audio.mp3",
    );
    expect(resolveRelativePath("Album/song.txt", "../shared/audio.mp3")).toBe(
      "shared/audio.mp3",
    );
    expect(resolveRelativePath("song.txt", "/abs/audio.mp3")).toBe("abs/audio.mp3");
  });

  test("recognises .txt charts", () => {
    expect(isSongTextPath("Album/song.TXT")).toBe(true);
    expect(isSongTextPath("Album/song.vtt")).toBe(false);
  });
});

describe("pairUltraStarSongs", () => {
  test("pairs charts with their referenced audio and video", () => {
    const available = new Map([
      ["album/song.txt", "Album/song.txt"],
      ["album/audio.mp3", "Album/Audio.MP3"],
      ["album/bg.mp4", "Album/bg.mp4"],
    ]);
    const songs = pairUltraStarSongs(
      [
        {
          path: "Album/song.txt",
          text: "#TITLE:T\n#ARTIST:A\n#MP3:audio.mp3\n#VIDEO:bg.mp4\n",
        },
        // No matching audio: skipped.
        { path: "Album/other.txt", text: "#MP3:missing.mp3\n" },
      ],
      available,
    );
    expect(songs).toHaveLength(1);
    expect(songs[0]).toMatchObject({
      kind: "ultrastar",
      title: "T",
      artist: "A",
      audioPath: "Album/Audio.MP3",
      videoPath: "Album/bg.mp4",
    });
  });
});

describe("scanDirectory", () => {
  test("walks files up to the depth cap", () => {
    // Build root → d1 → … → d5, with a video at each level.
    const deep = fakeDir("d5", { "deep.mp4": fakeFile("deep.mp4") });
    const d4 = fakeDir("d4", { "d.mp4": fakeFile("d.mp4"), d5: deep });
    const d3 = fakeDir("d3", { "c.mp4": fakeFile("c.mp4"), d4 });
    const d2 = fakeDir("d2", { "b.mp4": fakeFile("b.mp4"), d3 });
    const d1 = fakeDir("d1", { "a.mp4": fakeFile("a.mp4"), d2 });
    const root = fakeDir("root", { "root.mp4": fakeFile("root.mp4"), d1 });

    return scanDirectory(root).then((files) => {
      const paths = files.map((file) => file.path).sort();
      expect(paths).toEqual([
        "d1/a.mp4",
        "d1/d2/b.mp4",
        "d1/d2/d3/c.mp4",
        "d1/d2/d3/d4/d.mp4",
        "root.mp4",
      ]);
      // The file one level below the cap is excluded.
      expect(paths).not.toContain("d1/d2/d3/d4/d5/deep.mp4");
      expect(MAX_SCAN_DEPTH).toBe(4);
    });
  });
});
