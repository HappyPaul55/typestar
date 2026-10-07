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
  comboMilestone,
  cueAt,
  DEFAULT_FAIL_MODE,
  DEFAULT_LEAD,
  DEFAULT_MODE,
  DEFAULT_SPEED,
  GAME_MODES,
  isFailMode,
  isGameMode,
  isPlaybackSpeed,
  multiplierOf,
  rankOf,
  skipIntroTarget,
  type ComboFlash,
  type FailMode,
  type GameMode,
  type PlaybackSpeed,
} from "../../lib/game/engine";
import { playSound, preloadSounds } from "../../lib/game/audio";
import { TURNSTILE_ACTION, TURNSTILE_SITE_KEY } from "../../lib/game/turnstile";
import {
  readSetting,
  SETTING_FAIL_MODE,
  SETTING_MODE,
  SETTING_OFFSET_PREFIX,
  SETTING_SPEED,
  writeSetting,
} from "../../lib/game/storage";
import type { Track } from "../../lib/track/types";
import { RATING_LABEL, ratingOf, type TrackRating } from "../../lib/track/rating";
import { seoTagValues, trackSeo } from "../../lib/seo";
import type { SiteSettings } from "../../lib/site";
import { buildHash, parseHash } from "../../lib/game/url";
import CueBar from "./CueBar";
import EndScreen from "./EndScreen";
import Hud from "./Hud";
import LyricHighway from "./LyricHighway";
import PlayerStage from "./PlayerStage";
import TrackPicker from "./TrackPicker";
import TurnstileChallenge from "./TurnstileChallenge";
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

interface GameFlash {
  id: number;
  text: string;
  tier: ComboFlash;
}

/** Ordering used to pick the headline when two flashes land on the same hit. */
const TIER_RANK: Record<ComboFlash, number> = { small: 0, medium: 1, large: 2 };

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
    <div className="game-overlay game-overlay--start" role="dialog" aria-label="Start">
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
    <div className="game-overlay game-overlay--paused" role="dialog" aria-label="Paused">
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

