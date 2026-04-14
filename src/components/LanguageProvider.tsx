"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { translations, type Locale } from "@/lib/i18n";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function useTranslation() {
  return useContext(LanguageContext);
}

function getDefaultLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("digeart-lang");
  if (saved === "es" || saved === "en") return saved;
  return navigator.language.startsWith("es") ? "es" : "en";
}

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getDefaultLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("digeart-lang", newLocale);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => {
      let value = translations[locale]?.[key] ?? translations.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          value = value.replace(`{${k}}`, v);
        }
      }
      return value;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
