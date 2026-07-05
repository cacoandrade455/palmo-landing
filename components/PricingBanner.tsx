"use client";

import { useLanguage } from "@/lib/language-context";

export function PricingBanner() {
  const { t } = useLanguage();

  return (
    <section id="precos" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="rounded-2xl bg-neutral px-8 py-12 text-center shadow-sm sm:px-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-deep sm:text-4xl">
            {t.pricing.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-deep/70">
            {t.pricing.body}
          </p>
        </div>
      </div>
    </section>
  );
}