export default function GameApp({
  site,
  ratings = {},
}: {
  site: SiteSettings;
  /** Track id -> difficulty rating, computed from the pre-warmed seeds. */
  ratings?: Record<string, TrackRating>;
}) {
  const [videoId, setVideoId] = useState<string | null | undefined>(undefined);
  const [track, setTrack] = useState<Track | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [mode, setMode] = useState<GameMode>(DEFAULT_MODE);
  const [failMode, setFailMode] = useState<FailMode>(DEFAULT_FAIL_MODE);
  const [speed, setSpeed] = useState<PlaybackSpeed>(DEFAULT_SPEED);
  const [offset, setOffset] = useState(0);
  const [showCalibration, setShowCalibration] = useState(false);
  // Turnstile is only needed when a track is not already cached or bundled.
  const [needsTurnstile, setNeedsTurnstile] = useState(false);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState(0);
  const [reloadNonce, setReloadNonce] = useState(0);
  const turnstileToken = useRef<string | null>(null);
  const turnstileFailures = useRef(0);
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lyricRef = useRef<HTMLDivElement>(null);

  const player = useYouTubePlayer(videoId ?? null, speed);
  const { ready, error: playerError, containerRef, play, pause, seekTo, getTime, time, duration, state: playerState } = player;

  // Read the id from the address bar after hydration (SSR-safe).
  useEffect(() => {
    setVideoId(videoIdFromLocation());
  }, []);

  useEffect(() => {
    const parsed = parseHash(window.location.hash);
    const storedMode = readSetting<unknown>(SETTING_MODE, DEFAULT_MODE);
    const storedFail = readSetting<unknown>(SETTING_FAIL_MODE, DEFAULT_FAIL_MODE);
    const storedSpeed = readSetting<unknown>(SETTING_SPEED, DEFAULT_SPEED);
    const resolvedMode = parsed.mode ?? (isGameMode(storedMode) ? storedMode : DEFAULT_MODE);
    const resolvedFail = parsed.failMode ?? (isFailMode(storedFail) ? storedFail : DEFAULT_FAIL_MODE);
    const resolvedSpeed = parsed.speed ?? (isPlaybackSpeed(storedSpeed) ? storedSpeed : DEFAULT_SPEED);
    setMode(resolvedMode);
    setFailMode(resolvedFail);
    setSpeed(resolvedSpeed);
    // Persist the resolved settings so later visits remember them.
    writeSetting(SETTING_MODE, resolvedMode);
    writeSetting(SETTING_FAIL_MODE, resolvedFail);
    writeSetting(SETTING_SPEED, resolvedSpeed);
  }, []);

  // Keep the URL hash in step with the settings, so the page is shareable.
  // Defaults produce an empty hash, which is removed for a clean URL.
  useEffect(() => {
    if (!videoId) return;
    const hash = buildHash({ mode, failMode, speed });
    const path = `${window.location.pathname}${window.location.search}`;
    const target = hash || path;
    const current = `${path}${window.location.hash}`;
    if (current !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [videoId, mode, failMode, speed]);

  // A new song starts from a clean Turnstile slate.
  useEffect(() => {
    turnstileToken.current = null;
    turnstileFailures.current = 0;
    setNeedsTurnstile(false);
    setTurnstileError(null);
  }, [videoId]);

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

    loadTrack(videoId, "en", controller.signal, turnstileToken.current ?? undefined)
      .then((loaded) => {
        setTrack(loaded);
        setOffset(readSetting<number>(SETTING_OFFSET_PREFIX + videoId, 0));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (
          error instanceof TrackApiError &&
          (error.code === "turnstile-required" || error.code === "turnstile-failed")
        ) {
          // The token, if there was one, is now spent: ask for a fresh one.
          turnstileToken.current = null;
          if (error.code === "turnstile-failed") {
            // Give up rather than loop forever if the check keeps being refused.
            turnstileFailures.current += 1;
            if (turnstileFailures.current > 2) {
              setLoadError(
                "The human check could not be completed. Please try again later.",
              );
              return;
            }
          }
          setChallengeId((id) => id + 1);
          setNeedsTurnstile(true);
          return;
        }
        setLoadError(
          error instanceof TrackApiError
            ? error.message
            : "Something went wrong loading this track.",
        );
      });

    return () => controller.abort();
  }, [videoId, reloadNonce]);

  const handleTurnstileToken = useCallback((token: string) => {
    turnstileToken.current = token;
    setTurnstileError(null);
    setNeedsTurnstile(false);
    setReloadNonce((nonce) => nonce + 1);
  }, []);

  const handleTurnstileError = useCallback((message: string) => {
    setTurnstileError(message);
  }, []);

  // Reflect the loaded song in the page title, the page header and the rating.
  useEffect(() => {
    if (!track) return;
    const artist = FEATURED_BY_ID.get(track.id)?.artist;
    const defaultSubtitle = `${site.tagline} — YouTube supplies the music and visuals; you type the lyrics as the words arrive.`;
    document.title = `${track.title} — ${site.name}`;
    const titleEl = document.getElementById("play-title");
    const subtitleEl = document.getElementById("play-subtitle");
    if (titleEl) titleEl.textContent = track.title;
    if (subtitleEl) subtitleEl.textContent = artist ?? defaultSubtitle;

    // Keep the social/meta tags accurate. In production the Worker renders them
    // server-side; this covers `astro dev` (and keeps the browser tab in step).
    const restores: Array<() => void> = [];
    const origin = window.location.origin;
    for (const [key, value] of Object.entries(
      seoTagValues(trackSeo(track, origin)),
    )) {
      const el = document.querySelector<HTMLElement>(`[data-seo="${key}"]`);
      if (!el) continue;
      if (el.tagName === "TITLE") {
        const before = el.textContent ?? "";
        restores.push(() => {
          el.textContent = before;
        });
        el.textContent = value;
      } else {
        const attr = el.hasAttribute("href") ? "href" : "content";
        const before = el.getAttribute(attr) ?? "";
        restores.push(() => el.setAttribute(attr, before));
        el.setAttribute(attr, value);
      }
    }

    // The rating is a property of the song's lyrics, computed on the fly.
    const ratingEl = document.getElementById("play-rating");
    const ratingValueEl = document.getElementById("play-rating-value");
    if (ratingEl) {
      const rating = ratingOf(track);
      ratingEl.dataset.rating = rating;
      if (ratingValueEl) ratingValueEl.textContent = RATING_LABEL[rating];
      ratingEl.hidden = false;
    }

    return () => {
      document.title = `Play ${site.name}`;
      if (titleEl) titleEl.textContent = site.name;
      if (subtitleEl) subtitleEl.textContent = defaultSubtitle;
      if (ratingEl) ratingEl.hidden = true;
      for (const restore of restores) restore();
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

  // If the tab is hidden the animation-frame clock stops, but the video keeps
  // playing; pause so the run can't fast-forward while away.
  useEffect(() => {
    if (phase !== "playing") return;
    const onVisibility = () => {
      if (document.hidden) {
        pause();
        setPhase("paused");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase, pause]);

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
    // The countdown runs before playback: park the video at the start and hold
    // it paused, so a stray play (or a higher speed) can't run the opening away.
    pause();
    seekTo(0);
    setCountdown(3);
    setPhase("countdown");
    // Bring up the on-screen keyboard, then show the lyrics on small screens.
    inputRef.current?.focus();
    if (window.matchMedia("(max-width: 919px)").matches) {
      lyricRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [ready, pause, seekTo]);

  const togglePause = useCallback(() => {
    if (phase === "playing") {
      pause();
      setPhase("paused");
    } else if (phase === "paused") {
      play();
      setPhase("playing");
    }
  }, [phase, pause, play]);

  /** Reset to the start without playing, so settings can be changed first. */
  const resetToStart = useCallback(() => {
    game.reset();
    pause();
    seekTo(0);
    setPhase("idle");
  }, [game, pause, seekTo]);

  const replay = useCallback(() => {
    game.reset();
    start();
  }, [game, start]);

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

  const selectSpeed = useCallback(
    (next: PlaybackSpeed) => {
      if (phase !== "idle" && phase !== "results") return;
      setSpeed(next);
      writeSetting(SETTING_SPEED, next);
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

  // The intro is the quiet stretch before the first lyric. When it is long
  // enough to be worth skipping, a small tab appears under the cue bar and
  // jumps the video to just before the words start.
  const skipTarget = words.length ? skipIntroTarget(words[0].start, offset) : null;
  const skipIntro = useCallback(() => {
    if (skipTarget !== null) seekTo(skipTarget);
    // Clicking moved focus to the button; hand it back so typing (and the
    // on-screen keyboard) keeps working.
    inputRef.current?.focus();
  }, [skipTarget, seekTo]);

  // Celebrations: a flash for a clean line, and for combo milestones.
  const [flash, setFlash] = useState<GameFlash | null>(null);
  const flashId = useRef(0);
  const previousCombo = useRef(0);
  const previousPerfect = useRef(0);
  useEffect(() => {
    const { combo, perfectLines } = game.state;
    let next: { text: string; tier: ComboFlash } | null = null;

    if (perfectLines > previousPerfect.current) {
      next = { text: "Perfect line!", tier: "medium" };
    }
    if (combo > previousCombo.current) {
      const tier = comboMilestone(combo);
      if (tier && (!next || TIER_RANK[tier] >= TIER_RANK[next.tier])) {
        next = { text: `${combo} combo!`, tier };
      }
    }

    previousCombo.current = combo;
    previousPerfect.current = perfectLines;

    if (next) {
      flashId.current += 1;
      setFlash({ id: flashId.current, ...next });
    }
  }, [game.state.combo, game.state.perfectLines]);

  // A blip on every wrong key.
  const previousErrors = useRef(0);
  useEffect(() => {
    if (game.state.errorKeys > previousErrors.current) playSound("error");
    previousErrors.current = game.state.errorKeys;
  }, [game.state.errorKeys]);

  // Warm the sounds as soon as the island mounts.
  useEffect(() => {
    preloadSounds();
  }, []);

  if (videoId === undefined) return null;
  if (videoId === null) return <TrackPicker ratings={ratings} />;
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
    if (needsTurnstile) {
      return (
        <div className="game-status">
          <div className="panel game-status__panel">
            <p className="comment">
              <span className="slash" aria-hidden="true">
                //
              </span>{" "}
              new song
            </p>
            <h2 className="panel__title mt-2">Quick human check</h2>
            <p className="mt-2 text-ink-soft">
              This song isn&rsquo;t in the library yet, so we just need to check
              you&rsquo;re human before fetching it. It only ever happens once
              per song.
            </p>
            <div className="mt-4">
              <TurnstileChallenge
                key={challengeId}
                siteKey={TURNSTILE_SITE_KEY}
                action={TURNSTILE_ACTION}
                onToken={handleTurnstileToken}
                onError={handleTurnstileError}
              />
            </div>
            {turnstileError ? (
              <p className="track-picker__error mt-2">{turnstileError}</p>
            ) : null}
          </div>
        </div>
      );
    }
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
        speed={speed}
        locked={locked}
        paused={phase === "paused"}
        playing={phase === "playing"}
        onTogglePause={togglePause}
        onReset={resetToStart}
        onSelectMode={selectMode}
        onSelectFailMode={selectFailMode}
        onSelectSpeed={selectSpeed}
        onCalibrate={() => setShowCalibration(true)}
        calibrationOpen={showCalibration}
        offset={offset}
        onChangeOffset={changeOffset}
        onCloseCalibration={() => setShowCalibration(false)}
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
          <CueBar
            cue={cue}
            first={game.state.pointer === 0}
            onSkip={
              phase === "playing" && game.state.pointer === 0 && skipTarget !== null
                ? skipIntro
                : undefined
            }
          />
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

      {flash ? (
        <div
          key={flash.id}
          className={`game-flash game-flash--${flash.tier}`}
          aria-hidden="true"
        >
          {flash.text}
        </div>
      ) : null}

      {phase === "results" ? (
        <EndScreen
          state={game.state}
          accuracy={accuracy}
          rank={rankOf(game.state)}
          mode={mode}
          failMode={failMode}
          speed={speed}
          trackId={track.id}
          elapsed={time}
          progress={progress}
          onReplay={replay}
          onChangeSong={changeSong}
          onClose={closeResults}
        />
      ) : null}
    </div>
  );
}
