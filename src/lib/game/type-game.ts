/**
 * The Type play style: type the lyrics before their moment passes.
 *
 * A thin adapter over the pure typing reducer in `engine.ts`, exposing it
 * through the shared {@link GameEngine} contract so the shell no longer needs to
 * know about keystrokes, word results or the perfect-line bonus.
 */

import {
  accuracyOf,
  comboTier,
  createGameState,
  DEFAULT_GRACE,
  DEFAULT_LEAD,
  gameReducer,
  rankOf,
  SPEED_LABEL,
  type GameConfig,
  type GameState,
} from "./engine";
import { bestKey, type GameEngine, type RunSettings } from "./game";
import { PLAY_STYLE_HELP } from "./modes";
import { formatTime } from "./storage";
import type { Track } from "../track/types";

const CAPABILITIES = {
  scored: true,
  scoreBar: true,
  keyboard: true,
  microphone: false,
  lane: "lyric",
  difficulty: true,
  runMode: true,
} as const;

function makeConfig(track: Track | null, run: RunSettings): GameConfig {
  return {
    words: track?.words ?? [],
    lines: track?.lines ?? [],
    offset: run.offset,
    mode: run.difficulty,
    failMode: run.runMode,
    lead: DEFAULT_LEAD,
    grace: DEFAULT_GRACE,
  };
}

const FAIL_MESSAGE: Record<"score" | "mistake" | "streak", string> = {
  score: "Your score went negative.",
  mistake: "You made a mistake.",
  streak: "You missed 20 words in a row.",
};

export const TypeGame: GameEngine<GameState> = {
  id: "type",
  label: "Type",

  capabilities: () => ({ ...CAPABILITIES }),

  help: () => PLAY_STYLE_HELP.type,

  createState: (track) => createGameState(track?.words.length ?? 0),

  config: makeConfig,

  reduce(state, action, config) {
    const cfg = config as GameConfig;
    switch (action.type) {
      case "reset":
      case "tick":
      case "key":
      case "resync":
      case "finish":
      case "clearRewind":
        return gameReducer(state, action, cfg);
      default:
        // Keystrokes are the only input; samples and starts are not theirs.
        return state;
    }
  },

  summary(state, track, _run, _ctx) {
    const words = track?.words ?? [];
    return {
      score: state.score,
      combo: state.combo,
      multiplier: comboTier(state.combo),
      accuracy: accuracyOf(state),
      attempted: state.correctKeys + state.errorKeys > 0,
      progress: words.length ? state.pointer / words.length : 0,
      perfectLines: state.perfectLines,
      errorKeys: state.errorKeys,
      finished: state.finished,
      failed: state.failed,
    };
  },

  lyricView(state) {
    // The cue bar is computed by the shell from this pointer, so the view only
    // needs the word the keyboard is on.
    return {
      pointer: state.pointer,
      results: state.results,
      input: state.input,
      followMusic: false,
    };
  },

  pitchView: () => null,

  results(state, track, run, ctx) {
    const words = track?.words ?? [];
    const elapsed = ctx.time;
    const accuracy = accuracyOf(state);
    const wpm =
      elapsed > 0 ? Math.round(state.correctKeys / 5 / (elapsed / 60)) : 0;
    const metrics = [
      { label: "accuracy", value: `${Math.round(accuracy * 100)}%` },
      { label: "best combo", value: `×${state.maxCombo}` },
      { label: "perfect lines", value: `${state.perfectLines}` },
      { label: "words hit", value: `${state.hits}` },
      { label: "words missed", value: `${state.misses}` },
      { label: "wrong keys", value: `${state.errorKeys}` },
      { label: "wpm", value: `${wpm}` },
      { label: "time", value: formatTime(elapsed) },
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
      rank: state.failed ? null : rankOf(state),
      trackId: track?.id ?? "",
      bestKey: bestKey("type", track?.id ?? "", run),
      progress: words.length ? state.pointer / words.length : 0,
      metrics,
      share: {
        mode: run.difficulty,
        failMode: run.runMode,
        speed: run.speed,
        style: "type",
      },
      replayLabel: "Play again",
    };
  },
};
