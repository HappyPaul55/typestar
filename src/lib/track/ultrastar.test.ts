import { describe, expect, test } from "bun:test";
import {
  parseUltraStar,
  parseUltraStarHeaders,
  secondsPerBeat,
  ultraStarTrack,
  ultraStarWords,
} from "./ultrastar";

const CHART = [
  "#TITLE:Test Song",
  "#ARTIST:Someone",
  "#MP3:audio.mp3",
  "#VIDEO:bg.mp4",
  "#BPM:120",
  "#GAP:1000",
  "#VIDEOGAP:2.5",
  "#LANGUAGE:English",
  ": 0 4 0 E",
  ": 4 4 0 v'ry",
  ": 8 4 0  time",
  ": 12 4 0 ~,",
  "- 16",
  ": 20 4 0  I",
  ": 24 4 0  go",
  "F 28 4 0  (ad lib)",
  "E",
].join("\n");

describe("parseUltraStarHeaders", () => {
  test("reads key/value pairs case-insensitively and stops at the body", () => {
    const headers = parseUltraStarHeaders(CHART);
    expect(headers.TITLE).toBe("Test Song");
    expect(headers.MP3).toBe("audio.mp3");
    expect(headers.VIDEOGAP).toBe("2.5");
  });
});

describe("secondsPerBeat", () => {
  test("quadruples the BPM value", () => {
    // 120 -> 480 beats per minute -> 0.125s per beat.
    expect(secondsPerBeat(120)).toBeCloseTo(0.125, 6);
    expect(secondsPerBeat(0)).toBe(0);
  });
});

describe("parseUltraStar", () => {
  test("reads metadata and times notes from BPM and GAP", () => {
    const song = parseUltraStar(CHART);
    expect(song.title).toBe("Test Song");
    expect(song.artist).toBe("Someone");
    expect(song.audio).toBe("audio.mp3");
    expect(song.video).toBe("bg.mp4");
    expect(song.videoGap).toBeCloseTo(2.5, 6);
    expect(song.bpm).toBe(120);
    expect(song.gap).toBe(1000);
    expect(song.language).toBe("English");

    const notes = song.notes.filter((note) => note.kind === "note");
    expect(notes).toHaveLength(6);
    expect(notes[0].start).toBeCloseTo(1, 6); // GAP 1s + beat 0
    expect(notes[1].start).toBeCloseTo(1.5, 6); // beat 4
    expect(notes[1].end).toBeCloseTo(2, 6);
  });

  test("keeps phrase markers in order and drops freestyle notes", () => {
    const song = parseUltraStar(CHART);
    const phrases = song.notes.filter((note) => note.kind === "phrase");
    expect(phrases).toHaveLength(1);
    expect(phrases[0].start).toBeCloseTo(3, 6); // GAP + beat 16
    // The freestyle `(ad lib)` note is not present.
    expect(song.notes.some((note) => note.text.includes("ad lib"))).toBe(false);
  });

  test("sings the first voice of a duet", () => {
    const duet = [
      "#BPM:120",
      "#GAP:0",
      "P1",
      ": 0 4 0  one",
      "P2",
      ": 0 4 0  two",
      ": 4 4 0  three",
      "E",
    ].join("\n");
    const song = parseUltraStar(duet);
    const notes = song.notes.filter((note) => note.kind === "note");
    expect(notes).toHaveLength(1);
    expect(notes[0].text).toBe(" one");
  });

  test("supports relative mode with beat offsets", () => {
    const relative = [
      "#BPM:120",
      "#GAP:1000",
      "#RELATIVE:yes",
      ": 0 4 0  one",
      "- 10 20",
      ": 0 4 0  two",
      "E",
    ].join("\n");
    const song = parseUltraStar(relative);
    const notes = song.notes.filter((note) => note.kind === "note");
    expect(notes[0].start).toBeCloseTo(1, 6);
    expect(notes[1].start).toBeCloseTo(3.5, 6);
  });
});

