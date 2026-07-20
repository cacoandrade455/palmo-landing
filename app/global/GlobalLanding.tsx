"use client";

import Link from "next/link";
import { Calculator, ShieldCheck, Landmark, ArrowRight } from "lucide-react";
import { GlobalTopBar, useGlobalLang } from "./GlobalChrome";

export function GlobalLanding() {
  const { lang, setLang, g, dir } = useGlobalLang();

  const bullets = [
    { icon: Calculator, title: g.bullet1Title, body: g.bullet1Body },
    { icon: ShieldCheck, title: g.bullet2Title, body: g.bullet2Body },
    { icon: Landmark, title: g.bullet3Title, body: g.bullet3Body },
  ];

  return (
    <div dir={dir} className="min-h-screen bg-neutral/40">
      <GlobalTopBar lang={lang} setLang={setLang} g={g} />

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Hero */}
        <section className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-bold text-deep">
            {g.earlyAccess}
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-deep sm:text-5xl">
            {g.heroTitle}
          </h1>
          <p className="mt-4 text-lg text-deep/70">{g.heroSub}</p>
          <Link
            href="/global/kyc"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            {g.ctaStart}
            <ArrowRight
              className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </Link>
        </section>

        {/* Three bullets */}
        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          {bullets.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-extrabold text-deep">{title}</h2>
              <p className="mt-2 text-sm text-deep/70">{body}</p>
            </div>
          ))}
        </section>

        {/* Honest disclaimers */}
        <section className="mx-auto mt-10 max-w-2xl space-y-3">
          <p className="rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
            {g.disclaimer}
          </p>
          <p className="rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70">
            {g.inboundOnly}
          </p>
        </section>
      </main>
    </div>
  );
}
