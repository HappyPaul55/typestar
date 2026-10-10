/**
 * TypeStar's game island — the single mount point behind `/play`.
 *
 * The component is deliberately thin: it owns the phase machine, the song load,
 * the player, and the wiring between them and the pure game engines. Everything
 * that differs by play style lives behind the {@link GameEngine} interface, so
 * the shell only ever asks an engine what it can do and what to show.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
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
  comboMilestone,
  cueAt,
  DEFAULT_FAIL_MODE,
  DEFAULT_LEAD,
  DEFAULT_MODE,
  DEFAULT_SPEED,
  isFailMode,
  isGameMode,
  isPlaybackSpeed,
  skipIntroTarget,
  type ComboFlash,
  type FailMode,
  type GameMode,
  type PlaybackSpeed,
  type WordResult,
} from "../../lib/game/engine";
import type { RunContext, RunSettings } from "../../lib/game/game";
import { createEngine } from "../../lib/game/engines";
import { playSound, preloadSounds } from "../../lib/game/audio";
import { TURNSTILE_ACTION, TURNSTILE_SITE_KEY } from "../../lib/game/turnstile";
import {
  formatDuration,
  readSetting,
  SETTING_FAIL_MODE,
  SETTING_FULLSCREEN_HINT,
  SETTING_MODE,
  SETTING_OFFSET_PREFIX,
  SETTING_PLAY_STYLE,
  SETTING_SPEED,
  writeSetting,
} from "../../lib/game/storage";
import {
  DEFAULT_PLAY_STYLE,
  isPlayStyle,
  type PlayStyle,
} from "../../lib/game/modes";
import type { Track, TrackNote } from "../../lib/track/types";
import { RATING_LABEL, ratingOf, type TrackRating } from "../../lib/track/rating";
import { seoTagValues, trackSeo } from "../../lib/seo";
import type { SiteSettings } from "../../lib/site";
import { buildHash, parseHash } from "../../lib/game/url";
import CueBar from "./CueBar";
import Hud from "./Hud";
import LocalLibrary, { type LocalSelection } from "./LocalLibrary";
import LyricHighway from "./LyricHighway";
import PitchHighway from "./PitchHighway";
import PlayerStage from "./PlayerStage";
import ResultsModal from "./ResultsModal";
import StartScreen from "./StartScreen";
import TrackPicker from "./TrackPicker";
import TurnstileChallenge from "./TurnstileChallenge";
import { useGameSession } from "./hooks/useGameSession";
import { useMediaPlayer } from "./hooks/useMediaPlayer";
import { usePitchInput } from "./hooks/usePitchInput";
import { useUltraStarPlayer } from "./hooks/useUltraStarPlayer";
import { useYouTubePlayer } from "./hooks/useYouTubePlayer";

type Phase = "idle" | "countdown" | "playing" | "paused" | "results";

/** A song that is open, from whatever source. Unifies YouTube and local files. */
interface LoadedSong {
  track: Track;
  source: "youtube" | "local-video" | "local-audio";
  /** The local master media: the video for a VTT pair, the audio for UltraStar. */
  media?: File;
  /** UltraStar background video, synced to the audio, when the chart names one. */
  backgroundVideo?: File;
  /** UltraStar `#BACKGROUND` image, shown when there is no background video. */
  background?: File;
  /** UltraStar `#VIDEOGAP`, in seconds. */
  videoGap?: number;
  /** Deep-link reference for a local song (`/play/local?file=…`). */
  filePath?: string;
  /** The song's artist, when the source names one. */
  artist?: string;
}

function localToSong(selection: LocalSelection): LoadedSong {
  return {
    track: selection.track,
    source: selection.kind === "video" ? "local-video" : "local-audio",
    media: selection.media,
    backgroundVideo: selection.backgroundVideo,
    background: selection.background,
    videoGap: selection.videoGap,
    filePath: selection.filePath,
    artist: selection.artist,
  };
}

/** The hero copy shown on `/play/local` while no song is open. */
const LOCAL_PICKER_TITLE = "Play from this device";
const LOCAL_PICKER_SUBTITLE =
  "Point TypeStar at a folder of songs. It reads UltraStar charts (.txt) and videos paired with a same-named .vtt caption. Nothing is uploaded, and the folder stays on your machine.";

