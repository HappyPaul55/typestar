/**
 * A local video file wrapped as a {@link PlayerHandle}.
 *
 * YouTube's IFrame player cannot play a file from disk, so local tracks use a
 * native HTML5 `<video>` element. This hook mirrors the same control surface
 * (`play` / `pause` / `seekTo` / `getTime` / …) and maps the element's events
 * onto YouTube's player-state numbers, so the game loop is none the wiser.
 *
 * The file is exposed to the element as an object URL, created and revoked
 * alongside the element's lifetime.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerHandle } from "./player";

export function useMediaPlayer(file: File | null, playbackRate = 1): PlayerHandle {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
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
      const element = videoRef.current;
      if (element) {
        timeRef.current = element.currentTime;
        const now = performance.now();
        if (now - lastUiRef.current > 50) {
          lastUiRef.current = now;
          setTime(element.currentTime);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Point the element at the file, and clean up the object URL on the way out.
  useEffect(() => {
    if (!video || !file) return;
    setReady(false);
    setState(-1);
    setError(null);
    setTime(0);
    setDuration(0);
    timeRef.current = 0;

    const url = URL.createObjectURL(file);
    video.src = url;
    video.load();

    return () => {
      stopLoop();
      video.pause();
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    };
  }, [video, file, stopLoop]);

  // Mirror the element's events as player state.
  useEffect(() => {
    if (!video) return;
    const onLoadedMetadata = () => {
      setReady(true);
      setDuration(video.duration || 0);
    };
    const onTimeUpdate = () => {
      timeRef.current = video.currentTime;
    };
    const onPlay = () => {
      setState(1);
      startLoop();
    };
    const onPause = () => {
      // `pause` also fires as playback ends; keep the ended state in that case.
      setState(video.ended ? 0 : 2);
      stopLoop();
      setTime(video.currentTime);
    };
    const onEnded = () => {
      stopLoop();
      setState(0);
      setTime(video.duration || video.currentTime);
    };
    const onError = () => setError(video.error?.code ?? 1);

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);
    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
    };
  }, [video, startLoop, stopLoop]);

  // Keep the element's rate in step with the chosen speed.
  useEffect(() => {
    if (video) video.playbackRate = playbackRate;
  }, [video, playbackRate, ready]);

  const play = useCallback(() => {
    void videoRef.current?.play().catch(() => {
      // Autoplay can be refused; the player stays paused and the UI reflects it.
    });
  }, []);
  const pause = useCallback(() => videoRef.current?.pause(), []);
  const seekTo = useCallback((seconds: number) => {
    const element = videoRef.current;
    if (element) element.currentTime = seconds;
    timeRef.current = seconds;
    setTime(seconds);
  }, []);
  const restart = useCallback(() => {
    const element = videoRef.current;
    if (!element) return;
    element.currentTime = 0;
    timeRef.current = 0;
    setTime(0);
    void element.play().catch(() => {});
  }, []);
  const getTime = useCallback(
    () => videoRef.current?.currentTime ?? timeRef.current,
    [],
  );
  const containerRef = useCallback((node: HTMLElement | null) => {
    const element = node instanceof HTMLVideoElement ? node : null;
    videoRef.current = element;
    setVideo(element);
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
