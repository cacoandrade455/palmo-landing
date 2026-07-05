"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/language-context";
import { LangToggle } from "./LangToggle";

export function Header() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-deep/5 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <a href="#top" className="flex items-center" aria-label="Palmo">
          <Image
            src="/palmo-logo.svg"
            alt="Palmo"
            width={140}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </a>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-deep/70 md:flex">
          <a href="#como-funciona" className="transition-colors hover:text-deep">
            {t.header.navHow}
          </a>
          <a href="#confianca" className="transition-colors hover:text-deep">
            {t.header.navTrust}
          </a>
          <a href="#precos" className="transition-colors hover:text-deep">
            {t.header.navPricing}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <LangToggle />
          <a
            href="#lista-de-espera"
            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            {t.header.cta}
          </a>
        </div>
      </div>
    </header>
  );
}
