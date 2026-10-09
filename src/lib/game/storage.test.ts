import { describe, expect, test } from "bun:test";
import { formatDuration, formatTime } from "./storage";

describe("formatTime", () => {
  test("formats seconds as m:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(189)).toBe("3:09");
  });

  test("clamps nonsense input", () => {
    expect(formatTime(-5)).toBe("0:00");
    expect(formatTime(Number.NaN)).toBe("0:00");
  });
});

describe("formatDuration", () => {
  test("formats seconds as a wordy duration", () => {
    expect(formatDuration(189)).toBe("3m 9s");
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(0)).toBe("0s");
  });

  test("drops empty units and adds hours", () => {
    expect(formatDuration(180)).toBe("3m");
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(3725)).toBe("1h 2m");
  });
});
