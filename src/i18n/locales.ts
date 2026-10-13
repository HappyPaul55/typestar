/**
 * The supported UI locales.
 *
 * `en` is the default and is served without a path prefix; the rest live under
 * `/<locale>/…`. The lyrics/caption language (`?lang=` on the track API) is a
 * separate concern and is not part of this list.
 */

export const LOCALES = ["en", "de", "fr", "es", "pt-BR", "ja"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** The endonym shown in the language switcher. */
export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  "pt-BR": "Português",
  ja: "日本語",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** The locales other than the default, for the `[locale]` routes. */
export function nonDefaultLocales(): Locale[] {
  return LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);
}

/** The `<html lang>` value (and `hreflang`) for a locale. */
export const HTML_LANG: Record<Locale, string> = {
  en: "en-GB",
  de: "de",
  fr: "fr",
  es: "es",
  "pt-BR": "pt-BR",
  ja: "ja",
};

/** The `og:locale` value for a locale. */
export const OG_LOCALE: Record<Locale, string> = {
  en: "en_GB",
  de: "de_DE",
  fr: "fr_FR",
  es: "es_ES",
  "pt-BR": "pt_BR",
  ja: "ja_JP",
};
