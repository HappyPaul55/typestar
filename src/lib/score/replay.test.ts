import { describe, expect, test } from "bun:test";
import {
  accuracyOf,
  createGameState,
  DEFAULT_GRACE,
  DEFAULT_LEAD,
  gameReducer,
  type GameConfig,
} from "../game/engine";
import type { RunSettings } from "../game/game";
import type { Track, TrackWord } from "../track/types";
import { replaySing, replayType } from "./replay";
import type { TimelineEvent } from "./timeline";

function word(
  text: string,
  match: string,
  start: number,
  end: number,
  line: number,
): TrackWord {
  return { text, match, start, end, line };
}

function testTrack(): Track {
  return {
    version: 6,
    id: "youtube-abcdefghijk",
    type: "youtube",
    title: "Test song",
    description: "desc",
    lang: "en",
    source: { captions: "manual", fetchedAt: "2024-01-01T00:00:00Z" },
    offset: 0,
    lines: [
      { start: 1, end: 1.9, from: 0, to: 2 },
      { start: 2.5, end: 2.9, from: 2, to: 3 },
    ],
    words: [
      word("Hello", "hello", 1, 1.4, 0),
      word("world", "world", 1.5, 1.9, 0),
      word("Again", "again", 2.5, 2.9, 1),
    ],
  };
}

const RUN: RunSettings = {
  difficulty: "normal",
  runMode: "fun",
  speed: 1,
  style: "type",
  offset: 0,
};

function configFor(track: Track): GameConfig {
  return {
    words: track.words,
    lines: track.lines,
    offset: 0,
    mode: "normal",
    failMode: "fun",
    lead: DEFAULT_LEAD,
    grace: DEFAULT_GRACE,
  };
}

/** Simulate a browser run at the same tick cadence the replay uses. */
function simulate(
  track: Track,
  keys: Array<{ at: number; key: string }>,
): { state: ReturnType<typeof createGameState>; events: TimelineEvent[] } {
  const config = configFor(track);
  let state = createGameState(track.words.length);
  const events: TimelineEvent[] = [];
  const step = 0.05;
  let index = 0;
  for (let n = 1; n * step <= 4; n++) {
    const tickAt = n * step;
    while (index < keys.length && keys[index].at < tickAt - 1e-9) {
      const { at, key } = keys[index++];
      state = gameReducer(state, { type: "key", key, time: at }, config);
      events.push({ t: "k", at, key });
    }
    state = gameReducer(state, { type: "tick", time: tickAt }, config);
  }
  while (index < keys.length) {
    const { at, key } = keys[index++];
    state = gameReducer(state, { type: "key", key, time: at }, config);
    events.push({ t: "k", at, key });
  }
  state = gameReducer(state, { type: "finish" }, config);
  return { state, events };
}

const CLEAN_KEYS = [
  { at: 1.02, key: "h" },
  { at: 1.12, key: "e" },
  { at: 1.17, key: "l" },
  { at: 1.22, key: "l" },
  { at: 1.27, key: "o" },
  { at: 1.52, key: "w" },
  { at: 1.57, key: "o" },
  { at: 1.62, key: "r" },
  { at: 1.67, key: "l" },
  { at: 1.72, key: "d" },
  { at: 2.52, key: "a" },
  { at: 2.57, key: "g" },
  { at: 2.62, key: "a" },
  { at: 2.67, key: "i" },
  { at: 2.72, key: "n" },
];

describe("replayType", () => {
  test("reproduces the engine's score for a clean run", () => {
    const track = testTrack();
    const { state, events } = simulate(track, CLEAN_KEYS);
    const replayed = replayType(track, RUN, events);
    expect(replayed.score).toBe(state.score);
    expect(replayed.hits).toBe(state.hits);
    expect(replayed.misses).toBe(state.misses);
    expect(replayed.maxCombo).toBe(state.maxCombo);
    expect(replayed.accuracy).toBeCloseTo(accuracyOf(state), 6);
    expect(replayed.score).toBeGreaterThan(0);
  });

  test("reproduces a run with a wrong key and a missed word", () => {
    const track = testTrack();
    const keys = [
      { at: 1.02, key: "h" },
      { at: 1.07, key: "x" },
      { at: 1.12, key: "e" },
      { at: 1.17, key: "l" },
      { at: 1.22, key: "l" },
      { at: 1.27, key: "o" },
      { at: 2.52, key: "a" },
      { at: 2.57, key: "g" },
      { at: 2.62, key: "a" },
      { at: 2.67, key: "i" },
      { at: 2.72, key: "n" },
    ];
    const { state, events } = simulate(track, keys);
    const replayed = replayType(track, RUN, events);
    expect(replayed.score).toBe(state.score);
    expect(replayed.hits).toBe(state.hits);
    expect(replayed.misses).toBe(state.misses);
    expect(replayed.misses).toBe(1);
  });

  test("an empty timeline misses everything", () => {
    const replayed = replayType(testTrack(), RUN, []);
    expect(replayed.hits).toBe(0);
    expect(replayed.misses).toBe(3);
  });
});

describe("replaySing", () => {
  test("scores a held note", () => {
    const track: Track = {
      ...testTrack(),
      notes: [{ word: 0, start: 1, end: 1.4, pitch: 0, kind: "normal" }],
    };
    const events: TimelineEvent[] = [];
    for (let at = 1.0; at <= 1.4; at += 0.033) {
      events.push({ t: "s", at, m: 60, r: 0.1 });
    }
    const replayed = replaySing(track, { ...RUN, style: "sing" }, events);
    expect(replayed.hits).toBe(1);
    expect(replayed.score).toBeGreaterThan(0);
  });
});
