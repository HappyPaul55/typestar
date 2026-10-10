/**
 * TypeStar's game island — the single mount point behind `/play`.
 *
 * The component is deliberately thin: it owns the phase machine, the track
 * load and the wiring between the YouTube player and the pure game reducer.
 * All the interesting rules live in `src/lib/game/engine.ts`.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { FEATURED_BY_ID } from "../../content/tracks/featured";
import {
  isLocalRoute,
  loadTrack,
  localFileFromLocation,
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
  type WordResult,
} from "../../lib/game/engine";
import { playSound, preloadSounds } from "../../lib/game/audio";
import { TURNSTILE_ACTION, TURNSTILE_SITE_KEY } from "../../lib/game/turnstile";
import {
  formatDuration,
  readSetting,
  SETTING_FAIL_MODE,
  SETTING_MODE,
  SETTING_OFFSET_PREFIX,
  SETTING_PLAY_STYLE,
  SETTING_SPEED,
  writeSetting,
} from "../../lib/game/storage";
import { karaokePointer, karaokeProgress } from "../../lib/game/karaoke";
import {
  DEFAULT_PLAY_STYLE,
  isPlayStyle,
  PLAY_STYLE_HELP,
  PLAY_STYLE_LABEL,
  PLAY_STYLES,
  singBehavior,
  type PlayStyle,
} from "../../lib/game/modes";
import type { Track } from "../../lib/track/types";
import { RATING_LABEL, ratingOf, type TrackRating } from "../../lib/track/rating";
import { seoTagValues, trackSeo } from "../../lib/seo";
import type { SiteSettings } from "../../lib/site";
import { buildHash, parseHash } from "../../lib/game/url";
import CueBar from "./CueBar";
import EndScreen from "./EndScreen";
import Hud from "./Hud";
import KaraokeResults from "./KaraokeResults";
import LocalLibrary, { type LocalSelection } from "./LocalLibrary";
import LyricHighway from "./LyricHighway";
import PlayerStage from "./PlayerStage";
import TrackPicker from "./TrackPicker";
import TurnstileChallenge from "./TurnstileChallenge";
import { useGameLoop } from "./hooks/useGameLoop";
import { useMediaPlayer } from "./hooks/useMediaPlayer";
import { useUltraStarPlayer } from "./hooks/useUltraStarPlayer";
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

/** The hero copy shown on `/play/local` while no song is open. */
const LOCAL_PICKER_TITLE = "Play from this device";
const LOCAL_PICKER_SUBTITLE =
  "Point TypeStar at a folder of songs. It reads UltraStar charts (.txt) and videos paired with a same-named .vtt caption. Nothing is uploaded, and the folder stays on your machine.";

interface GameFlash {
  id: number;
  text: string;
  tier: ComboFlash;
}

/** Ordering used to pick the headline when two flashes land on the same hit. */
const TIER_RANK: Record<ComboFlash, number> = { small: 0, medium: 1, large: 2 };

function StartOverlay({
  style,
  onSelectStyle,
  mode,
  onSelectMode,
  singScored,
  onStart,
}: {
  style: PlayStyle;
  onSelectStyle(style: PlayStyle): void;
  mode: GameMode;
  onSelectMode(mode: GameMode): void;
  /** Whether Sing on this track is scored (pitch) rather than plain karaoke. */
  singScored: boolean;
  onStart(): void;
}) {
  const title = style === "sing" ? "Sing along." : "Type the words in time.";
  const singHelp = singScored
    ? "Hit the notes as they arrive — your pitch is scored."
    : "The words light up as they arrive — sing along. No score is kept.";
  return (
    <div className="game-overlay game-overlay--start" role="dialog" aria-label="Start">
      <p className="comment on-ink">
        <span className="slash" aria-hidden="true">
          //
        </span>{" "}
        ready
      </p>
      <h2 className="game-overlay__title">{title}</h2>
      <p className="game-overlay__help">
        {style === "sing" ? singHelp : PLAY_STYLE_HELP.type}
      </p>

      <button
        type="button"
        className="btn-game btn-game--primary btn-game--start"
        onClick={onStart}
      >
        Start
      </button>

      <div className="mode-picker" role="group" aria-label="Play style">
        {PLAY_STYLES.map((value) => (
          <button
            key={value}
            type="button"
            className={"mode-picker__option" + (value === style ? " is-active" : "")}
            aria-pressed={value === style}
            onClick={() => onSelectStyle(value)}
          >
            {PLAY_STYLE_LABEL[value]}
          </button>
        ))}
      </div>

      {style === "type" ? (
        <>
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
        </>
      ) : null}
    </div>
  );
}

