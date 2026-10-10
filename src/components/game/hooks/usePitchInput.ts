/**
 * Microphone pitch input for the singing mode.
 *
 * Requests the microphone, runs a pitch detector over the live signal on every
 * animation frame and reports the detected MIDI note (or `null`) and the frame's
 * loudness. Detection is intentionally per-frame and in the page (not an
 * AudioWorklet): at a 2048-sample window it is well under a millisecond, and it
 * keeps the algorithm in the tested `pitch.ts` module.
 *
 * The stream never leaves the device — the samples are analysed locally and
 * discarded.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { detectMidi, rms } from "../../../lib/game/pitch";

export type MicStatus =
  | "idle"
  | "requesting"
  | "listening"
  | "denied"
  | "unsupported"
  | "error";

export interface PitchFrame {
  /** Monotonic time of the frame, in seconds (performance clock). */
  time: number;
  /** Detected MIDI note, or `null` when nothing confident was heard. */
  midi: number | null;
  /** Frame loudness (RMS), 0..1. */
  rms: number;
}

export interface PitchInputHandle {
  /** Whether this browser can offer the microphone at all. */
  supported: boolean;
  status: MicStatus;
  error: string | null;
  /** Latest detected MIDI note, throttled for display. */
  midi: number | null;
  /** Latest frame loudness, throttled for display. */
  rms: number;
  /** Request the microphone and begin analysis. Resolves `true` on success. */
  start(): Promise<boolean>;
  /** Stop analysis and release the microphone. */
  stop(): void;
}

const ANALYSER_FFT = 2048;
/** UI updates run at ~20 Hz; frames are still delivered every animation frame. */
const UI_INTERVAL_MS = 50;
/** Voices rarely span more than this; it keeps the octave guard meaningful. */
const MIN_FREQUENCY = 65;
const MAX_FREQUENCY = 1000;
/** Number of frames in the display/scoring median filter. */
const SMOOTH_WINDOW = 5;

export function usePitchInput(
  onFrame?: (frame: PitchFrame) => void,
): PitchInputHandle {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<MicStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [midi, setMidi] = useState<number | null>(null);
  const [rmsValue, setRmsValue] = useState(0);

  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastUiRef = useRef(0);
  const historyRef = useRef<number[]>([]);

  // Feature detection happens after mount so SSR and the first client render
  // agree (the browser globals are not available while rendering on the server).
  useEffect(() => {
    const canUse =
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.getUserMedia === "function" &&
      window.isSecureContext;
    setSupported(canUse);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const release = useCallback(() => {
    stopLoop();
    try {
      analyserRef.current?.disconnect();
    } catch {
      // Already disconnected.
    }
    analyserRef.current = null;
    bufferRef.current = null;
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
    if (ctxRef.current) {
      void ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
    historyRef.current = [];
  }, [stopLoop]);

  const smooth = useCallback((value: number | null): number | null => {
    if (value === null) {
      // A silent frame ends the run of pitches, so silence is never held back.
      historyRef.current = [];
      return null;
    }
    const history = historyRef.current;
    history.push(value);
    if (history.length > SMOOTH_WINDOW) history.shift();
    if (history.length < 3) return value;
    const sorted = [...history].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] ?? value;
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    const tick = () => {
      const analyser = analyserRef.current;
      const ctx = ctxRef.current;
      const buffer = bufferRef.current;
      if (analyser && ctx && buffer) {
        analyser.getFloatTimeDomainData(buffer);
        const loudness = rms(buffer);
        const raw = detectMidi(buffer, ctx.sampleRate, {
          minFrequency: MIN_FREQUENCY,
          maxFrequency: MAX_FREQUENCY,
        });
        const detected = smooth(raw);
        onFrameRef.current?.({
          time: performance.now() / 1000,
          midi: detected,
          rms: loudness,
        });
        const now = performance.now();
        if (now - lastUiRef.current > UI_INTERVAL_MS) {
          lastUiRef.current = now;
          setMidi(detected);
          setRmsValue(loudness);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [smooth]);

  const stop = useCallback(() => {
    release();
    setMidi(null);
    setRmsValue(0);
    setStatus((current) =>
      current === "requesting" || current === "listening" ? "idle" : current,
    );
  }, [release]);

  const start = useCallback(async (): Promise<boolean> => {
    if (!supported) {
      setStatus("unsupported");
      return false;
    }
    release();
    setError(null);
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Voice-call filters smear a sustained note; turn them all off.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = ANALYSER_FFT;
      source.connect(analyser);
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize);
      historyRef.current = [];
      setStatus("listening");
      startLoop();
      return true;
    } catch (cause) {
      release();
      const denied =
        cause instanceof DOMException &&
        (cause.name === "NotAllowedError" || cause.name === "SecurityError");
      setStatus(denied ? "denied" : "error");
      setError(
        denied
          ? "Microphone access was declined, so pitching cannot be scored."
          : "The microphone could not be started.",
      );
      return false;
    }
  }, [supported, release, startLoop]);

  // Release the microphone if the island unmounts mid-run.
  useEffect(() => release, [release]);

  return { supported, status, error, midi, rms: rmsValue, start, stop };
}
