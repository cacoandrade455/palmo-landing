"use client";

import { BarChart3, Info, LineChart, Lock, Sprout, Wheat } from "lucide-react";
import { useLanguage, type AppLang } from "@/lib/language-context";

/**
 * "De onde vêm os números": extensão do bloco de confiança na home pública.
 * Nomeia as quatro fontes públicas da calculadora (IBGE, CEPEA, CONAB e
 * Embrapa), repete o caveat honesto do produto e a promessa de privacidade
 * do contato. Fundo bg-neutral SEM padding-top: cola no TrustStrip acima e
 * lê como continuação do mesmo bloco, antes do PricingBanner (bg-white).
 * Strings inline (regra 5); zh/fr/ar replicam EN — TODO(i18n) no PR.
 */
type SourceCopy = {
  name: string;
  desc: string;
};

type Copy = {
  eyebrow: string;
  title: string;
  lead: string;
  sources: SourceCopy[];
  caveat: string;
  privacy: string;
};

const PT: Copy = {
  eyebrow: "Transparência",
  title: "De onde vêm os números",
  lead: "A calculadora não inventa valores. Cada número que você vê carrega a fonte e o ano de referência.",
  sources: [
    {
      name: "IBGE",
      desc: "Estatísticas oficiais de produção agrícola e uso da terra em cada município.",
    },
    {
      name: "CEPEA",
      desc: "Indicadores de preços agropecuários que acompanham o mercado.",
    },
    {
      name: "CONAB",
      desc: "Acompanhamento oficial de safras e custos de produção.",
    },
    {
      name: "Embrapa",
      desc: "Pesquisa agropecuária e referências técnicas de cultivo para cada região.",
    },
  ],
  caveat:
    "Os valores refletem a vocação registrada da sua região e servem como referência, não como avaliação formal. A decisão final é sempre do proprietário, com o apoio do agrônomo dele.",
  privacy:
    "Seu contato nunca aparece publicamente: ele só é revelado quando o negócio fecha dentro da plataforma.",
};

const EN: Copy = {
  eyebrow: "Transparency",
  title: "Where the numbers come from",
  lead: "The calculator does not make up values. Every number you see carries its source and reference year.",
  sources: [
    {
      name: "IBGE",
      desc: "Official statistics on agricultural production and land use in each municipality.",
    },
    {
      name: "CEPEA",
      desc: "Agricultural price indicators that track the market.",
    },
    {
      name: "CONAB",
      desc: "Official monitoring of harvests and production costs.",
    },
    {
      name: "Embrapa",
      desc: "Agricultural research and technical crop references for each region.",
    },
  ],
  caveat:
    "The values reflect your region's registered vocation and serve as a reference, not a formal appraisal. The final decision always belongs to the owner, with the support of their agronomist.",
  privacy:
    "Your contact never appears publicly: it is only revealed when the deal closes inside the platform.",
};

const COPY: Record<AppLang, Copy> = {
  pt: PT,
  en: EN,
  zh: EN,
  fr: EN,
  ar: EN,
};

const sourceIcons = [BarChart3, LineChart, Wheat, Sprout];

export function NumbersOrigin() {
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <section id="fontes" className="bg-neutral pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-sm font-bold uppercase tracking-wide text-primary">
          {c.eyebrow}
        </p>
        <h2 className="mt-2 max-w-xl text-3xl font-extrabold tracking-tight text-deep sm:text-4xl">
          {c.title}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-deep/70">
          {c.lead}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.sources.map((source, i) => {
            const Icon = sourceIcons[i];
            return (
              <div
                key={source.name}
                className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm"
              >
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="mt-3 text-base font-extrabold text-deep">
                  {source.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-deep/60">
                  {source.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <p className="flex items-start gap-2 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>{c.caveat}</span>
          </p>
          <p className="flex items-start gap-2 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
            <Lock
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>{c.privacy}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
