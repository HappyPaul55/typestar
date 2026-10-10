import { describe, expect, test } from "bun:test";
import type { TrackNote } from "../track/types";
import {
  availablePlayStyles,
  isPlayStyle,
  singBehavior,
  trackCanSing,
} from "./modes";

function note(pitch: number | null, kind: TrackNote["kind"] = "normal"): TrackNote {
  return { word: 0, start: 0, end: 1, pitch, kind };
}

describe("isPlayStyle", () => {
  test("accepts the two known styles only", () => {
    expect(isPlayStyle("type")).toBe(true);
    expect(isPlayStyle("sing")).toBe(true);
    expect(isPlayStyle("karaoke")).toBe(false);
    expect(isPlayStyle(undefined)).toBe(false);
  });
});

describe("trackCanSing", () => {
  test("is false without notes", () => {
    expect(trackCanSing({})).toBe(false);
    expect(trackCanSing({ notes: [] })).toBe(false);
  });

  test("is false when every note is unpitched (rap only)", () => {
    expect(trackCanSing({ notes: [note(null, "rap")] })).toBe(false);
  });

  test("is true when at least one note carries pitch", () => {
    expect(trackCanSing({ notes: [note(null, "rap"), note(0)] })).toBe(true);
  });
});

describe("singBehavior", () => {
  test("scored with pitch, karaoke without", () => {
    expect(singBehavior({ notes: [note(3)] })).toBe("scored");
    expect(singBehavior({ notes: [note(null, "rap")] })).toBe("karaoke");
    expect(singBehavior({})).toBe("karaoke");
  });
});

describe("availablePlayStyles", () => {
  test("offers both styles for every track", () => {
    expect(availablePlayStyles(null)).toEqual(["type", "sing"]);
    expect(availablePlayStyles({ notes: [note(0)] })).toEqual(["type", "sing"]);
  });
});
