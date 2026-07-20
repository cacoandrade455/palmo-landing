"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GLOBAL_LANGS,
  GLOBAL_LANG_STORAGE_KEY,
  globalContent,
  isGlobalLang,
  isRtl,
  type GlobalDict,
  type GlobalLang,
} from "@/lib/i18n-global";

/**
 * Language state for the /global funnel — independent from the PT/EN
 * context of the main site (the audience here is foreign; English is the
 * default). Lazy initializer reads localStorage to avoid a
 * setState-in-effect flash, mirroring lib/language-context.tsx.
 */
function readStoredGlobalLang(): GlobalLang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(GLOBAL_LANG_STORAGE_KEY);
  return isGlobalLang(stored) ? stored : "en";
}

export function useGlobalLang(): {
  lang: GlobalLang;
  setLang: (l: GlobalLang) => void;
  g: GlobalDict;
  dir: "ltr" | "rtl";
} {
  const [lang, setLangState] = useState<GlobalLang>(readStoredGlobalLang);
  const setLang = (next: GlobalLang) => {
    setLangState(next);
    window.localStorage.setItem(GLOBAL_LANG_STORAGE_KEY, next);
  };
  return {
    lang,
    setLang,
    g: globalContent[lang],
    dir: isRtl(lang) ? "rtl" : "ltr",
  };
}

/** Top bar of the funnel: Palmo Global brand + 4-language selector. */
export function GlobalTopBar({
  lang,
  setLang,
  g,
}: {
  lang: GlobalLang;
  setLang: (l: GlobalLang) => void;
  g: GlobalDict;
}) {
  return (
    <header className="border-b border-deep/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/global" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-deep">
            Palmo
          </span>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            {g.brandTag}
          </span>
        </Link>
        <nav aria-label={g.langLabel} className="flex items-center gap-1.5">
          {GLOBAL_LANGS.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              aria-pressed={lang === code}
              className={
                lang === code
                  ? "rounded-full border border-transparent bg-primary px-3 py-1 text-xs font-bold text-white"
                  : "rounded-full border border-deep/20 px-3 py-1 text-xs font-bold text-deep transition-colors hover:border-primary hover:text-primary"
              }
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
