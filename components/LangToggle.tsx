"use client";

import { useLanguage } from "@/lib/language-context";

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-full border border-deep/10 bg-white p-0.5 text-sm font-semibold ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang("pt")}
        aria-pressed={lang === "pt"}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          lang === "pt" ? "bg-primary text-white" : "text-deep/60 hover:text-deep"
        }`}
      >
        PT
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          lang === "en" ? "bg-primary text-white" : "text-deep/60 hover:text-deep"
        }`}
      >
        EN
      </button>
    </div>
  );
}
