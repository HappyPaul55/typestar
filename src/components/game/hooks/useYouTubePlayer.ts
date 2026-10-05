/**
 * The YouTube IFrame Player API, wrapped as a hook.
 *
 * Loads the API once per page, creates a player for the given video, and
 * exposes a clock (`getTime`) the game loop can read on every keystroke. The
 * rendered `time` is throttled to ~20 Hz, which is plenty for highlighting;
 * scoring always uses the live `getTime()`.
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.append(script);
  });
  return apiPromise;
}

export interface YouTubePlayerHandle {
  /** Ref callback for the element YouTube replaces with the iframe. */
  containerRef: (node: HTMLDivElement | null) => void;
  ready: boolean;
  /** YouTube player state: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering. */
  state: number;
  time: number;
  duration: number;
  error: number | null;
  play(): void;
  pause(): void;
  restart(): void;
  seekTo(seconds: number): void;
  getTime(): number;
}

export function useYouTubePlayer(videoId: string | null): YouTubePlayerHandle {
  const divRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const lastUiRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [state, setState] = useState(-1);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<number | null>(null);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    const tick = () => {
      const player = playerRef.current;
      if (player) {
        const current = player.getCurrentTime();
        timeRef.current = current;
        const now = performance.now();
        if (now - lastUiRef.current > 50) {
          lastUiRef.current = now;
          setTime(current);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    setReady(false);
    setState(-1);
    setError(null);

    void loadYouTubeApi().then(() => {
      if (cancelled || !divRef.current || !window.YT) return;
      const player = new window.YT.Player(divRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          controls: 1,
          disablekb: 1,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            playerRef.current = player;
            setReady(true);
            setDuration(player.getDuration());
          },
          onStateChange: (event: { data: number }) => {
            if (cancelled) return;
            setState(event.data);
            if (event.data === 1) {
              startLoop();
            } else {
              stopLoop();
              setTime(player.getCurrentTime());
            }
          },
          onError: (event: { data: number }) => {
            if (!cancelled) setError(event.data);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      stopLoop();
      try {
        playerRef.current?.destroy();
      } catch {
        // The player may already be gone.
      }
      playerRef.current = null;
    };
  }, [videoId, startLoop, stopLoop]);

  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);
  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
    timeRef.current = seconds;
    setTime(seconds);
  }, []);
  const restart = useCallback(() => {
    playerRef.current?.seekTo(0, true);
    timeRef.current = 0;
    setTime(0);
    playerRef.current?.playVideo();
  }, []);
  const getTime = useCallback(
    () => playerRef.current?.getCurrentTime() ?? timeRef.current,
    [],
  );
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    divRef.current = node;
  }, []);

  return {
    containerRef,
    ready,
    state,
    time,
    duration,
    error,
    play,
    pause,
    restart,
    seekTo,
    getTime,
  };
}
