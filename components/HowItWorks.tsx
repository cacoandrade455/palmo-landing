"use client";

import { useLanguage } from "@/lib/language-context";

export function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section id="como-funciona" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-sm font-bold uppercase tracking-wide text-primary">
          {t.how.eyebrow}
        </p>
        <h2 className="mt-2 max-w-xl text-3xl font-extrabold tracking-tight text-deep sm:text-4xl">
          {t.how.title}
        </h2>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {t.how.steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl border border-deep/5 bg-white p-6 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-extrabold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-extrabold text-deep">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-deep/60">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
