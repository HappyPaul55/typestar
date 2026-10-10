/**
 * The Sing play style: karaoke.
 *
 * When the track carries measured pitch (an UltraStar chart) and the microphone
 * is available, singing is scored against the notes through the pure reducer in
 * `sing.ts`. Otherwise it is a time-driven, unscored sing-along whose active
 * word follows the music (`karaoke.ts`). Both behaviours live behind the single
 * {@link GameEngine} contract, so the shell just asks this adapter what it can
 * do and what to show.
 */

import { comboTier, SPEED_LABEL, type WordResult } from "./engine";
import { bestKey, type Capabilities, type GameEngine } from "./game";
import { karaokePointer, karaokeProgress } from "./karaoke";
import { trackCanSing } from "./modes";
import {
  createSingState,
  makeSingConfig,
  singPitchAccuracy,
  singProgress,
  singRank,
  singReducer,
  SING_TOLERANCE,
  type SingConfig,
  type SingState,
} from "./sing";
import { formatTime } from "./storage";
import type { Track } from "../track/types";

/** Scored singing needs pitched notes *and* a working microphone. */
function isScored(track: Track | null, micFallback: boolean): boolean {
  return !!track && trackCanSing(track) && !micFallback;
}

const SCORED_HELP = "Hit the notes as they arrive — your pitch is scored.";
const KARAOKE_HELP =
  "The words light up as they arrive — sing along. No score is kept.";

/** Stable empty result list: the shell derives karaoke results from the pointer,
 * so returning a new array each call would needlessly rebuild the highway. */
const NO_RESULTS: WordResult[] = [];

const FAIL_MESSAGE: Record<"score" | "mistake" | "streak", string> = {
  score: "Your score went negative.",
  mistake: "You missed a note.",
  streak: "You missed 20 notes in a row.",
};

export const SingGame: GameEngine<SingState> = {
  id: "sing",
  label: "Sing",

  capabilities(track, micFallback): Capabilities {
    const scored = isScored(track, micFallback);
    return {
      scored,
      // The bar is the same in every style: karaoke keeps the controls too, its
      // stats simply read "—" because there is no score.
      scoreBar: true,
      keyboard: false,
      microphone: scored,
      lane: scored ? "pitch" : "lyric",
      difficulty: true,
      runMode: true,
    };
  },

  help: (track, micFallback) =>
    isScored(track, micFallback) ? SCORED_HELP : KARAOKE_HELP,

  createState: (track) => createSingState(track?.notes?.length ?? 0),

  config(track, run) {
    return makeSingConfig(track?.notes ?? [], {
      offset: run.offset,
      tolerance: SING_TOLERANCE[run.difficulty],
      failMode: run.runMode,
    });
  },

  reduce(state, action, config) {
    const cfg = config as SingConfig;
    switch (action.type) {
      case "reset":
      case "start":
      case "sample":
      case "finish":
      case "clearRewind":
        return singReducer(state, action, cfg);
      default:
        // Singing is driven by the microphone, not the keyboard or the clock.
        return state;
    }
  },

  summary(state, track, run, ctx) {
    if (!isScored(track, ctx.micFallback)) {
      return {
        score: 0,
        combo: 0,
        multiplier: 1,
        accuracy: 0,
        attempted: false,
        progress: karaokeProgress(track?.words ?? [], run.offset, ctx.time),
        perfectLines: 0,
        errorKeys: 0,
        finished: false,
        failed: false,
      };
    }
    return {
      score: state.score,
      combo: state.combo,
      multiplier: comboTier(state.combo),
      accuracy: singPitchAccuracy(state),
      attempted: state.pitchedSamples > 0,
      progress: singProgress(state, track?.notes?.length ?? 0),
      perfectLines: 0,
      errorKeys: 0,
      finished: state.finished,
      failed: state.failed,
    };
  },

  lyricView(_state, track, run, ctx) {
    // Sung words always follow the music, scored or not. The hit/pending list is
    // a pure function of the pointer, which the shell derives and memoises, so
    // this stays a stable empty array and never forces the lyric highway to
    // rebuild on every clock tick.
    const words = track?.words ?? [];
    const pointer = karaokePointer(words, run.offset, ctx.time);
    return { pointer, results: NO_RESULTS, input: "", followMusic: true };
  },

  pitchView(state, track, _run, ctx) {
    if (!isScored(track, ctx.micFallback)) return null;
    return { results: state.results, pointer: state.pointer };
  },

  results(state, track, run, ctx) {
    if (!isScored(track, ctx.micFallback)) {
      const metrics = [
        { label: "song", value: track?.title ?? "" },
        ...(ctx.artist ? [{ label: "artist", value: ctx.artist }] : []),
        { label: "time", value: formatTime(ctx.time) },
      ];
      return {
        scored: false,
        score: 0,
        failed: false,
        failReason: null,
        failMessage: null,
        rank: null,
        trackId: track?.id ?? "",
        bestKey: bestKey("sing", track?.id ?? "", run),
        progress: karaokeProgress(track?.words ?? [], run.offset, ctx.time),
        metrics,
        share: {
          mode: run.difficulty,
          failMode: run.runMode,
          speed: run.speed,
          style: "sing",
        },
      };
    }

    const accuracy = Math.round(singPitchAccuracy(state) * 100);
    const notes = state.hits + state.misses;
    const metrics = [
      { label: "pitch accuracy", value: `${accuracy}%` },
      { label: "notes", value: `${state.hits}/${notes}` },
      { label: "best combo", value: `×${state.maxCombo}` },
      { label: "time", value: formatTime(ctx.time) },
      { label: "difficulty", value: run.difficulty },
      { label: "run mode", value: run.runMode },
      { label: "speed", value: SPEED_LABEL[run.speed] },
      ...(run.runMode === "practise"
        ? [{ label: "replays", value: `${state.replays}` }]
        : []),
    ];
    return {
      scored: true,
      score: state.score,
      failed: state.failed,
      failReason: state.failReason,
      failMessage: state.failReason ? FAIL_MESSAGE[state.failReason] : null,
      rank: state.failed ? null : singRank(state),
      trackId: track?.id ?? "",
      bestKey: bestKey("sing", track?.id ?? "", run),
      progress: singProgress(state, track?.notes?.length ?? 0),
      metrics,
      share: {
        mode: run.difficulty,
        failMode: run.runMode,
        speed: run.speed,
        style: "sing",
      },
    };
  },
};
