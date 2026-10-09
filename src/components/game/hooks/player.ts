/**
 * The player surface the game drives.
 *
 * Both the YouTube IFrame player and the local HTML5 `<video>` element expose
 * this shape, so `GameApp` can switch between them without caring which one is
 * playing. Player-state numbers follow YouTube's convention so the finish
 * detection (`state === 0`) works for either: -1 unstarted, 0 ended, 1 playing,
 * 2 paused, 3 buffering.
 */

export interface PlayerHandle {
  /** Ref callback for the element the player renders into. */
  containerRef: (node: HTMLElement | null) => void;
  ready: boolean;
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
