/**
 * TypeStar's game island — the single mount point behind `/play`.
 *
 * The component is deliberately thin: it owns the phase machine, the track
 * load and the wiring between the YouTube player and the pure game reducer.
 * All the interesting rules live in `src/lib/game/engine.ts`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FEATURED_BY_ID } from "../../content/tracks/featured";
import {
  loadTrack,
  TrackApiError,
  videoIdFromLocation,
} from "../../lib/game/client";
import {
  accuracyOf,
  cueAt,
  DEFAULT_LEAD,
  GAME_MODES,
  isFailMode,
  isGameMode,
  multiplierOf,
  rankOf,
  type FailMode,
  type GameMode,
} from "../../lib/game/engine";
import {
  readSetting,
  SETTING_FAIL_MODE,
  SETTING_MODE,
  SETTING_OFFSET_PREFIX,
  writeSetting,
} from "../../lib/game/storage";
import type { Track } from "../../lib/track/types";
import type { SiteSettings } from "../../lib/site";
import Calibration from "./Calibration";
import CueBar from "./CueBar";
import EndScreen from "./EndScreen";
import Hud from "./Hud";
import LyricHighway from "./LyricHighway";
import PlayerStage from "./PlayerStage";
import TrackPicker from "./TrackPicker";
import { useGameLoop } from "./hooks/useGameLoop";
import { useYouTubePlayer } from "./hooks/useYouTubePlayer";

type Phase = "idle" | "countdown" | "playing" | "paused" | "results";

const MODE_LABEL: Record<GameMode, string> = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
};

const MODE_HELP: Record<GameMode, string> = {
  easy: "Type just the first letter of each word.",
  normal: "Type every word — punctuation is optional.",
  hard: "Type every word, punctuation and all.",
};

function StartOverlay({
  mode,
  onSelectMode,
  onStart,
}: {
  mode: GameMode;
  onSelectMode(mode: GameMode): void;
  onStart(): void;
}) {
  return (
    <div className="game-overlay game-overlay--start">
      <p className="comment on-ink">
        <span className="slash" aria-hidden="true">
          //
        </span>{" "}
        ready
      </p>
      <h2 className="game-overlay__title">Type the words in time.</h2>
      <p className="game-overlay__help">
        Words light up as they arrive. Type each one before its moment passes.
      </p>

      <button
        type="button"
        className="btn-game btn-game--primary btn-game--start"
        onClick={onStart}
      >
        Start
      </button>

      <div className="mode-picker" role="group" aria-label="Difficulty">
        {GAME_MODES.map((value) => (
          <button
            key={value}
            type="button"
            className={"mode-picker__option" + (value === mode ? " is-active" : "")}
            aria-pressed={value === mode}
            onClick={() => onSelectMode(value)}
          >
            {MODE_LABEL[value]}
          </button>
        ))}
      </div>
      <p className="mode-picker__help">{MODE_HELP[mode]}</p>
    </div>
  );
}

function CountdownOverlay({ value }: { value: number }) {
  return (
    <div className="game-overlay game-overlay--countdown" aria-live="assertive">
      <span className="countdown__number">{value > 0 ? value : "Go"}</span>
    </div>
  );
}

function PausedOverlay({ onResume }: { onResume(): void }) {
  return (
    <div className="game-overlay game-overlay--paused">
      <p className="game-overlay__title">Paused</p>
      <button type="button" className="btn-game btn-game--primary" onClick={onResume}>
        Resume
      </button>
    </div>
  );
}

function StatusPanel({
  title,
  message,
  action,
  onAction,
}: {
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="game-status">
      <div className="panel game-status__panel">
        <p className="comment">
          <span className="slash" aria-hidden="true">
            //
          </span>{" "}
          play
        </p>
        <h2 className="panel__title mt-2">{title}</h2>
        <p className="mt-2 text-ink-soft">{message}</p>
        {action && onAction ? (
          <div className="mt-4">
            <button type="button" className="btn-game btn-game--primary" onClick={onAction}>
              {action}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function GameApp({ site }: { site: SiteSettings }) {
  const [videoId, setVideoId] = useState<string | null | undefined>(undefined);
  const [track, setTrack] = useState<Track | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [mode, setMode] = useState<GameMode>("normal");
  const [failMode, setFailMode] = useState<FailMode>("normal");
  const [offset, setOffset] = useState(0);
  const [showCalibration, setShowCalibration] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lyricRef = useRef<HTMLDivElement>(null);

  const player = useYouTubePlayer(videoId ?? null);
  const { ready, error: playerError, containerRef, play, pause, restart: restartPlayer, seekTo, getTime, time, duration, state: playerState } = player;

  // Read the id from the address bar after hydration (SSR-safe).
  useEffect(() => {
    setVideoId(videoIdFromLocation());
  }, []);

  useEffect(() => {
    const stored = readSetting<unknown>(SETTING_MODE, "normal");
    setMode(isGameMode(stored) ? stored : "normal");
    const storedFail = readSetting<unknown>(SETTING_FAIL_MODE, "normal");
    setFailMode(isFailMode(storedFail) ? storedFail : "normal");
  }, []);

  // Load the track, and restore its saved sync offset.
  useEffect(() => {
    if (!videoId) {
      setTrack(null);
      setLoadError(null);
      return;
    }
    const controller = new AbortController();
    setTrack(null);
    setLoadError(null);
    setPhase("idle");

    loadTrack(videoId, "en", controller.signal)
      .then((loaded) => {
        setTrack(loaded);
        setOffset(readSetting<number>(SETTING_OFFSET_PREFIX + videoId, 0));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(
          error instanceof TrackApiError
            ? error.message
            : "Something went wrong loading this track.",
        );
      });

    return () => controller.abort();
  }, [videoId]);

  // Reflect the loaded song in the page title and the page header.
  useEffect(() => {
    if (!track) return;
    const artist = FEATURED_BY_ID.get(track.id)?.artist;
    const defaultSubtitle = `${site.tagline} — YouTube supplies the music and visuals; you type the lyrics as the words arrive.`;
    document.title = `${track.title} — ${site.name}`;
    const titleEl = document.getElementById("play-title");
    const subtitleEl = document.getElementById("play-subtitle");
    if (titleEl) titleEl.textContent = track.title;
    if (subtitleEl) subtitleEl.textContent = artist ?? defaultSubtitle;
    return () => {
      document.title = `Play ${site.name}`;
      if (titleEl) titleEl.textContent = site.name;
      if (subtitleEl) subtitleEl.textContent = defaultSubtitle;
    };
  }, [track, site]);

  const words = useMemo(() => track?.words ?? [], [track]);
  const lines = useMemo(() => track?.lines ?? [], [track]);
  const game = useGameLoop({
    words,
    lines,
    offset,
    mode,
    failMode,
    running: phase === "playing",
    time,
    getTime,
    seek: seekTo,
  });

  // Countdown, then play.
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      play();
      setPhase("playing");
      return;
    }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 650);
    return () => window.clearTimeout(timer);
  }, [phase, countdown, play]);

  // Finished when every word is resolved, or when the run fails.
  useEffect(() => {
    if (phase === "playing" && (game.state.finished || game.state.failed)) {
      pause();
      setPhase("results");
    }
  }, [phase, game.state.finished, game.state.failed, pause]);

  // The video ending before the lyrics do counts as a finish.
  useEffect(() => {
    if (phase === "playing" && playerState === 0) game.finish();
  }, [phase, playerState, game.finish]);

  // Capture typing while playing.
  useEffect(() => {
    if (phase !== "playing") return;
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        game.onKey("Backspace");
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        return;
      }
      if (event.key.length === 1) game.onKey(event.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, game.onKey]);

  const start = useCallback(() => {
    if (!ready) return;
    seekTo(0);
    setCountdown(3);
    setPhase("countdown");
    // Bring up the on-screen keyboard, then show the lyrics on small screens.
    inputRef.current?.focus();
    if (window.matchMedia("(max-width: 919px)").matches) {
      lyricRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [ready, seekTo]);

  const togglePause = useCallback(() => {
    if (phase === "playing") {
      pause();
      setPhase("paused");
    } else if (phase === "paused") {
      play();
      setPhase("playing");
    }
  }, [phase, pause, play]);

  const restart = useCallback(() => {
    game.reset();
    restartPlayer();
    setPhase("playing");
    inputRef.current?.focus();
  }, [game, restartPlayer]);

  const closeResults = useCallback(() => {
    game.reset();
    setPhase("idle");
  }, [game]);

  const selectMode = useCallback(
    (next: GameMode) => {
      // Not while a run is in progress.
      if (phase !== "idle" && phase !== "results") return;
      setMode(next);
      writeSetting(SETTING_MODE, next);
    },
    [phase],
  );

  const selectFailMode = useCallback(
    (next: FailMode) => {
      if (phase !== "idle" && phase !== "results") return;
      setFailMode(next);
      writeSetting(SETTING_FAIL_MODE, next);
    },
    [phase],
  );

  const changeOffset = useCallback(
    (value: number) => {
      setOffset(value);
      if (videoId) writeSetting(SETTING_OFFSET_PREFIX + videoId, value);
    },
    [videoId],
  );

  const changeSong = useCallback(() => {
    window.location.href = "/play";
  }, []);

  const toggleFullscreen = useCallback(() => {
    const element = shellRef.current;
    if (!element) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void element.requestFullscreen?.();
  }, []);

  const cue = useMemo(
    () => cueAt({ words, offset, lead: DEFAULT_LEAD }, game.state.pointer, time),
    [words, offset, game.state.pointer, time],
  );

  // Flash a "Perfect line!" badge whenever a clean line is cleared.
  const [perfectFlash, setPerfectFlash] = useState(0);
  const previousPerfect = useRef(0);
  useEffect(() => {
    if (game.state.perfectLines > previousPerfect.current) {
      previousPerfect.current = game.state.perfectLines;
      setPerfectFlash((count) => count + 1);
    }
  }, [game.state.perfectLines]);

  if (videoId === undefined) return null;
  if (videoId === null) return <TrackPicker />;
  if (loadError) {
    return (
      <StatusPanel
        title="No track to play"
        message={loadError}
        action="Try another song"
        onAction={changeSong}
      />
    );
  }
  if (!track) {
    return (
      <StatusPanel
        title="Loading track…"
        message="Fetching the captions and timing the words."
      />
    );
  }

  const accuracy = accuracyOf(game.state);
  const multiplier = multiplierOf(game.state);
  const progress = words.length ? game.state.pointer / words.length : 0;
  const featured = FEATURED_BY_ID.get(track.id);
  const locked = phase === "playing" || phase === "countdown" || phase === "paused";

  return (
    <div ref={shellRef} className="game-shell">
      {/*
        A visually-hidden input that holds focus during a run. On mobile it
        brings up the on-screen keyboard; on desktop it keeps keystrokes
        flowing to the game.
      */}
      <input
        ref={inputRef}
        className="game-input"
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="go"
        aria-label="Type the lyrics"
        onKeyDown={(event) => {
          if (event.key === "Backspace") {
            event.preventDefault();
            game.onKey("Backspace");
          }
        }}
        onInput={(event) => {
          const value = event.currentTarget.value;
          event.currentTarget.value = "";
          for (const char of value) game.onKey(char);
        }}
        onBlur={() => {
          if (phase === "playing" || phase === "countdown") {
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      />

      <Hud
        score={game.state.score}
        combo={game.state.combo}
        multiplier={multiplier}
        accuracy={accuracy}
        attempted={game.state.correctKeys + game.state.errorKeys > 0}
        progress={progress}
        time={time}
        duration={duration}
        mode={mode}
        failMode={failMode}
        locked={locked}
        paused={phase === "paused"}
        playing={phase === "playing"}
        onTogglePause={togglePause}
        onRestart={restart}
        onSelectMode={selectMode}
        onSelectFailMode={selectFailMode}
        onCalibrate={() => setShowCalibration(true)}
        onFullscreen={toggleFullscreen}
        onChangeSong={changeSong}
      />

      <div className="game-shell__grid">
        <PlayerStage
          containerRef={containerRef}
          ready={ready}
          error={playerError}
          title={track.title}
          artist={featured?.artist}
          shielded={phase === "playing"}
          onShield={() => inputRef.current?.focus()}
        >
          {phase === "idle" && ready ? (
            <StartOverlay mode={mode} onSelectMode={selectMode} onStart={start} />
          ) : null}
          {phase === "countdown" ? <CountdownOverlay value={countdown} /> : null}
          {phase === "paused" ? <PausedOverlay onResume={togglePause} /> : null}
        </PlayerStage>

        <div className="lyric-panel" ref={lyricRef}>
          <CueBar cue={cue} first={game.state.pointer === 0} />
          <LyricHighway
            track={track}
            results={game.state.results}
            pointer={game.state.pointer}
            input={game.state.input}
            mode={mode}
            cued={cue.waiting}
          />
        </div>
      </div>

      {perfectFlash > 0 ? (
        <div key={perfectFlash} className="perfect-flash" aria-hidden="true">
          Perfect line!
        </div>
      ) : null}

      {phase === "results" ? (
        <EndScreen
          state={game.state}
          accuracy={accuracy}
          rank={rankOf(game.state)}
          mode={mode}
          failMode={failMode}
          trackId={track.id}
          elapsed={time}
          progress={progress}
          onReplay={restart}
          onChangeSong={changeSong}
          onClose={closeResults}
        />
      ) : null}

      {showCalibration ? (
        <Calibration
          offset={offset}
          onChange={changeOffset}
          onClose={() => setShowCalibration(false)}
        />
      ) : null}
    </div>
  );
}
