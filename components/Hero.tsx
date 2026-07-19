"use client";

import Link from "next/link";
import { ArrowRight, Calculator, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { PlotIcon } from "./PlotIcon";

export function Hero() {
  const { t } = useLanguage();

  return (
    <section id="top" className="relative overflow-hidden bg-white">
      {/* Subtle brand watermark — the idle-plot motif, used once, quietly */}
      <PlotIcon className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rotate-12 opacity-[0.05]" />

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-deep sm:text-5xl">
            {t.hero.title}
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-deep/70">
            {t.hero.subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#lista-de-espera"
              className="rounded-full bg-primary px-6 py-3.5 text-center text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              {t.hero.ctaHave}
            </a>
            <a
              href="#lista-de-espera"
              className="rounded-full bg-accent px-6 py-3.5 text-center text-base font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark"
            >
              {t.hero.ctaWant}
            </a>
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-primary">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {t.hero.trustLine}
          </p>

          {/* Calculator CTA — the strongest zero-commitment hook on the page,
              promoted from a small text link to a full card-button. */}
          <Link
            href="/quanto-vale"
            className="group mt-5 flex max-w-md items-center gap-4 rounded-2xl border-2 border-accent bg-accent/10 px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent/20 hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent">
              <Calculator className="h-5 w-5 text-deep" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-extrabold leading-snug text-deep sm:text-lg">
                {t.appraiser.heroLink}
              </span>
              <span className="mt-0.5 block text-sm leading-snug text-deep/60">
                {t.appraiser.heroLinkSub}
              </span>
            </span>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-deep transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="relative">
          <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-deep/5 bg-white shadow-xl">
            {/* Placeholder aerial photo area */}
            <div
              className="flex h-40 items-center justify-center bg-neutral text-center text-xs font-semibold uppercase tracking-wide text-deep/40"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, rgba(23,61,39,0.06) 0px, rgba(23,61,39,0.06) 2px, transparent 2px, transparent 14px)",
              }}
            >
              {t.hero.card.photoLabel}
            </div>

            <div className="space-y-2 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-deep">{t.hero.card.name}</h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  {t.hero.card.area}
                </span>
              </div>
              <p className="text-sm text-deep/60">{t.hero.card.location}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {t.hero.card.verified}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
