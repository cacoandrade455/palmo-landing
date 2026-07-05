"use client";

import { Check } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export function PricingBanner() {
  const { t } = useLanguage();

  return (
    <section id="precos" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            {t.pricing.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-deep sm:text-4xl">
            {t.pricing.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-deep/70">
            {t.pricing.subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {t.pricing.tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-2xl p-6 shadow-sm ${
                tier.highlight
                  ? "bg-primary text-white ring-2 ring-primary"
                  : "border border-deep/10 bg-white text-deep"
              }`}
            >
              <h3
                className={`text-sm font-bold uppercase tracking-wide ${
                  tier.highlight ? "text-white/80" : "text-deep/50"
                }`}
              >
                {tier.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">{tier.price}</span>
                {tier.priceNote && (
                  <span
                    className={`text-sm font-semibold ${
                      tier.highlight ? "text-white/70" : "text-deep/50"
                    }`}
                  >
                    {tier.priceNote}
                  </span>
                )}
              </div>
              <p
                className={`mt-4 text-sm leading-relaxed ${
                  tier.highlight ? "text-white/85" : "text-deep/60"
                }`}
              >
                {tier.desc}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm font-semibold text-primary">
          <Check className="h-4 w-4" aria-hidden="true" />
          {t.pricing.footnote}
        </p>
      </div>
    </section>
  );
}
