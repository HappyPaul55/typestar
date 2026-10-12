import { createContext, useContext, useMemo, type ReactNode } from "react";
import { translate, type MessageKey, type Translate } from "./index";
import { DEFAULT_LOCALE, type Locale } from "./locales";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Provide the page's locale to the game island. */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** A `t` bound to the surrounding locale. */
export function useT(): Translate {
  const locale = useLocale();
  return useMemo(
    () => (key: MessageKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale],
  );
}
