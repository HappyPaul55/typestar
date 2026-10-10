/**
 * Real-time monophonic pitch detection.
 *
 * A small, dependency-free implementation of the YIN algorithm (de Cheveigné &
 * Kawahara, 2002): a difference function, cumulative-mean normalisation, an
 * absolute threshold and parabolic interpolation. YIN is used instead of an FFT
 * because it is accurate on low, harmonic-rich voices without binning tricks,
 * and it works directly on the time-domain samples an `AnalyserNode` provides.
 *
 * This module is pure and unit-tested against synthetic buffers, so it can be
 * reasoned about (and corrected) without a microphone.
 */

/** Reference frequency for A4. */
const A4 = 440;

export interface PitchOptions {
  /** Lowest detectable frequency in Hz (default 65, roughly C2). */
  minFrequency?: number;
  /** Highest detectable frequency in Hz (default 1000, roughly B5). */
  maxFrequency?: number;
  /** YIN absolute threshold; lower is stricter (default 0.15). */
  threshold?: number;
  /** RMS below which the frame is treated as silence (default 0.008). */
  silenceRms?: number;
}

const DEFAULTS = {
  minFrequency: 65,
  maxFrequency: 1000,
  threshold: 0.15,
  silenceRms: 0.008,
} as const;

/** Root-mean-square amplitude of a sample buffer. */
export function rms(buffer: Float32Array): number {
  if (buffer.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

/**
 * The fundamental frequency of a mono buffer in Hz, or `null` when the frame is
 * silent or has no confident pitch.
 */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  options: PitchOptions = {},
): number | null {
  const minFrequency = options.minFrequency ?? DEFAULTS.minFrequency;
  const maxFrequency = options.maxFrequency ?? DEFAULTS.maxFrequency;
  const threshold = options.threshold ?? DEFAULTS.threshold;
  const silenceRms = options.silenceRms ?? DEFAULTS.silenceRms;

  const size = buffer.length;
  if (size < 8 || !(sampleRate > 0)) return null;
  if (rms(buffer) < silenceRms) return null;

  const tauMin = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const tauMax = Math.min(size - 1, Math.ceil(sampleRate / minFrequency));
  if (tauMax <= tauMin) return null;

  // Difference function d[tau], restricted to the meaningful lag range.
  const diff = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0;
    const limit = size - tau;
    for (let i = 0; i < limit; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    diff[tau] = sum;
  }

  // Cumulative mean normalised difference, so the first true minimum wins.
  const cmnd = new Float32Array(tauMax + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    running += diff[tau];
    cmnd[tau] = running === 0 ? 1 : (diff[tau] * tau) / running;
  }

  // The first lag below the threshold, then walk to its local minimum.
  let tauEstimate = -1;
  for (let tau = tauMin; tau <= tauMax; tau++) {
    if (cmnd[tau] < threshold) {
      while (tau + 1 <= tauMax && cmnd[tau + 1] < cmnd[tau]) tau++;
      tauEstimate = tau;
      break;
    }
  }
  if (tauEstimate === -1) return null;

  // Parabolic interpolation around the minimum for sub-sample accuracy.
  let bestTau = tauEstimate;
  if (tauEstimate > tauMin && tauEstimate < tauMax) {
    const s0 = cmnd[tauEstimate - 1];
    const s1 = cmnd[tauEstimate];
    const s2 = cmnd[tauEstimate + 1];
    const denom = s0 - 2 * s1 + s2;
    if (denom !== 0) {
      const shift = (s0 - s2) / (2 * denom);
      bestTau = tauEstimate + Math.max(-1, Math.min(1, shift));
    }
  }
  if (!(bestTau > 0)) return null;

  const frequency = sampleRate / bestTau;
  if (frequency < minFrequency || frequency > maxFrequency) return null;
  return frequency;
}

/** Convert a frequency in Hz to a MIDI note number (may be fractional). */
export function frequencyToMidi(frequency: number, a4 = A4): number {
  return 69 + 12 * Math.log2(frequency / a4);
}

/** Convert a MIDI note number to a frequency in Hz. */
export function midiToFrequency(midi: number, a4 = A4): number {
  return a4 * 2 ** ((midi - 69) / 12);
}

/**
 * Detect a pitch and return it as a MIDI number, or `null`. UltraStar stores
 * pitch as semitones from C4 (MIDI 60), so a note's written pitch plus 60 is its
 * MIDI number.
 */
export function detectMidi(
  buffer: Float32Array,
  sampleRate: number,
  options?: PitchOptions,
): number | null {
  const frequency = detectPitch(buffer, sampleRate, options);
  return frequency === null ? null : frequencyToMidi(frequency);
}