describe("ultraStarWords", () => {
  test("merges syllables with the leading-space and tilde rules", () => {
    const { words, lines } = ultraStarWords(parseUltraStar(CHART).notes);
    expect(words.map((word) => word.text)).toEqual(["Ev'ry", "time,", "I", "go"]);
    expect(words.map((word) => word.match)).toEqual(["evry", "time", "i", "go"]);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ from: 0, to: 2 });
    expect(lines[1]).toMatchObject({ from: 2, to: 4 });
  });

  test("links each note to the word it belongs to, preserving pitch", () => {
    const { words, notes } = ultraStarWords(parseUltraStar(CHART).notes);
    expect(words).toHaveLength(4);
    expect(notes).toHaveLength(6);
    // "E" + "v'ry" are both part of word 0.
    expect(notes.map((note) => note.word)).toEqual([0, 0, 1, 1, 2, 3]);
    expect(notes.every((note) => note.pitch === 0)).toBe(true);
    // Word starts line up with the first note of each word.
    expect(notes[0].start).toBeCloseTo(words[0].start, 6);
    expect(notes[2].start).toBeCloseTo(words[1].start, 6);
  });

  test("keeps held (empty tilde) notes inside the word", () => {
    const chart = [
      "#BPM:120",
      "#GAP:0",
      ": 0 4 0  lo",
      ": 4 4 0 ~",
      ": 8 4 0 ~ng",
      "- 12",
      "E",
    ].join("\n");
    const { words, notes } = ultraStarWords(parseUltraStar(chart).notes);
    expect(words.map((word) => word.text)).toEqual(["long"]);
    // All three syllable notes map to the one word.
    expect(notes.map((note) => note.word)).toEqual([0, 0, 0]);
  });

  test("splits marker-less songs on musical gaps", () => {
    const chart = [
      "#BPM:120",
      "#GAP:0",
      ": 0 4 0  one",
      ": 4 4 0  two",
      // A long pause (beat 100 is 12.5s in).
      ": 100 4 0  three",
      "E",
    ].join("\n");
    const { lines } = ultraStarWords(parseUltraStar(chart).notes);
    expect(lines).toHaveLength(2);
  });
});

describe("note kinds and pitch", () => {
  test("reads the pitch in semitones relative to C4", () => {
    const chart = ["#BPM:120", "#GAP:0", ": 0 4 5  do", ": 4 4 -2  re", "E"].join("\n");
    const notes = parseUltraStar(chart).notes.filter((note) => note.kind === "note");
    expect(notes.map((note) => note.pitch)).toEqual([5, -2]);
    expect(notes.every((note) => note.noteKind === "normal")).toBe(true);
  });

  test("maps golden, rap and golden-rap note types", () => {
    const chart = [
      "#BPM:120",
      "#GAP:0",
      ": 0 4 0  a",
      "* 4 4 0  b",
      "R 8 4 0  c",
      "G 12 4 0  d",
      "E",
    ].join("\n");
    const notes = parseUltraStar(chart).notes.filter((note) => note.kind === "note");
    expect(notes.map((note) => note.noteKind)).toEqual([
      "normal",
      "golden",
      "rap",
      "goldenRap",
    ]);
    // Rap notes carry no meaningful pitch.
    expect(notes.map((note) => note.pitch)).toEqual([0, 0, null, null]);
  });
});

describe("ultraStarTrack", () => {
  test("builds a word-timed track", () => {
    const song = parseUltraStar(CHART);
    const track = ultraStarTrack(song, {
      id: "ultrastar:song",
      lang: "en",
      description: "UltraStar — Someone",
    });
    expect(track.id).toBe("ultrastar:song");
    expect(track.title).toBe("Test Song");
    expect(track.words).toHaveLength(4);
    expect(track.lines).toHaveLength(2);
    expect(track.source.captions).toBe("manual");
  });

  test("attaches per-note pitch data", () => {
    const track = ultraStarTrack(parseUltraStar(CHART), {
      id: "ultrastar:song",
      lang: "en",
      description: "UltraStar — Someone",
    });
    expect(track.notes).toHaveLength(6);
    expect(track.notes?.every((note) => note.word < track.words.length)).toBe(true);
  });

  test("omits notes for a chart with no lyric notes", () => {
    const chart = ["#BPM:120", "#GAP:0", "F 0 4 0  (oooh)", "E"].join("\n");
    const track = ultraStarTrack(parseUltraStar(chart), {
      id: "empty",
      lang: "en",
      description: "",
    });
    expect(track.notes).toBeUndefined();
  });
});
