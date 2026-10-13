/**
 * The translation lookup.
 *
 * `en` is complete; every other locale is a partial overlay that falls back to
 * English key by key, so a half-finished translation still reads sensibly.
 */

import { en, type MessageKey } from "./ui/en";
import { de } from "./ui/de";
import { es } from "./ui/es";
import { fr } from "./ui/fr";
import { ja } from "./ui/ja";
import { ptBR } from "./ui/pt-BR";
import type { Locale } from "./locales";

export type { MessageKey } from "./ui/en";

type Overlay = Partial<Record<MessageKey, string>>;

/** Every locale's dictionary, English first as the fallback. */
const DICTIONARIES: Record<Locale, Overlay> = {
  en,
  de,
  fr,
  es,
  "pt-BR": ptBR,
  ja,
};

export type Translate = (
  key: MessageKey,
  vars?: Record<string, string | number>,
) => string;

/** Translate one key, filling `{name}` placeholders. */
export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const message = DICTIONARIES[locale]?.[key] ?? en[key] ?? key;
  if (!vars) return message;
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/** A `t` bound to a locale, for both Astro and React. */
export function translator(locale: Locale): Translate {
  return (key, vars) => translate(locale, key, vars);
}
