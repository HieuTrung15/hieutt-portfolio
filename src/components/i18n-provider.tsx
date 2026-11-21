"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

import { DEFAULT_LOCALE, dictionaries, LOCALE_INFO, type Locale } from "@/lib/i18n";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  // Keeps <html lang> right after client-side navigation between languages.
  useEffect(() => {
    document.documentElement.lang = LOCALE_INFO[locale].htmlLang;
  }, [locale]);
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export const useLocale = () => useContext(LocaleContext);
export const useT = () => dictionaries[useLocale()];
