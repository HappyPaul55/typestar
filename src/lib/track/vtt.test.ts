import { describe, expect, test } from "bun:test";
import { buildLocalTrack } from "./build";
import { parseVtt, parseVttCues, parseVttTimestamp, stripVttTags } from "./vtt";

describe("parseVttTimestamp", () => {
  test("reads MM:SS.mmm and HH:MM:SS.mmm", () => {
    expect(parseVttTimestamp("00:01.500")).toBeCloseTo(1.5, 5);
    expect(parseVttTimestamp("01:02:03.250")).toBeCloseTo(3723.25, 5);
    expect(parseVttTimestamp("2:03.000")).toBeCloseTo(123, 5);
  });

  test("accepts a comma as the millisecond separator", () => {
    expect(parseVttTimestamp("00:00:03,5")).toBeCloseTo(3.5, 5);
  });

  test("rejects anything that is not a timestamp", () => {
    expect(parseVttTimestamp("nope")).toBeNull();
    expect(parseVttTimestamp("")).toBeNull();
  });
});

describe("stripVttTags", () => {
  test("removes voice, class and styling tags", () => {
    expect(stripVttTags("<v Roger>Hello <b>world</b>")).toBe("Hello world");
    expect(stripVttTags("<c.yellow>Shine</c>")).toBe("Shine");
  });
});

describe("parseVttCues", () => {
  test("reads cues and skips the header, notes and styling blocks", () => {
    const vtt = [
      "WEBVTT",
      "",
      "NOTE a comment",
      "",
      "STYLE",
      "::cue { color: yellow }",
      "",
      "intro",
      "00:00:01.000 --> 00:00:03.000",
      "Hello world",
      "",
      "00:00:03.500 --> 00:00:05.000 align:start",
      "We're here",
    ].join("\n");

    const cues = parseVttCues(vtt);
    expect(cues).toHaveLength(2);
    expect(cues[0]).toMatchObject({ start: 1, end: 3, text: "Hello world" });
    expect(cues[1].text).toBe("We're here");
  });

  test("handles a header that shares its block with the first cue", () => {
    const cues = parseVttCues("WEBVTT\n00:00:00.000 --> 00:00:01.000\nHi");
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe("Hi");
  });

  test("drops empty cues and reversed spans", () => {
    const vtt = [
      "WEBVTT",
      "",
      "00:00:00.000 --> 00:00:01.000",
      "",
      "00:00:05.000 --> 00:00:04.000",
      "Backwards",
    ].join("\n");
    expect(parseVttCues(vtt)).toHaveLength(0);
  });
});

describe("parseVtt", () => {
  test("keeps a line-level cue as one segment", () => {
    const segments = parseVtt("WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nHello world");
    expect(segments).toEqual([{ start: "1", dur: "2", text: "Hello world" }]);
  });

  test("splits a cue on inline word timestamps", () => {
    const segments = parseVtt(
      "WEBVTT\n\n00:00:00.000 --> 00:00:03.000\n<00:00:00.000>One <00:00:01.000>two <00:00:02.000>three",
    );
    expect(segments.map((segment) => segment.text)).toEqual(["One", "two", "three"]);
    expect(Number(segments[1].start)).toBeCloseTo(1, 5);
    expect(Number(segments[2].dur)).toBeCloseTo(1, 5);
  });
});

describe("buildLocalTrack", () => {
  test("turns VTT cues into a word-timed track", () => {
    const track = buildLocalTrack({
      id: "local:Song",
      lang: "en",
      title: "Song",
      description: "",
      vtt: [
        "WEBVTT",
        "",
        "00:00:01.000 --> 00:00:03.000",
        "Hello world",
        "",
        "00:00:03.500 --> 00:00:05.000",
        "We're here",
      ].join("\n"),
    });

    expect(track.words.map((word) => word.match)).toEqual([
      "hello",
      "world",
      "were",
      "here",
    ]);
    expect(track.lines).toHaveLength(2);
    expect(track.source.captions).toBe("manual");
    expect(track.id).toBe("local:Song");
  });

  test("returns an empty track when the captions have no lyrics", () => {
    const track = buildLocalTrack({
      id: "local:Empty",
      lang: "en",
      title: "Empty",
      description: "",
      vtt: "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\n[Music]",
    });
    expect(track.words).toHaveLength(0);
  });
});
