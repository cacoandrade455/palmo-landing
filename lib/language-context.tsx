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
import { contentExtra } from "./content-extra";
import { LANG_COOKIE, isAppLang, type AppLang } from "./lang";

const STORAGE_KEY = "palmo-lang";

/**
 * Idiomas da superfície pública. `Lang` (pt/en) vive em `content.ts` e não
 * pode ser editado; os idiomas adicionais chegam por `content-extra.ts`, cujos
 * dicionários são tipados como `typeof content.pt` — o compilador prova a
 * completude de cada tradução. O type `AppLang`, o nome do cookie e o type
 * guard moram em `lib/lang.ts` (módulo neutro, usável pelo servidor).
 */
export type { AppLang };

export const APP_LANGS: { code: AppLang; label: string; name: string }[] = [
  { code: "pt", label: "PT", name: "Português" },
  { code: "en", label: "EN", name: "English" },
  { code: "zh", label: "中文", name: "中文（简体）" },
  { code: "fr", label: "FR", name: "Français" },
  { code: "ar", label: "AR", name: "العربية" },
];

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

function writeLangCookie(lang: AppLang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}

function hasLangCookie(): boolean {
  return document.cookie
    .split("; ")
    .some((c) => c.startsWith(`${LANG_COOKIE}=`));
}

/**
 * O idioma agora chega do SERVIDOR (cookie `palmo-lang` lido em
 * `app/layout.tsx`), então o HTML do SSR já vem no idioma certo e a hidratação
 * não troca texto na tela — este era o "flash PT→EN" antigo, causado por um
 * estado inicial lido do localStorage só no cliente.
 */
export function LanguageProvider({
  children,
  initialLang = "pt",
}: {
  children: ReactNode;
  initialLang?: AppLang;
}) {
  // O estado inicial espelha exatamente o que o servidor renderizou.
  const [lang, setLangState] = useState<AppLang>(initialLang);

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  // Keep <html lang="..." dir="..."> in sync for accessibility/SEO and RTL.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (next: AppLang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    writeLangCookie(next);
  };

  // Migração one-time: visitantes antigos guardavam a preferência só no
  // localStorage. Sem cookie, promovemos o valor guardado a cookie — a partir
  // da PRÓXIMA navegação o servidor já renderiza no idioma certo. O setState
  // síncrono fica em queueMicrotask (padrão do projeto para a regra
  // react-hooks/set-state-in-effect).
  useEffect(() => {
    if (hasLangCookie()) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isAppLang(stored)) {
      writeLangCookie(stored);
      if (stored !== initialLang) {
        queueMicrotask(() => setLangState(stored));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roda uma vez
  }, []);

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
