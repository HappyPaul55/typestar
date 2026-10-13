/**
 * Small display helpers shared by the score pages.
 */

import { localePath } from "../../i18n/paths";
import {
  difficultyLabel,
  runModeLabel,
  speedLabel,
  styleLabel,
} from "../../i18n/labels";
import type { Translate } from "../../i18n";
import type { Locale } from "../../i18n/locales";

/** A short, human "how long ago" for a timestamp, in the page's locale. */
export function timeAgo(
  iso: string,
  t: Translate,
  locale: Locale,
  now = Date.now(),
): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 60) return t("time.justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("time.minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("time.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t("time.daysAgo", { count: days });
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" });
}

/** The locale-aware `/play/...` link for a namespaced track id, when one exists. */
export function playHref(trackId: string, trackType: string, locale: Locale): string {
  if (trackType === "youtube" && trackId.startsWith("youtube-")) {
    return localePath(locale, `/play/youtube/${trackId.slice("youtube-".length)}`);
  }
  return localePath(locale, "/play");
}

/** A compact label for a run's mode, e.g. `hard · instant · 1.25×`. */
export function modeLabel(
  input: {
    style: string;
    difficulty: string;
    runMode: string;
    speed: number;
  },
  t: Translate,
): string {
  const parts = [styleLabel(input.style, t), difficultyLabel(input.difficulty, t)];
  if (input.runMode !== "normal") parts.push(runModeLabel(input.runMode, t));
  if (input.speed !== 1) parts.push(speedLabel(input.speed, t));
  return parts.join(" · ");
}
