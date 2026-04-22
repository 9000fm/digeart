"use client";

import { createContext, useContext, useState, useCallback, useSyncExternalStore, type ReactNode } from "react";
import { translations, LOCALES, type Locale } from "@/lib/i18n";

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

// Subscribe to localStorage changes (cross-tab sync)
function subscribeToStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function getStoredLocale(): Locale {
  const saved = localStorage.getItem("digeart-lang");
  if (saved && LOCALES.includes(saved as Locale)) return saved as Locale;
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("ja")) return "ja";
  if (lang.startsWith("ru")) return "ru";
  return "en";
}

export default function LanguageProvider({ children, serverLocale = "en" }: { children: ReactNode; serverLocale?: Locale }) {
  // Server snapshot comes from Accept-Language header (set in layout), client reads localStorage first
  const initialLocale = useSyncExternalStore(subscribeToStorage, getStoredLocale, () => serverLocale);
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

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
