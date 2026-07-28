"use client";

import { FileCheck2, Satellite, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const icons = [ShieldCheck, FileCheck2, Satellite];

export function TrustStrip() {
  const { t, lang } = useLanguage();
  // C4: o pilar de satélite ainda não opera — selo "Em breve" (inline, regra 5).
  const soonLabel = lang === "pt" ? "Em breve" : "Coming soon";

  return (
    <section id="confianca" className="bg-neutral py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-sm font-bold uppercase tracking-wide text-primary">
          {t.trust.eyebrow}
        </p>
        <h2 className="mt-2 max-w-xl text-3xl font-extrabold tracking-tight text-deep sm:text-4xl">
          {t.trust.title}
        </h2>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {t.trust.badges.map((badge, i) => {
            const Icon = icons[i];
            return (
              <div key={badge.title}>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 flex flex-wrap items-center gap-2 text-lg font-extrabold text-deep">
                  {badge.title}
                  {badge.soon && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      {soonLabel}
                    </span>
                  )}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-deep/60">
                  {badge.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
