/**
 * An UltraStar song's audio, plus an optional background video.
 *
 * The audio (the chart's `#MP3`) is the master clock, because the lyrics are
 * timed to it. When the chart names a `#VIDEO`, that video plays muted and is
 * kept in step with the audio, offset by `#VIDEOGAP` seconds: the video time is
 * `audioTime - videoGap`, clamped at zero.
 *
 * Each source is either a local `File` (played from an object URL) or a remote
 * URL string (hotlinked straight from the origin). The two behave identically.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerHandle } from "./player";

/** A local file, or a remote URL, for the audio or its background video. */
export type MediaSource = File | string;

/** Drift beyond this many seconds triggers a corrective seek on the video. */
const MAX_VIDEO_DRIFT = 0.3;

export interface UltraStarPlayerHandle extends PlayerHandle {
  /** Ref for the optional background video. */
  videoRef: (node: HTMLElement | null) => void;
}

export function useUltraStarPlayer(
  audio: MediaSource | null,
  backgroundVideo: MediaSource | null,
  videoGap = 0,
  playbackRate = 1,
): UltraStarPlayerHandle {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const gapRef = useRef(videoGap);
  gapRef.current = videoGap;

  const rafRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const lastUiRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [state, setState] = useState(-1);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<number | null>(null);

  const syncVideo = useCallback((seconds: number, hard: boolean) => {
    const element = videoElRef.current;
    if (!element) return;
    const target = Math.max(0, seconds - gapRef.current);
    if (hard || Math.abs(element.currentTime - target) > MAX_VIDEO_DRIFT) {
      try {
        element.currentTime = target;
      } catch {
        // The video may not be seekable yet.
      }
    }
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    const tick = () => {
      const element = audioRef.current;
      if (element) {
        timeRef.current = element.currentTime;
        syncVideo(element.currentTime, false);
        const now = performance.now();
        if (now - lastUiRef.current > 50) {
          lastUiRef.current = now;
          setTime(element.currentTime);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [syncVideo]);

  // Load the audio.
  useEffect(() => {
    if (!audioElement || !audio) return;
    setReady(false);
    setState(-1);
    setError(null);
    setTime(0);
    setDuration(0);
    timeRef.current = 0;

    const isFile = typeof audio !== "string";
    const url = isFile ? URL.createObjectURL(audio as File) : audio;
    audioElement.src = url;
    audioElement.load();
    return () => {
      stopLoop();
      audioElement.pause();
      audioElement.removeAttribute("src");
      audioElement.load();
      if (isFile) URL.revokeObjectURL(url);
    };
  }, [audioElement, audio, stopLoop]);

  // Load the background video, if any.
  useEffect(() => {
    if (!videoElement || !backgroundVideo) return;
    const isFile = typeof backgroundVideo !== "string";
    const url = isFile ? URL.createObjectURL(backgroundVideo as File) : backgroundVideo;
    videoElement.src = url;
    videoElement.muted = true;
    videoElement.load();
    return () => {
      videoElement.pause();
      videoElement.removeAttribute("src");
      videoElement.load();
      if (isFile) URL.revokeObjectURL(url);
    };
  }, [videoElement, backgroundVideo]);

  // Mirror the audio element's events as player state, keeping the video close.
  useEffect(() => {
    if (!audioElement) return;
    const onLoadedMetadata = () => {
      setReady(true);
      setDuration(audioElement.duration || 0);
    };
    const onTimeUpdate = () => {
      timeRef.current = audioElement.currentTime;
    };
    const onPlay = () => {
      setState(1);
      const video = videoElRef.current;
      if (video && !video.ended) void video.play().catch(() => {});
      startLoop();
    };
    const onPause = () => {
      videoElRef.current?.pause();
      setState(audioElement.ended ? 0 : 2);
      stopLoop();
      setTime(audioElement.currentTime);
      syncVideo(audioElement.currentTime, true);
    };
    const onEnded = () => {
      videoElRef.current?.pause();
      stopLoop();
      setState(0);
      setTime(audioElement.duration || audioElement.currentTime);
    };
    const onError = () => setError(audioElement.error?.code ?? 1);

    audioElement.addEventListener("loadedmetadata", onLoadedMetadata);
    audioElement.addEventListener("timeupdate", onTimeUpdate);
    audioElement.addEventListener("play", onPlay);
    audioElement.addEventListener("pause", onPause);
    audioElement.addEventListener("ended", onEnded);
    audioElement.addEventListener("error", onError);
    return () => {
      audioElement.removeEventListener("loadedmetadata", onLoadedMetadata);
      audioElement.removeEventListener("timeupdate", onTimeUpdate);
      audioElement.removeEventListener("play", onPlay);
      audioElement.removeEventListener("pause", onPause);
      audioElement.removeEventListener("ended", onEnded);
      audioElement.removeEventListener("error", onError);
    };
  }, [audioElement, startLoop, stopLoop, syncVideo]);

  // Keep the rate in step with the chosen speed.
  useEffect(() => {
    if (audioElement) audioElement.playbackRate = playbackRate;
    if (videoElement) videoElement.playbackRate = playbackRate;
  }, [audioElement, videoElement, playbackRate, ready]);

  const play = useCallback(() => {
    void audioRef.current?.play().catch(() => {
      // Autoplay can be refused; the UI stays paused.
    });
  }, []);
  const pause = useCallback(() => audioRef.current?.pause(), []);
  const seekTo = useCallback(
    (seconds: number) => {
      const element = audioRef.current;
      if (element) element.currentTime = seconds;
      timeRef.current = seconds;
      setTime(seconds);
      syncVideo(seconds, true);
    },
    [syncVideo],
  );
  const restart = useCallback(() => {
    const element = audioRef.current;
    if (!element) return;
    element.currentTime = 0;
    timeRef.current = 0;
    setTime(0);
    syncVideo(0, true);
    void element.play().catch(() => {});
  }, [syncVideo]);
  const getTime = useCallback(
    () => audioRef.current?.currentTime ?? timeRef.current,
    [],
  );

  const containerRef = useCallback((node: HTMLElement | null) => {
    const element = node instanceof HTMLAudioElement ? node : null;
    audioRef.current = element;
    setAudioElement(element);
  }, []);
  const videoRef = useCallback((node: HTMLElement | null) => {
    const element = node instanceof HTMLVideoElement ? node : null;
    videoElRef.current = element;
    setVideoElement(element);
  }, []);

  return {
    containerRef,
    videoRef,
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
