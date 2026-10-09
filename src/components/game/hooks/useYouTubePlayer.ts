/**
 * The YouTube IFrame Player API, wrapped as a hook.
 *
 * Loads the API once per page, creates a player for the given video, and
 * exposes a clock (`getTime`) the game loop can read on every keystroke. The
 * rendered `time` is throttled to ~20 Hz, which is plenty for highlighting;
 * scoring always uses the live `getTime()`.
 *
 * The player is created only once both the API and the container element are
 * available. That ordering matters: the track is fetched first, so on a cache
 * miss the container can mount after the API has loaded. Waiting on both (via
 * state) instead of checking `divRef.current` inside the API promise means the
 * player is still created in that case.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerHandle } from "./player";

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  setPlaybackRate(rate: number): void;
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

export interface YouTubePlayerHandle extends PlayerHandle {
  /** Ref callback for the element YouTube replaces with the iframe. */
  containerRef: (node: HTMLElement | null) => void;
}

export function useYouTubePlayer(
  videoId: string | null,
  playbackRate = 1,
): YouTubePlayerHandle {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [apiReady, setApiReady] = useState(false);
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

  // Load the IFrame API once per page, and only when a YouTube video is
  // actually in play (the local library never needs it).
  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    void loadYouTubeApi().then(() => {
      if (!cancelled) setApiReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  // Create the player once the API and the container are both ready.
  useEffect(() => {
    if (!videoId || !apiReady || !container || !window.YT) return;

    setReady(false);
    setState(-1);
    setError(null);

    const player = new window.YT.Player(container, {
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
          playerRef.current = player;
          setReady(true);
          setDuration(player.getDuration());
        },
        onStateChange: (event: { data: number }) => {
          setState(event.data);
          if (event.data === 1) {
            startLoop();
          } else {
            stopLoop();
            setTime(player.getCurrentTime());
          }
        },
        onError: (event: { data: number }) => {
          setError(event.data);
        },
      },
    });
    playerRef.current = player;

    return () => {
      stopLoop();
      try {
        player.destroy();
      } catch {
        // The player may already be gone.
      }
      if (playerRef.current === player) playerRef.current = null;
    };
  }, [videoId, apiReady, container, startLoop, stopLoop]);

  // Keep the player's rate in step with the chosen speed. Re-runs when the
  // player becomes ready (a new video) and whenever the speed changes.
  useEffect(() => {
    try {
      playerRef.current?.setPlaybackRate(playbackRate);
    } catch {
      // The player may already be gone.
    }
  }, [playbackRate, ready]);

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
  const containerRef = useCallback((node: HTMLElement | null) => {
    setContainer(node);
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
