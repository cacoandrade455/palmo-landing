"use client";

import Link from "next/link";
import { useLanguage, type AppLang } from "@/lib/language-context";

/**
 * CTA final da home: o slogan oficial como título (C8b) + os dois caminhos.
 * Strings inline (regra 5); zh/fr/ar replicam EN — TODO(i18n) no PR.
 */
type Copy = {
  slogan: string;
  support: string;
  ctaList: string;
  ctaBrowse: string;
};

const CTA_PT: Copy = {
  slogan: "Cada Palmo de terra produzindo.",
  support: "Grátis até fechar negócio, para os dois lados.",
  ctaList: "Anunciar minha terra",
  ctaBrowse: "Explorar terras",
};

const CTA_EN: Copy = {
  slogan: "Every Palmo of land producing.",
  support: "Free until the deal closes, for both sides.",
  ctaList: "List my land",
  ctaBrowse: "Explore land",
};

const CTA: Record<AppLang, Copy> = {
  pt: CTA_PT,
  en: CTA_EN,
  zh: CTA_EN,
  fr: CTA_EN,
  ar: CTA_EN,
};

export function FinalCta() {
  const { lang } = useLanguage();
  const c = CTA[lang];

  return (
    <section className="bg-primary py-20">
      <div className="mx-auto max-w-xl px-6 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {c.slogan}
        </h2>
        <p className="mt-3 text-base text-white/80">{c.support}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/app/anunciar"
            className="rounded-full bg-accent px-6 py-3.5 text-center text-base font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark"
          >
            {c.ctaList}
          </Link>
          <Link
            href="/explorar"
            className="rounded-full bg-white px-6 py-3.5 text-center text-base font-bold text-deep shadow-sm transition-opacity hover:opacity-90"
          >
            {c.ctaBrowse}
          </Link>
        </div>
      </div>
    </section>
  );
}
