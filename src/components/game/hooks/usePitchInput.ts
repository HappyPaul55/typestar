/**
 * Microphone pitch input for the singing mode.
 *
 * Requests the microphone, runs a pitch detector over the live signal on every
 * animation frame and reports the detected MIDI note (or `null`), the frame's
 * loudness and the detector's clarity. Detection is intentionally per-frame and
 * in the page (not an AudioWorklet): the detector decimates the 2048-sample
 * window before analysis and reuses its buffers, so a frame costs a fraction of
 * a millisecond and the algorithm stays in the tested `pitch.ts` module.
 *
 * Detection only runs while `active` reports true (the run is playing and
 * pitched), so a paused or karaoke run spends nothing on the microphone. The
 * stream never leaves the device — the samples are analysed locally and
 * discarded.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPitchDetector, rms } from "../../../lib/game/pitch";

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
  /** How periodic the frame was, 0..1 (0 when nothing was heard). */
  clarity: number;
}

export interface PitchInputOptions {
  /**
   * Whether detection should run right now. When this returns `false` the
   * microphone stays open but no samples are analysed (and the reported note is
   * `null`), so a paused or unpitched run costs nothing.
   */
  active?: () => boolean;
}

export interface PitchInputHandle {
  /** Whether this browser can offer the microphone at all. */
  supported: boolean;
  status: MicStatus;
  error: string | null;
  /**
   * The latest detected MIDI note, updated every frame (not throttled). The
   * pitch lane reads this in its animation loop so the cursor stays smooth.
   */
  midiRef: { readonly current: number | null };
  /** Request the microphone and begin analysis. Resolves `true` on success. */
  start(): Promise<boolean>;
  /** Stop analysis and release the microphone. */
  stop(): void;
}

const ANALYSER_FFT = 2048;
/** Voices rarely span more than this; it keeps the octave guard meaningful. */
const MIN_FREQUENCY = 65;
/** Covers the soprano range (≈ F#6); the detector still clamps to Nyquist. */
const MAX_FREQUENCY = 1500;
/** Decimate before detection: a voice carries nothing useful above ~1 kHz. */
const DECIMATE = 3;
/** Number of frames in the display/scoring median filter. */
const SMOOTH_WINDOW = 5;

export function usePitchInput(
  onFrame?: (frame: PitchFrame) => void,
  options: PitchInputOptions = {},
): PitchInputHandle {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<MicStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  // Read from the animation loop, so changing `active` never re-subscribes.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // One detector for the hook's lifetime: it owns the decimation and the reused
  // scratch buffers, so the per-frame work allocates nothing.
  const detector = useMemo(
    () =>
      createPitchDetector({
        minFrequency: MIN_FREQUENCY,
        maxFrequency: MAX_FREQUENCY,
        decimate: DECIMATE,
      }),
    [],
  );

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);
  const historyRef = useRef<number[]>([]);
  /** The live detected note, updated every frame for the pitch cursor. */
  const midiRef = useRef<number | null>(null);

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
    midiRef.current = null;
    detector.reset();
  }, [stopLoop, detector]);

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
      const active = optionsRef.current.active?.() ?? true;
      const analyser = analyserRef.current;
      const ctx = ctxRef.current;
      const buffer = bufferRef.current;
      if (active && analyser && ctx && buffer) {
        analyser.getFloatTimeDomainData(buffer);
        const loudness = rms(buffer);
        const { midi: raw, clarity } = detector.detectMidi(buffer, ctx.sampleRate);
        const detected = smooth(raw);
        midiRef.current = detected;
        onFrameRef.current?.({
          time: performance.now() / 1000,
          midi: detected,
          rms: loudness,
          clarity,
        });
      } else if (!active) {
        // Drop the run so a stale note is not held across a pause.
        historyRef.current = [];
        midiRef.current = null;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [smooth, detector]);

  const stop = useCallback(() => {
    release();
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

  return { supported, status, error, midiRef, start, stop };
}
