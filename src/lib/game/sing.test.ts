import { describe, expect, test } from "bun:test";
import type { TrackNote } from "../track/types";
import {
  createSingState,
  makeSingConfig,
  pitchDistance,
  singPitchAccuracy,
  singRank,
  singReducer,
  type SingAction,
  type SingConfig,
} from "./sing";

function note(
  start: number,
  end: number,
  pitch: number | null,
  kind: TrackNote["kind"] = "normal",
): TrackNote {
  return { word: 0, start, end, pitch, kind };
}

/** Every 1/60s from 0 to `end`, sung at a fixed MIDI pitch (or silence). */
function frames(end: number, midi: number | null, rms = 0.2): SingAction[] {
  const actions: SingAction[] = [];
  for (let t = 0; t <= end; t += 1 / 60) {
    actions.push({ type: "sample", time: t, midi, rms });
  }
  return actions;
}

function run(notes: TrackNote[], actions: SingAction[], options: Partial<SingConfig> = {}) {
  const config = makeSingConfig(notes, { lead: 0, grace: 0, ...options });
  let state = singReducer(createSingState(notes.length), { type: "start", time: 0 }, config);
  for (const action of actions) state = singReducer(state, action, config);
  return singReducer(state, { type: "finish" }, config);
}

describe("pitchDistance", () => {
  test("is absolute without octave folding", () => {
    expect(pitchDistance(60, 64, false)).toBe(4);
    expect(pitchDistance(60, 72, false)).toBe(12);
  });

  test("wraps at the octave when octave-insensitive", () => {
    expect(pitchDistance(60, 72, true)).toBe(0);
    expect(pitchDistance(60, 67, true)).toBe(5);
    expect(pitchDistance(60, 61, true)).toBe(1);
  });
});

describe("singReducer", () => {
  test("counts a note held in tune as a hit", () => {
    const notes = [note(0, 1, 0)]; // C4 -> MIDI 60
    const state = run(notes, frames(1, 60));
    expect(state.results[0]).toBe("hit");
    expect(state.hits).toBe(1);
    expect(state.score).toBeGreaterThan(0);
    expect(singPitchAccuracy(state)).toBeCloseTo(1, 5);
  });

  test("counts a wrong pitch as a miss", () => {
    const notes = [note(0, 1, 0)];
    const state = run(notes, frames(1, 67)); // wrong note
    expect(state.results[0]).toBe("miss");
    expect(state.misses).toBe(1);
    expect(state.score).toBe(0);
    expect(singPitchAccuracy(state)).toBe(0);
  });

  test("forgives an octave by default, but not when strict", () => {
    const notes = [note(0, 1, 0)];
    const easy = run(notes, frames(1, 72)); // an octave up
    expect(easy.results[0]).toBe("hit");
    const strict = run(notes, frames(1, 72), { octaveInsensitive: false });
    expect(strict.results[0]).toBe("miss");
  });

  test("honours the pitch tolerance", () => {
    const notes = [note(0, 1, 0)];
    // 2 semitones sharp: out at tolerance 1, but in at tolerance 2.
    expect(run(notes, frames(1, 62), { tolerance: 1 }).results[0]).toBe("miss");
    expect(run(notes, frames(1, 62), { tolerance: 2 }).results[0]).toBe("hit");
  });

  test("scores a golden note double a normal one", () => {
    const normal = run([note(0, 1, 0)], frames(1, 60));
    const golden = run([note(0, 1, 0, "golden")], frames(1, 60));
    // Rounding to whole points leaves at most a point of slack.
    expect(Math.abs(golden.score - normal.score * 2)).toBeLessThanOrEqual(1);
  });

  test("grades a rap note on presence, ignoring pitch", () => {
    const notes = [note(0, 1, null, "rap")];
    // Any loud frame counts, even with no detected pitch.
    expect(run(notes, frames(1, null, 0.2)).results[0]).toBe("hit");
    // Silence does not.
    expect(run(notes, frames(1, null, 0.001)).results[0]).toBe("miss");
  });

  test("builds a combo across hit notes and resets on a miss", () => {
    const notes = [note(0, 1, 0), note(1, 2, 0), note(2, 3, 5)];
    const actions = [...frames(1, 60), ...frames(2, 60).slice(1), ...frames(3, 60).slice(1)];
    const state = run(notes, actions);
    // First two held in tune, the third sung wrong.
    expect(state.results).toEqual(["hit", "hit", "miss"]);
    expect(state.maxCombo).toBe(2);
    expect(state.combo).toBe(0);
  });

  test("finishes an empty track immediately", () => {
    const state = run([], []);
    expect(state.finished).toBe(true);
    expect(singPitchAccuracy(state)).toBe(0);
  });

  test("ranks a perfect run highly", () => {
    const state = run([note(0, 1, 0)], frames(1, 60));
    expect(singRank(state)).toBe("S");
  });
});

describe("run modes", () => {
  test("fun never fails, however badly it is sung", () => {
    const notes = [note(0, 1, 0), note(1, 2, 0), note(2, 3, 0)];
    const state = run(notes, frames(3, 67), { failMode: "fun" });
    expect(state.failed).toBe(false);
    expect(state.misses).toBe(3);
  });

  test("instant fails on the first missed note", () => {
    const notes = [note(0, 1, 0), note(1, 2, 0)];
    const state = run(notes, frames(2, 67), { failMode: "instant" });
    expect(state.failed).toBe(true);
    expect(state.failReason).toBe("mistake");
    expect(state.results[0]).toBe("miss");
    // The run stopped rather than judging the rest.
    expect(state.finished).toBe(false);
  });

  test("instant does not fail when every note is held", () => {
    const state = run([note(0, 1, 0)], frames(1, 60), { failMode: "instant" });
    expect(state.failed).toBe(false);
    expect(state.hits).toBe(1);
  });

  test("normal fails once the score drops below the floor", () => {
    const notes = Array.from({ length: 20 }, (_, i) => note(i, i + 1, 0));
    const state = run(notes, frames(20, 67), { failMode: "normal" });
    expect(state.failed).toBe(true);
    expect(state.failReason).toBe("score");
  });

  test("normal survives a couple of misses", () => {
    const notes = [note(0, 1, 0), note(1, 2, 0)];
    const state = run(notes, frames(2, 67), { failMode: "normal" });
    expect(state.failed).toBe(false);
  });

  test("practise rewinds on a miss instead of penalising it", () => {
    const notes = [note(0, 1, 0), note(2, 3, 0)];
    const config = makeSingConfig(notes, { lead: 0, grace: 0, failMode: "practise" });
    let state = singReducer(createSingState(notes.length), { type: "start", time: 0 }, config);
    let rewound: typeof state | null = null;
    for (const action of frames(1.5, 67)) {
      state = singReducer(state, action, config);
      if (state.rewindTo !== null) {
        rewound = state;
        break;
      }
    }
    expect(rewound).not.toBeNull();
    expect(rewound!.replays).toBe(1);
    expect(rewound!.failed).toBe(false);
    // The miss was not charged.
    expect(rewound!.score).toBe(0);
  });
});