/** The countdown runs from 3 in 650ms steps, then a 500ms beat before play. */
const COUNTDOWN_FROM = 3;
const COUNTDOWN_STEP_MS = 650;
const COUNTDOWN_LEAD_MS = 500;

function CountdownOverlay({ value }: { value: number }) {
  // The veil fades out across the whole countdown, so it never jumps between
  // numbers and the lyrics show through before the song starts.
  return (
    <div
      className="game-overlay game-overlay--countdown"
      aria-live="assertive"
      style={
        {
          "--countdown-ms": `${COUNTDOWN_FROM * COUNTDOWN_STEP_MS}ms`,
        } as CSSProperties
      }
    >
      <span className="countdown__number">{value}</span>
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
  const [localMode, setLocalMode] = useState(false);
  const [local, setLocal] = useState<LocalSelection | null>(null);
  const [localRequest, setLocalRequest] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [mode, setMode] = useState<GameMode>(DEFAULT_MODE);
  const [failMode, setFailMode] = useState<FailMode>(DEFAULT_FAIL_MODE);
  const [style, setStyle] = useState<PlayStyle>(DEFAULT_PLAY_STYLE);
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

  const localKind = local?.kind ?? null;
  const localVideoFile = local && local.kind === "video" ? local.media : null;
  const localAudioFile = local && local.kind === "audio" ? local.media : null;
  const backgroundVideoFile = local?.backgroundVideo ?? null;
  const videoGap = local?.videoGap ?? 0;

  const youtubePlayer = useYouTubePlayer(local ? null : (videoId ?? null), speed);
  const mediaPlayer = useMediaPlayer(localVideoFile, speed);
  const ultraStarPlayer = useUltraStarPlayer(
    localAudioFile,
    backgroundVideoFile,
    videoGap,
    speed,
  );
  const player =
    localKind === "video"
      ? mediaPlayer
      : localKind === "audio"
        ? ultraStarPlayer
        : youtubePlayer;
  const { ready, error: playerError, containerRef, play, pause, seekTo, getTime, time, duration, state: playerState } = player;

  // Read the route from the address bar after hydration (SSR-safe).
  useEffect(() => {
    const onLocalRoute = isLocalRoute();
    setLocalMode(onLocalRoute);
    setVideoId(onLocalRoute ? null : videoIdFromLocation());
    setLocalRequest(onLocalRoute ? localFileFromLocation() : null);

    // The hero breadcrumb is `// play`; the local route reveals `/ local`.
    const tail = document.getElementById("play-breadcrumb-tail");
    if (tail) tail.hidden = !onLocalRoute;
  }, []);

  // The browser Back/Forward buttons move between local songs (each selection
  // pushes `/play/local?file=…`), so mirror them back into state.
  useEffect(() => {
    if (!localMode) return;
    const onPop = () => {
      if (!isLocalRoute()) {
        window.location.reload();
        return;
      }
      setLocal(null);
      setLocalRequest(localFileFromLocation());
      setPhase("idle");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [localMode]);

  // The track actually in play: a local file when one is open, otherwise the
  // track fetched from the API.
  const activeTrack = local?.track ?? track;

  // Sing on a track with measured notes is scored against them; anything else
  // (YouTube captions, local `.vtt`) is an unscored karaoke sing-along.
  const singScored = activeTrack ? singBehavior(activeTrack) === "scored" : false;
  const karaoke = style === "sing" && !singScored;

  useEffect(() => {
    const parsed = parseHash(window.location.hash);
    const storedMode = readSetting<unknown>(SETTING_MODE, DEFAULT_MODE);
    const storedFail = readSetting<unknown>(SETTING_FAIL_MODE, DEFAULT_FAIL_MODE);
    const storedSpeed = readSetting<unknown>(SETTING_SPEED, DEFAULT_SPEED);
    const storedStyle = readSetting<unknown>(SETTING_PLAY_STYLE, DEFAULT_PLAY_STYLE);
    const resolvedMode = parsed.mode ?? (isGameMode(storedMode) ? storedMode : DEFAULT_MODE);
    const resolvedFail = parsed.failMode ?? (isFailMode(storedFail) ? storedFail : DEFAULT_FAIL_MODE);
    const resolvedSpeed = parsed.speed ?? (isPlaybackSpeed(storedSpeed) ? storedSpeed : DEFAULT_SPEED);
    const resolvedStyle =
      parsed.style ?? (isPlayStyle(storedStyle) ? storedStyle : DEFAULT_PLAY_STYLE);
    setMode(resolvedMode);
    setFailMode(resolvedFail);
    setSpeed(resolvedSpeed);
    setStyle(resolvedStyle);
    // Persist the resolved settings so later visits remember them.
    writeSetting(SETTING_MODE, resolvedMode);
    writeSetting(SETTING_FAIL_MODE, resolvedFail);
    writeSetting(SETTING_SPEED, resolvedSpeed);
    writeSetting(SETTING_PLAY_STYLE, resolvedStyle);
  }, []);

  // Keep the URL hash in step with the settings, so the page is shareable.
  // Defaults produce an empty hash, which is removed for a clean URL. Local
  // runs are not shareable, so they keep the plain `/play/local` URL.
  useEffect(() => {
    if (local || !videoId) return;
    const hash = buildHash({ mode, failMode, speed, style });
    const path = `${window.location.pathname}${window.location.search}`;
    const target = hash || path;
    const current = `${path}${window.location.hash}`;
    if (current !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [local, videoId, mode, failMode, speed, style]);

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

  // Reflect the current song — or the local picker — in the page title and the
  // shared page header. The header is one static element for every /play route,
  // so it is set from state here.
  useEffect(() => {
    const titleEl = document.getElementById("play-title");
    const subtitleEl = document.getElementById("play-subtitle");
    const defaultSubtitle = `${site.tagline} — YouTube supplies the music and visuals; you type the lyrics as the words arrive.`;

    if (activeTrack) {
      document.title = `${activeTrack.title} — ${site.name}`;
      if (titleEl) titleEl.textContent = activeTrack.title;
      if (subtitleEl) {
        if (local) {
          // Something about the file: its artist and how long it runs.
          const parts: string[] = [];
          if (local.artist) parts.push(local.artist);
          if (duration > 0) parts.push(formatDuration(duration));
          subtitleEl.textContent = parts.join(" · ") || activeTrack.description;
        } else {
          const artist = FEATURED_BY_ID.get(activeTrack.id)?.artist;
          subtitleEl.textContent = artist ?? defaultSubtitle;
        }
      }
    } else if (localMode) {
      if (titleEl) titleEl.textContent = LOCAL_PICKER_TITLE;
      if (subtitleEl) subtitleEl.textContent = LOCAL_PICKER_SUBTITLE;
    } else {
      if (titleEl) titleEl.textContent = site.name;
      if (subtitleEl) subtitleEl.textContent = defaultSubtitle;
    }

    // Keep the social/meta tags accurate. In production the Worker renders them
    // server-side; this covers `astro dev` (and keeps the browser tab in step).
    // A local file has no shareable URL, so its tags are left alone.
    const restores: Array<() => void> = [];
    let ratingEl: HTMLElement | null = null;
    if (activeTrack) {
      if (!local) {
        const origin = window.location.origin;
        for (const [key, value] of Object.entries(
          seoTagValues(trackSeo(activeTrack, origin)),
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
      }

      // The rating is a property of the song's lyrics, computed on the fly.
      ratingEl = document.getElementById("play-rating");
      const ratingValueEl = document.getElementById("play-rating-value");
      if (ratingEl) {
        const rating = ratingOf(activeTrack);
        ratingEl.dataset.rating = rating;
        if (ratingValueEl) ratingValueEl.textContent = RATING_LABEL[rating];
        ratingEl.hidden = false;
      }
    }

    return () => {
      document.title = `Play ${site.name}`;
      if (ratingEl) ratingEl.hidden = true;
      for (const restore of restores) restore();
    };
  }, [activeTrack, local, localMode, site, duration]);

  const words = useMemo(() => activeTrack?.words ?? [], [activeTrack]);
  const lines = useMemo(() => activeTrack?.lines ?? [], [activeTrack]);
  const game = useGameLoop({
    words,
    lines,
    offset,
    mode,
    failMode,
    running: phase === "playing" && !karaoke,
    time,
    getTime,
    seek: seekTo,
  });

  // Countdown, then play. After the last number, wait a beat before starting so
  // the countdown is fully gone 0.5s before the song does — the player can read
  // the opening lyrics without the overlay in the way.
  useEffect(() => {
    if (phase !== "countdown") return;
    const timer = window.setTimeout(
      () => {
        if (countdown <= 0) {
          play();
          setPhase("playing");
        } else {
          setCountdown((value) => value - 1);
        }
      },
      countdown <= 0 ? COUNTDOWN_LEAD_MS : COUNTDOWN_STEP_MS,
    );
    return () => window.clearTimeout(timer);
  }, [phase, countdown, play]);

  // Finished when every word is resolved, or when the run fails.
  useEffect(() => {
    if (!karaoke && phase === "playing" && (game.state.finished || game.state.failed)) {
      pause();
      setPhase("results");
    }
  }, [phase, karaoke, game.state.finished, game.state.failed, pause]);

  // The video/audio ending before the lyrics do counts as a finish. Karaoke has
  // no lyric pointer to exhaust, so the song ending is what finishes it.
  useEffect(() => {
    if (phase !== "playing" || playerState !== 0) return;
    if (karaoke) {
      pause();
      setPhase("results");
    } else {
      game.finish();
    }
  }, [phase, playerState, karaoke, pause, game.finish]);

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

  // Capture typing while playing (karaoke keeps its hands free).
  useEffect(() => {
    if (phase !== "playing" || karaoke) return;
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
  }, [phase, karaoke, game.onKey]);

  const start = useCallback(() => {
    if (!ready) return;
    // The countdown runs before playback: park the video at the start and hold
    // it paused, so a stray play (or a higher speed) can't run the opening away.
    pause();
    seekTo(0);
    setCountdown(COUNTDOWN_FROM);
    setPhase("countdown");
    // Bring up the on-screen keyboard (typing only), then show the lyrics on
    // small screens.
    if (!karaoke) inputRef.current?.focus();
    if (window.matchMedia("(max-width: 919px)").matches) {
      lyricRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [ready, pause, seekTo, karaoke]);

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

  const selectStyle = useCallback(
    (next: PlayStyle) => {
      if (phase !== "idle" && phase !== "results") return;
      setStyle(next);
      writeSetting(SETTING_PLAY_STYLE, next);
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

  /** Open a local song and reflect it in the URL, so it can be bookmarked. */
  const selectLocal = useCallback((selection: LocalSelection) => {
    setLocal(selection);
    setLocalRequest(selection.filePath);
    setPhase("idle");
    const target = `/play/local?file=${encodeURIComponent(selection.filePath)}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== target) window.history.pushState(null, "", target);
  }, []);

  const changeSong = useCallback(() => {
    // A local run returns to the local library rather than the YouTube picker.
    if (local) {
      window.history.pushState(null, "", "/play/local");
      setLocal(null);
      setLocalRequest(null);
      setPhase("idle");
      return;
    }
    window.location.href = "/play";
  }, [local]);

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
  if (localMode && !local) {
    return (
      <LocalLibrary requestedFile={localRequest} onSelect={selectLocal} />
    );
  }
  if (videoId === null && !local) return <TrackPicker ratings={ratings} />;
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
  if (!activeTrack) {
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
  // Karaoke has no typed pointer; its progress follows the music instead.
  const karaokePos = karaoke ? karaokePointer(words, offset, time) : 0;
  const progress = karaoke
    ? karaokeProgress(words, offset, time)
    : words.length
      ? game.state.pointer / words.length
      : 0;
  const highwayPointer = karaoke ? karaokePos : game.state.pointer;
  const highwayResults = karaoke
    ? words.map((_, index) => (index < karaokePos ? "hit" : "pending") as WordResult)
    : game.state.results;
  const featured = FEATURED_BY_ID.get(activeTrack.id);
  const locked = phase === "playing" || phase === "countdown" || phase === "paused";

  // A local UltraStar song without a background video has no stage: the lyric
  // highway takes the full width instead. The overlays move with it.
  const hasStage =
    !local || localKind === "video" || (localKind === "audio" && !!backgroundVideoFile);
  const stageMode: "youtube" | "video" | "audio" =
    localKind === "video" ? "video" : localKind === "audio" ? "audio" : "youtube";
  const overlays = (
    <>
      {phase === "idle" && ready ? (
        <StartOverlay
          style={style}
          onSelectStyle={selectStyle}
          mode={mode}
          onSelectMode={selectMode}
          singScored={singScored}
          onStart={start}
        />
      ) : null}
      {phase === "countdown" && countdown > 0 ? (
        <CountdownOverlay value={countdown} />
      ) : null}
      {phase === "paused" ? <PausedOverlay onResume={togglePause} /> : null}
    </>
  );

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
        karaoke={karaoke}
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

      {/* The hidden audio that drives a local UltraStar song. */}
      {localKind === "audio" ? <audio ref={containerRef} hidden /> : null}

      <div className={"game-shell__grid" + (hasStage ? "" : " game-shell__grid--wide")}>
        {hasStage ? (
          <PlayerStage
            containerRef={containerRef}
            videoRef={ultraStarPlayer.videoRef}
            mode={stageMode}
            ready={ready}
            error={playerError}
            errorMessage={
              local && playerError !== null
                ? "This file could not be played. The browser may not support its format."
                : undefined
            }
            title={activeTrack.title}
            artist={featured?.artist}
            shielded={phase === "playing" && !karaoke}
            onShield={() => {
              if (!karaoke) inputRef.current?.focus();
            }}
          >
            {overlays}
          </PlayerStage>
        ) : null}

        <div className="lyric-panel" ref={lyricRef}>
          {!hasStage ? overlays : null}
          <CueBar
            cue={cue}
            first={(karaoke ? karaokePos : game.state.pointer) === 0}
            onSkip={
              phase === "playing" &&
              (karaoke ? karaokePos : game.state.pointer) === 0 &&
              skipTarget !== null
                ? skipIntro
                : undefined
            }
          />
          <LyricHighway
            track={activeTrack}
            results={highwayResults}
            pointer={highwayPointer}
            input={karaoke ? "" : game.state.input}
            mode={mode}
            cued={cue.waiting}
            karaoke={karaoke}
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
        karaoke ? (
          <KaraokeResults
            title={activeTrack.title}
            artist={featured?.artist ?? local?.artist}
            elapsed={time}
            onReplay={replay}
            onChangeSong={changeSong}
            onClose={closeResults}
          />
        ) : (
          <EndScreen
            state={game.state}
            accuracy={accuracy}
            rank={rankOf(game.state)}
            mode={mode}
            failMode={failMode}
            speed={speed}
            trackId={activeTrack.id}
            elapsed={time}
            progress={progress}
            onReplay={replay}
            onChangeSong={changeSong}
            onClose={closeResults}
          />
        )
      ) : null}
    </div>
  );
}
