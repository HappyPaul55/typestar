/**
 * The engine registry: the one place that maps a play style to its
 * implementation. Adding Combo later is a new entry here and a new file; the
 * shell never changes.
 */

import type { AnyGameEngine } from "./game";
import { PLAY_STYLES, type PlayStyle } from "./modes";
import { SingGame } from "./sing-game";
import { TypeGame } from "./type-game";

const REGISTRY: Record<PlayStyle, AnyGameEngine> = {
  type: TypeGame,
  sing: SingGame,
};

export function createEngine(style: PlayStyle): AnyGameEngine {
  return REGISTRY[style];
}

/** Every engine, in the order the start screen offers them. */
export function gameEngineList(): AnyGameEngine[] {
  return PLAY_STYLES.map((style) => REGISTRY[style]);
}
