"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { content, type Content, type Lang } from "./content";
import { contentExtra, type ExtraLang } from "./content-extra";

const STORAGE_KEY = "palmo-lang";

/**
 * Idiomas da superfície pública. `Lang` (pt/en) vive em `content.ts` e não
 * pode ser editado; os idiomas adicionais chegam por `content-extra.ts`, cujos
 * dicionários são tipados como `typeof content.pt` — o compilador prova a
 * completude de cada tradução.
 */
export type AppLang = Lang | ExtraLang;

export const APP_LANGS: { code: AppLang; label: string; name: string }[] = [
  { code: "pt", label: "PT", name: "Português" },
  { code: "en", label: "EN", name: "English" },
  { code: "zh", label: "中文", name: "中文（简体）" },
  { code: "fr", label: "FR", name: "Français" },
  { code: "ar", label: "AR", name: "العربية" },
];

function isAppLang(value: string | null): value is AppLang {
  return APP_LANGS.some((l) => l.code === value);
}

function isBaseLang(lang: AppLang): lang is Lang {
  return lang === "pt" || lang === "en";
}

/** Resolução: content[lang] quando existe, senão contentExtra[lang]. */
function resolveContent(lang: AppLang): Content {
  return isBaseLang(lang) ? content[lang] : contentExtra[lang];
}

type LanguageContextValue = {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  toggle: () => void;
  dir: "ltr" | "rtl";
  t: Content;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLang(): AppLang {
  if (typeof window === "undefined") return "pt";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isAppLang(stored) ? stored : "pt";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Lazy initializer reads the persisted preference on first client render,
  // avoiding a setState-in-effect (which would cause a visible flash + an
  // extra render pass).
  const [lang, setLangState] = useState<AppLang>(readStoredLang);

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  // Keep <html lang="..." dir="..."> in sync for accessibility/SEO and RTL.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (next: AppLang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggle: () => {
        const i = APP_LANGS.findIndex((l) => l.code === lang);
        setLang(APP_LANGS[(i + 1) % APP_LANGS.length].code);
      },
      dir,
      t: resolveContent(lang),
    }),
    [lang, dir],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
