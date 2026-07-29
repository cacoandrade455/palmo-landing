"use client";

import Image from "next/image";

import { useLanguage, type AppLang } from "@/lib/language-context";
import { Appraiser } from "./Appraiser";

/**
 * Herói da home: a calculadora É a porta de entrada. Ordem: logo, slogan,
 * H1 (pergunta) e apoio, com o MESMO componente Appraiser de /quanto-vale
 * embutido em seguida (variant="hero" só esconde o cabeçalho duplicado —
 * zero fork). O slogan é kicker: continua sendo <p>, nunca um segundo
 * título, para preservar a hierarquia semântica do H1. O logo aqui é
 * decorativo (aria-hidden): o logo acessível da marca já está no Header,
 * e repetir o alt faria o leitor de tela anunciar "Palmo" duas vezes.
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
      <div className="mx-auto max-w-2xl px-6 pt-10 text-center sm:pt-12">
        {/* Logo decorativo: o logo acessível já vive no Header. */}
        <Image
          src="/palmo-logo.svg"
          alt=""
          aria-hidden="true"
          width={114}
          height={40}
          className="mx-auto mb-5 h-9 w-auto sm:h-11"
          priority
        />
        {/* Slogan como kicker da marca: abre o herói, mas não é título. */}
        <p className="text-sm font-bold uppercase tracking-wide text-primary">
          {h.slogan}
        </p>
        <h1 className="mt-3 text-4xl font-extrabold leading-[1.1] tracking-tight text-deep sm:text-5xl">
          {h.title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-deep/70">
          {h.support}
        </p>
      </div>
      <Appraiser variant="hero" />
    </section>
  );
}
