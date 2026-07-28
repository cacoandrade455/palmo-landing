"use client";

import { useLanguage, type AppLang } from "@/lib/language-context";
import { Appraiser } from "./Appraiser";

/**
 * Herói da home: a calculadora É a porta de entrada. H1 + apoio + assinatura
 * do slogan, e o MESMO componente Appraiser de /quanto-vale embutido logo
 * abaixo (variant="hero" só esconde o cabeçalho duplicado — zero fork).
 * Strings inline (regra 5); zh/fr/ar replicam EN — TODO(i18n) no PR.
 */
type HeroCopy = {
  title: string;
  support: string;
  slogan: string;
};

const HERO_PT: HeroCopy = {
  title: "Quanto vale a sua terra?",
  support: "Sua terra já tem vocação. Você só não foi apresentado a ela.",
  slogan: "Cada Palmo de terra produzindo.",
};

const HERO_EN: HeroCopy = {
  title: "How much is your land worth?",
  support: "Your land already has a calling. You just haven't been introduced to it.",
  slogan: "Every Palmo of land producing.",
};

const HERO: Record<AppLang, HeroCopy> = {
  pt: HERO_PT,
  en: HERO_EN,
  zh: HERO_EN,
  fr: HERO_EN,
  ar: HERO_EN,
};

export function HomeHero() {
  const { lang } = useLanguage();
  const h = HERO[lang];

  return (
    <section id="top" className="bg-white">
      <div className="mx-auto max-w-2xl px-6 pt-12 text-center sm:pt-16">
        <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-deep sm:text-5xl">
          {h.title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-deep/70">
          {h.support}
        </p>
        {/* Assinatura discreta do slogan — não é um segundo título. */}
        <p className="mt-3 text-sm font-bold text-primary">{h.slogan}</p>
      </div>
      <Appraiser variant="hero" />
    </section>
  );
}
