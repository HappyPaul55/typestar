/**
 * Locale-aware internal links.
 *
 * The default locale lives at the root; every other locale is prefixed, so an
 * internal link must be built for the page's locale rather than hardcoded.
 */

import { DEFAULT_LOCALE, isLocale, type Locale } from "./locales";

/**
 * Prefix an app path with the locale. The default locale stays unprefixed, so
 * `localePath("en", "/play")` is `/play` and `localePath("de", "/play")` is
 * `/de/play`. The root is special: `/` becomes `/de`, not `/de/`.
 */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/**
 * Split a pathname into its leading locale (if any) and the rest. Handles the
 * build-time `.html` suffix. `/de/play/youtube/x` → `{ locale: "de", path:
 * "/play/youtube/x" }`; `/play` → `{ locale: null, path: "/play" }`.
 */
export function splitLocale(pathname: string): { locale: Locale | null; path: string } {
  const clean = pathname.replace(/\.html$/, "");
  const parts = clean.split("/").filter(Boolean);
  if (parts.length > 0 && isLocale(parts[0])) {
    return { locale: parts[0], path: `/${parts.slice(1).join("/")}` };
  }
  return { locale: null, path: clean || "/" };
}

/** The pathname without a leading locale segment. */
export function stripLocale(pathname: string): string {
  return splitLocale(pathname).path;
}
