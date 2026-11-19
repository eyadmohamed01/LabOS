"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { formatDate as formatWorkspaceDate } from "../../lib/dashboard";
import {
  translate,
  translateLabel,
  type Locale,
  type MessageValues,
  type TranslationKey,
} from "../../lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, values?: MessageValues) => string;
  text: (value: string) => string;
  formatDate: (date: string, options?: Intl.DateTimeFormatOptions) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const t = useCallback(
    (key: TranslationKey, values?: MessageValues) =>
      translate(locale, key, values),
    [locale],
  );
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      text: (label) => translateLabel(locale, label),
      formatDate: (date, options) => formatWorkspaceDate(date, options, locale),
    }),
    [locale, t],
  );
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context)
    throw new Error("Dashboard components must be inside LocaleProvider.");
  return context;
}
