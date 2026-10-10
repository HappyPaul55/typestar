import { describe, expect, test } from "bun:test";
import {
  detectMidi,
  detectPitch,
  frequencyToMidi,
  midiToFrequency,
  rms,
} from "./pitch";

function sine(frequency: number, sampleRate: number, length: number, amplitude = 0.5) {
  const buffer = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }
  return buffer;
}

describe("rms", () => {
  test("is zero for silence and positive for a signal", () => {
    expect(rms(new Float32Array(128))).toBe(0);
    expect(rms(sine(440, 48000, 128))).toBeGreaterThan(0);
  });
});

describe("detectPitch", () => {
  const sampleRate = 48000;
  const length = 2048;

  test("finds the fundamental of a pure tone", () => {
    const frequency = detectPitch(sine(440, sampleRate, length), sampleRate);
    expect(frequency).not.toBeNull();
    expect(frequency!).toBeCloseTo(440, 0);
    expect(Math.abs(frequencyToMidi(frequency!) - 69)).toBeLessThan(0.3);
  });

  test("handles a low male-range note", () => {
    const frequency = detectPitch(sine(110, sampleRate, length), sampleRate);
    expect(frequency).not.toBeNull();
    expect(Math.abs(frequencyToMidi(frequency!) - 45)).toBeLessThan(1);
  });

  test("returns a MIDI number from detectMidi", () => {
    const midi = detectMidi(sine(523.25, sampleRate, length), sampleRate);
    expect(midi).not.toBeNull();
    expect(midi!).toBeCloseTo(72, 0);
  });

  test("rejects silence", () => {
    expect(detectPitch(new Float32Array(length), sampleRate)).toBeNull();
  });

  test("rejects a signal below the silence gate", () => {
    expect(detectPitch(sine(440, sampleRate, length, 0.001), sampleRate)).toBeNull();
  });

  test("finds the fundamental under a weak fundamental", () => {
    // A tone whose fundamental is quieter than its harmonics.
    const buffer = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      buffer[i] =
        0.1 * Math.sin(2 * Math.PI * 220 * t) +
        0.5 * Math.sin(2 * Math.PI * 440 * t) +
        0.3 * Math.sin(2 * Math.PI * 660 * t);
    }
    const frequency = detectPitch(buffer, sampleRate);
    expect(frequency).not.toBeNull();
    expect(Math.abs(frequencyToMidi(frequency!) - 57)).toBeLessThan(0.5);
  });
});

describe("note conversion", () => {
  test("round-trips MIDI and frequency", () => {
    for (const midi of [40, 57, 69, 84]) {
      expect(frequencyToMidi(midiToFrequency(midi))).toBeCloseTo(midi, 6);
    }
  });

  test("maps A4 to MIDI 69", () => {
    expect(frequencyToMidi(440)).toBeCloseTo(69, 6);
  });
});
