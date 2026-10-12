/**
 * Small display helpers shared by the score pages.
 */

/** A short, human "how long ago" for a timestamp. */
export function timeAgo(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** The `/play/...` link for a namespaced track id, when one exists. */
export function playHref(trackId: string, trackType: string): string {
  if (trackType === "youtube" && trackId.startsWith("youtube-")) {
    return `/play/youtube/${trackId.slice("youtube-".length)}`;
  }
  return "/play";
}

/** A compact label for a run's mode, e.g. `hard · instant · 1.25×`. */
export function modeLabel(input: {
  style: string;
  difficulty: string;
  runMode: string;
  speed: number;
}): string {
  const parts = [input.style, input.difficulty];
  if (input.runMode !== "normal") parts.push(input.runMode);
  if (input.speed !== 1) parts.push(`${input.speed}×`);
  return parts.join(" · ");
}