interface GameFlash {
  id: number;
  text: string;
  tier: ComboFlash;
}

/** Stable empty list, so a track with no notes does not reset the sing loop. */
const EMPTY_NOTES: TrackNote[] = [];

/** Ordering used to pick the headline when two flashes land on the same hit. */
const TIER_RANK: Record<ComboFlash, number> = { small: 0, medium: 1, large: 2 };

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
  const [song, setSong] = useState<LoadedSong | null>(null);
  const [localMode, setLocalMode] = useState(false);
  const [localRequest, setLocalRequest] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [mode, setMode] = useState<GameMode>(DEFAULT_MODE);
  const [failMode, setFailMode] = useState<FailMode>(DEFAULT_FAIL_MODE);
  const [style, setStyle] = useState<PlayStyle>(DEFAULT_PLAY_STYLE);
  const [speed, setSpeed] = useState<PlaybackSpeed>(DEFAULT_SPEED);
  // Set when the microphone is refused: the run falls back to plain karaoke.
  const [micFallback, setMicFallback] = useState(false);
  const [offset, setOffset] = useState(0);
  const [showCalibration, setShowCalibration] = useState(false);
  // The first-visit nudge that points at the fullscreen button in the game bar.
  const [highlightFullscreen, setHighlightFullscreen] = useState(false);
  // Turnstile is only needed when a track is not already cached or bundled.
  const [needsTurnstile, setNeedsTurnstile] = useState(false);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState(0);
  const [reloadNonce, setReloadNonce] = useState(0);
  // Object URL for a local UltraStar `#BACKGROUND`, used when there is no video.
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const turnstileToken = useRef<string | null>(null);
  const turnstileFailures = useRef(0);
  const shellRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lyricRef = useRef<HTMLDivElement>(null);
  // Read by the microphone frame callback, which outlives individual renders.
  const scoredRef = useRef(false);
  const playingRef = useRef(false);
  /** Throttles scoring dispatches so the island does not re-render every frame. */
  const lastSingSampleRef = useRef(0);

  const activeTrack = song?.track ?? null;
  const isLocal = !!song && song.source !== "youtube";
  const localKind =
    song?.source === "local-video"
      ? "video"
      : song?.source === "local-audio"
        ? "audio"
        : null;
  const localVideoFile = song?.source === "local-video" ? song.media ?? null : null;
  const localAudioFile = song?.source === "local-audio" ? song.media ?? null : null;
  const backgroundVideoFile = song?.backgroundVideo ?? null;
  const backgroundFile = song?.background ?? null;
  const videoGap = song?.videoGap ?? 0;

  // A local UltraStar `#BACKGROUND` image is shown as the stage backdrop when
  // there is no background video. Its object URL lives only as long as the song.
  useEffect(() => {
    if (!backgroundFile) {
      setBackgroundUrl(null);
      return;
    }
    const url = URL.createObjectURL(backgroundFile);
    setBackgroundUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [backgroundFile]);

  const youtubePlayer = useYouTubePlayer(isLocal ? null : (videoId ?? null), speed);
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
  }, []);

  // The hero breadcrumb is `// play`; the local route reveals `/ local`. It is
  // kept in step here so an in-place route change updates it too.
  useEffect(() => {
    const tail = document.getElementById("play-breadcrumb-tail");
    if (tail) tail.hidden = !localMode;
  }, [localMode]);

  // The play style picks the engine; every derived view goes through it.
  const engine = useMemo(() => createEngine(style), [style]);
  const run = useMemo<RunSettings>(
    () => ({ difficulty: mode, runMode: failMode, speed, style, offset }),
    [mode, failMode, speed, style, offset],
  );
  const featured = activeTrack ? FEATURED_BY_ID.get(activeTrack.id) : undefined;
  const artist = featured?.artist ?? song?.artist;
  const capabilities = useMemo(
    () => engine.capabilities(activeTrack, micFallback),
    [engine, activeTrack, micFallback],
  );
  const ctx = useMemo<RunContext>(
    () => ({ time, micFallback, artist }),
    [time, micFallback, artist],
  );

  const session = useGameSession({
    engine,
    track: activeTrack,
    run,
    running: phase === "playing",
    time,
    getTime,
    seek: seekTo,
  });

  // Keep the microphone frame callback in step without re-subscribing.
  scoredRef.current = capabilities.microphone;
  playingRef.current = phase === "playing";

  const pitchInput = usePitchInput((frame) => {
    if (!scoredRef.current || !playingRef.current) return;
    // Scoring does not need every animation frame; ~30 Hz is plenty and keeps
    // the island from re-rendering 60 times a second. The lane stays smooth on
    // its own animation clock.
    const now = performance.now();
    if (now - lastSingSampleRef.current < 33) return;
    lastSingSampleRef.current = now;
    session.sample(frame.midi, frame.rms);
  });

  // The browser Back/Forward buttons walk the history this island builds in
  // place (`/play`, `/play/<id>`, `/play/local`, `/play/local?file=…`), so
  // mirror every pop back into state instead of reloading the document.
  useEffect(() => {
    const onPop = () => {
      const onLocalRoute = isLocalRoute();
      pitchInput.stop();
      setLocalMode(onLocalRoute);
      setSong(null);
      setLoadError(null);
      setPhase("idle");
      if (onLocalRoute) {
        setVideoId(null);
        setLocalRequest(localFileFromLocation());
      } else {
        setVideoId(videoIdFromLocation());
        setLocalRequest(null);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [pitchInput.stop]);

  // The engine turns its opaque state into the few views the UI needs. Memoised
  // so a React render that changes nothing else does not rebuild them.
  const words = useMemo(() => activeTrack?.words ?? [], [activeTrack]);
  const singNotes = useMemo(() => activeTrack?.notes ?? EMPTY_NOTES, [activeTrack]);
  const summary = useMemo(
    () => engine.summary(session.state, activeTrack, run, ctx),
    [engine, session.state, activeTrack, run, ctx],
  );
  const lyricView = useMemo(
    () => engine.lyricView(session.state, activeTrack, run, ctx),
    [engine, session.state, activeTrack, run, ctx],
  );
  // When the words follow the music (karaoke and scored singing), the hit/pending
  // list is a pure function of the pointer. Memoise it on the pointer so the
  // 20 Hz clock tick does not rebuild (and re-render) the lyric highway.
  const lyricResults = useMemo(
    () =>
      lyricView.followMusic
        ? words.map(
            (_, index) => (index < lyricView.pointer ? "hit" : "pending") as WordResult,
          )
        : lyricView.results,
    [lyricView.followMusic, lyricView.pointer, lyricView.results, words],
  );
  const pitchView = useMemo(
    () => engine.pitchView(session.state, activeTrack, run, ctx),
    [engine, session.state, activeTrack, run, ctx],
  );
  const resultsSummary = useMemo(
    () => engine.results(session.state, activeTrack, run, ctx),
    [engine, session.state, activeTrack, run, ctx],
  );

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
    if (isLocal || !videoId) return;
    const hash = buildHash({ mode, failMode, speed, style });
    const path = `${window.location.pathname}${window.location.search}`;
    const target = hash || path;
    const current = `${path}${window.location.hash}`;
    if (current !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [isLocal, videoId, mode, failMode, speed, style]);

  // A new song starts from a clean Turnstile slate, and a fresh microphone try.
  useEffect(() => {
    turnstileToken.current = null;
    turnstileFailures.current = 0;
    setNeedsTurnstile(false);
    setTurnstileError(null);
    setMicFallback(false);
  }, [videoId]);

  // Load the track, and restore its saved sync offset.
  useEffect(() => {
    if (!videoId) {
      setSong(null);
      setLoadError(null);
      return;
    }
    const controller = new AbortController();
    setSong(null);
    setLoadError(null);
    setPhase("idle");

    loadTrack(videoId, "en", controller.signal, turnstileToken.current ?? undefined)
      .then((loaded) => {
        setSong({ track: loaded, source: "youtube" });
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
        if (isLocal) {
          // Something about the file: its artist and how long it runs.
          const parts: string[] = [];
          if (song?.artist) parts.push(song.artist);
          if (duration > 0) parts.push(formatDuration(duration));
          subtitleEl.textContent = parts.join(" · ") || activeTrack.description;
        } else {
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
      if (!isLocal) {
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
  }, [activeTrack, isLocal, song, localMode, site, duration, artist]);

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

  // The run ends when the engine says so: every word or note resolved, or the
  // run failed. Karaoke never reports finished, so only the song ending ends it.
  useEffect(() => {
    if (phase !== "playing") return;
    if (summary.finished || summary.failed) {
      pause();
      pitchInput.stop();
      setPhase("results");
    }
  }, [phase, summary.finished, summary.failed, pause, pitchInput]);

  // The video/audio ending before the lyrics do counts as a finish. A scored run
  // is judged; karaoke has no score, so the song ending is what finishes it.
  useEffect(() => {
    if (phase !== "playing" || playerState !== 0) return;
    if (capabilities.scored) {
      session.finish();
    } else {
      pause();
      setPhase("results");
    }
  }, [phase, playerState, capabilities.scored, session, pause]);

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

  // Capture typing while playing (only styles that use the keyboard).
  useEffect(() => {
    if (phase !== "playing" || !capabilities.keyboard) return;
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
        session.onKey("Backspace");
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        return;
      }
      if (event.key.length === 1) session.onKey(event.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, capabilities.keyboard, session]);

  const start = useCallback(async () => {
    if (!ready) return;
    // Scored singing needs the microphone before the run begins; if it is
    // refused or unavailable the run falls back to unscored karaoke.
    let fallback = false;
    if (capabilities.microphone) {
      const ok = await pitchInput.start();
      fallback = !ok;
      setMicFallback(!ok);
    }
    // The countdown runs before playback: park the video at the start and hold
    // it paused, so a stray play (or a higher speed) can't run the opening away.
    pause();
    seekTo(0);
    if (!fallback) session.start();
    setCountdown(COUNTDOWN_FROM);
    setPhase("countdown");
    // Bring up the on-screen keyboard (typing only), then show the lyrics on
    // small screens.
    if (capabilities.keyboard) inputRef.current?.focus();
    if (window.matchMedia("(max-width: 919px)").matches) {
      lyricRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [
    ready,
    capabilities.microphone,
    capabilities.keyboard,
    pitchInput,
    pause,
    seekTo,
    session,
  ]);

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
    session.reset();
    pitchInput.stop();
    pause();
    seekTo(0);
    setPhase("idle");
  }, [session, pitchInput, pause, seekTo]);

  const replay = useCallback(() => {
    session.reset();
    void start();
  }, [session, start]);

  const closeResults = useCallback(() => {
    session.reset();
    pitchInput.stop();
    setPhase("idle");
  }, [session, pitchInput]);

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
      // Picking Sing again is a fresh attempt at the microphone.
      if (next === "sing") setMicFallback(false);
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
    setSong(localToSong(selection));
    setLocalMode(true);
    setLocalRequest(selection.filePath);
    setLoadError(null);
    setMicFallback(false);
    setPhase("idle");
    const target = `/play/local?file=${encodeURIComponent(selection.filePath)}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== target) window.history.pushState(null, "", target);
  }, []);

  /**
   * Route changes are done in place (pushState + state) rather than by a full
   * page load: a document navigation always exits fullscreen, so the session
   * would drop out of it when the picker or the results screen changed song.
   */
  const openRemotePicker = useCallback(() => {
    pitchInput.stop();
    window.history.pushState(null, "", "/play");
    setLocalMode(false);
    setVideoId(null);
    setSong(null);
    setLocalRequest(null);
    setLoadError(null);
    setPhase("idle");
  }, [pitchInput.stop]);

  const openLocalPicker = useCallback(() => {
    pitchInput.stop();
    window.history.pushState(null, "", "/play/local");
    setLocalMode(true);
    setVideoId(null);
    setSong(null);
    setLocalRequest(null);
    setLoadError(null);
    setPhase("idle");
  }, [pitchInput.stop]);

  /** Open a YouTube track from the picker without reloading the document. */
  const openTrack = useCallback(
    (id: string) => {
      pitchInput.stop();
      window.history.pushState(null, "", `/play/${id}${window.location.hash}`);
      setLocalMode(false);
      setSong(null);
      setVideoId(id);
      setLoadError(null);
      setPhase("idle");
    },
    [pitchInput.stop],
  );

  const changeSong = useCallback(() => {
    // A local run returns to the local library rather than the YouTube picker.
    if (isLocal) openLocalPicker();
    else openRemotePicker();
  }, [isLocal, openLocalPicker, openRemotePicker]);

  // Point first-time players at the fullscreen button: the game is much better
  // in fullscreen, and the nudge is only worth showing once.
  const dismissFullscreenHint = useCallback(() => {
    setHighlightFullscreen(false);
    writeSetting(SETTING_FULLSCREEN_HINT, true);
  }, []);

  useEffect(() => {
    if (!activeTrack || document.fullscreenElement) {
      setHighlightFullscreen(false);
      return;
    }
    if (readSetting<boolean>(SETTING_FULLSCREEN_HINT, false)) {
      setHighlightFullscreen(false);
      return;
    }
    // Mark it seen as soon as it is shown, so later songs stay quiet.
    writeSetting(SETTING_FULLSCREEN_HINT, true);
    setHighlightFullscreen(true);
    // A brief flash: the button returns to normal on its own.
    const timer = window.setTimeout(() => setHighlightFullscreen(false), 2000);
    return () => window.clearTimeout(timer);
  }, [activeTrack]);

  // If the player goes fullscreen by any route, the nudge has done its job.
  useEffect(() => {
    const onFullscreenChange = () => {
      if (document.fullscreenElement) setHighlightFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // The control deck floats over the top of the stage. Publish the distance from
  // the stage's top edge to the deck's bottom edge, so the start overlay can pad
  // past it on small screens rather than hiding beneath it.
  useEffect(() => {
    const hud = hudRef.current;
    const shell = shellRef.current;
    const stage = hud?.parentElement;
    if (!hud || !shell || !stage) return;
    const apply = () => {
      const clearance =
        hud.getBoundingClientRect().bottom - stage.getBoundingClientRect().top;
      shell.style.setProperty("--hud-clearance", `${clearance}px`);
    };
    apply();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(apply);
    observer.observe(hud);
    return () => {
      observer.disconnect();
      shell.style.removeProperty("--hud-clearance");
    };
  }, [activeTrack]);

  const toggleFullscreen = useCallback(() => {
    const element = shellRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void element.requestFullscreen?.();
      dismissFullscreenHint();
    }
  }, [dismissFullscreenHint]);

  const cue = useMemo(
    () => cueAt({ words, offset, lead: DEFAULT_LEAD }, lyricView.pointer, time),
    [words, offset, lyricView.pointer, time],
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
    const { combo, perfectLines } = summary;
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
  }, [summary.combo, summary.perfectLines]);

  // A blip on every wrong key.
  const previousErrors = useRef(0);
  useEffect(() => {
    if (summary.errorKeys > previousErrors.current) playSound("error");
    previousErrors.current = summary.errorKeys;
  }, [summary.errorKeys]);

  // Warm the sounds as soon as the island mounts.
  useEffect(() => {
    preloadSounds();
  }, []);

  // The island root is always mounted and is the fullscreen target, so moving
  // between the game, the picker and the results never drops out of fullscreen.
  // Everything except the live game is a plain screen inside that root.
  let body: ReactNode = null;
  if (videoId === undefined) {
    body = null;
  } else if (localMode && !song) {
    body = (
      <LocalLibrary
        requestedFile={localRequest}
        onSelect={selectLocal}
        onOpenRemote={openRemotePicker}
      />
    );
  } else if (videoId === null && !song) {
    body = (
      <TrackPicker
        ratings={ratings}
        onOpen={openTrack}
        onOpenLocal={openLocalPicker}
      />
    );
  } else if (loadError) {
    body = (
      <StatusPanel
        title="No track to play"
        message={loadError}
        action="Try another song"
        onAction={changeSong}
      />
    );
  } else if (!activeTrack) {
    body = needsTurnstile ? (
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
            you&rsquo;re human before fetching it. It only ever happens once per
            song.
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
    ) : (
      <StatusPanel
        title="Loading track…"
        message="Fetching the captions and timing the words."
      />
    );
  }

  // The route is still being read, or a non-game screen is showing: render it
  // inside the persistent fullscreen root and stop. Every non-game path above
  // has left a loaded track null, so anything past here has one.
  if (videoId === undefined || !activeTrack) {
    return (
      <div ref={shellRef} className="game-root">
        {body}
      </div>
    );
  }

  const locked = phase === "playing" || phase === "countdown" || phase === "paused";

  // The stage is always full width: a video where there is one, otherwise a
  // local UltraStar `#BACKGROUND` image, otherwise a plain dark backdrop.
  const stageMode: "youtube" | "video" | "audio" = localKind ?? "youtube";
  const stageBackground =
    stageMode === "audio" && !backgroundVideoFile ? backgroundUrl : null;
  const overlays = (
    <>
      {phase === "idle" && ready ? (
        <StartScreen
          style={style}
          onSelectStyle={selectStyle}
          help={engine.help(activeTrack, micFallback)}
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
    // Same root element as the non-game screens above (same type, same
    // position), so React reuses the node and the fullscreen session holds.
    <div ref={shellRef} className="game-shell game-root">
      {/*
        A visually-hidden input that holds focus during a run. On mobile it
        brings up the on-screen keyboard; on desktop it keeps keystrokes
        flowing to the game. Only keyboard styles need it.
      */}
      {capabilities.keyboard ? (
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
              session.onKey("Backspace");
            }
          }}
          onInput={(event) => {
            const value = event.currentTarget.value;
            event.currentTarget.value = "";
            for (const char of value) session.onKey(char);
          }}
          onBlur={() => {
            if (phase === "playing" || phase === "countdown") {
              window.setTimeout(() => inputRef.current?.focus(), 0);
            }
          }}
        />
      ) : null}

      {/* The hidden audio that drives a local UltraStar song. */}
      {localKind === "audio" ? <audio ref={containerRef} hidden /> : null}

      <div className="game-stage">
        <div className="game-stage__media">
          <PlayerStage
            containerRef={containerRef}
            videoRef={ultraStarPlayer.videoRef}
            mode={stageMode}
            backgroundSrc={stageBackground}
            ready={ready}
            error={playerError}
            errorMessage={
              isLocal && playerError !== null
                ? "This file could not be played. The browser may not support its format."
                : undefined
            }
          />
        </div>
        <div className="game-stage__scrim" aria-hidden="true" />

        <div className="game-stage__content">
          <div className="lyric-panel" ref={lyricRef}>
          <CueBar
            cue={cue}
            first={lyricView.pointer === 0}
            onSkip={
              phase === "playing" && lyricView.pointer === 0 && skipTarget !== null
                ? skipIntro
                : undefined
            }
          />
          {pitchView ? (
            <PitchHighway
              notes={singNotes}
              results={pitchView.results}
              pointer={pitchView.pointer}
              offset={offset}
              getTime={getTime}
              midiRef={pitchInput.midiRef}
            />
          ) : null}
          <LyricHighway
            track={activeTrack}
            results={lyricResults}
            pointer={lyricView.pointer}
            input={lyricView.input}
            mode={mode}
            cued={cue.waiting}
            karaoke={lyricView.followMusic}
            compact={capabilities.lane !== "lyric"}
          />
          {capabilities.microphone ? (
            <p className="pitch-mic" data-state={pitchInput.status}>
              {pitchInput.error ??
                (pitchInput.status === "listening"
                  ? "microphone live"
                  : "preparing microphone…")}
            </p>
          ) : null}
          {style === "sing" && micFallback ? (
            <p className="pitch-mic" data-state="denied">
              Microphone unavailable — singing along without scoring.
            </p>
          ) : null}
          </div>
        </div>

        {/* The control deck is always visible, on top of every overlay. */}
        <Hud
          summary={summary}
          capabilities={capabilities}
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
          highlightFullscreen={highlightFullscreen}
          rootRef={hudRef}
        />

        {overlays}
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
        <ResultsModal
          summary={resultsSummary}
          onReplay={replay}
          onChangeSong={changeSong}
          onClose={closeResults}
        />
      ) : null}
    </div>
  );
}
