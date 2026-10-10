import { describe, expect, test } from "bun:test";
import { sourceFromInput } from "./client";

describe("sourceFromInput", () => {
  test("recognises a YouTube link", () => {
    expect(sourceFromInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
  });

  test("recognises an UltraStar URL", () => {
    const url = "https://raw.githubusercontent.com/x/y/main/song.txt";
    expect(sourceFromInput(url)).toEqual({ kind: "ultrastar", url });
  });

  test("rejects junk", () => {
    expect(sourceFromInput("nope")).toBeNull();
  });
});
