"use client";

import Link from "next/link";
import { Scale } from "lucide-react";
import { useLanguage, type AppLang } from "@/lib/language-context";
import {
  LEGAL_EFFECTIVE,
  LEGAL_VERSION,
  legalDocFor,
  type LegalBlock,
  type LegalSection,
} from "@/lib/legal";
import { termsEn, termsPt } from "@/lib/legal-terms";
import { privacyEn, privacyPt } from "@/lib/legal-privacy";

/**
 * Renderizador dos documentos legais (/termos e /privacidade).
 *
 * Idiomas: PT é a versão canônica; qualquer outro idioma da interface cai na
 * versão EN com a nota de tradução de cortesia — inclusive zh/fr/ar, que não
 * têm tradução própria (TODO(i18n) registrado no PR).
 */

const DOCS = {
  terms: { pt: termsPt, en: termsEn },
  privacy: { pt: privacyPt, en: privacyEn },
};

type Chrome = {
  banner: string;
  version: (v: string, date: string) => string;
  courtesy: string;
  index: string;
  otherLabel: string;
  backToTop: string;
};

const CHROME_PT: Chrome = {
  banner: "Documento em vigor, sujeito a revisão jurídica.",
  version: (v, date) => `Versão ${v} · vigente desde ${date}`,
  courtesy:
    "Esta é uma tradução de cortesia. A versão em português é a única vinculante; em caso de divergência, prevalece o texto em português.",
  index: "Nesta página",
  otherLabel: "Ler também",
  backToTop: "Voltar ao topo",
};

const CHROME_EN: Chrome = {
  banner: "Document in force, subject to legal review.",
  version: (v, date) => `Version ${v} · in force since ${date}`,
  courtesy:
    "This is a courtesy translation. The Portuguese version is the only binding one; in case of divergence, the Portuguese text prevails.",
  index: "On this page",
  otherLabel: "Read also",
  backToTop: "Back to top",
};

const CHROME: Record<AppLang, Chrome> = {
  pt: CHROME_PT,
  en: CHROME_EN,
  zh: CHROME_EN,
  fr: CHROME_EN,
  ar: CHROME_EN,
};

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "p":
      return (
        <p className="mt-3 leading-relaxed text-deep/70">{block.text}</p>
      );
    case "list":
      return (
        <ul className="mt-3 space-y-2">
          {block.items.map((item) => (
            <li
              key={item}
              className="flex gap-2.5 leading-relaxed text-deep/70"
            >
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "clause":
      // Cláusula com destaque próprio — é o coração do modelo (gate de
      // contato, não circunvenção e cláusula penal).
      return (
        <div className="mt-4 rounded-xl bg-neutral p-4">
          <p className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              {block.ref}
            </span>
            <span className="font-extrabold text-deep">{block.title}</span>
          </p>
          <p className="mt-2 leading-relaxed text-deep/80">{block.text}</p>
        </div>
      );
    case "note":
      return (
        <p className="mt-4 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
          {block.text}
        </p>
      );
  }
}

function Section({ index, section }: { index: number; section: LegalSection }) {
  return (
    <section id={section.id} className="scroll-mt-24 border-t border-deep/10 pt-6">
      <h2 className="text-lg font-extrabold text-deep">
        <span className="text-primary">{index + 1}.</span> {section.title}
      </h2>
      {section.blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </section>
  );
}

export function LegalDoc({ which }: { which: "terms" | "privacy" }) {
  const { lang } = useLanguage();
  const c = CHROME[lang];
  const { content, courtesy } = legalDocFor(lang, DOCS[which]);
  const effective = lang === "pt" ? LEGAL_EFFECTIVE.pt : LEGAL_EFFECTIVE.en;

  const other =
    which === "terms"
      ? { href: "/privacidade", label: lang === "pt" ? "Política de Privacidade" : "Privacy Policy" }
      : { href: "/termos", label: lang === "pt" ? "Termos de Uso" : "Terms of Use" };

  return (
    <article>
      {/* banner permanente, no mesmo espírito do banner da Sala do Contrato */}
      <p className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70 shadow-sm">
        <Scale className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        {c.banner}
      </p>

      <div className="mt-4 rounded-2xl border border-deep/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-deep">
          {content.title}
        </h1>
        <p className="mt-2 text-sm font-semibold text-deep/50">
          {c.version(LEGAL_VERSION, effective)}
        </p>

        {courtesy && (
          <p className="mt-4 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
            {c.courtesy}
          </p>
        )}

        <p className="mt-4 leading-relaxed text-deep/70">{content.intro}</p>

        {/* índice */}
        <nav className="mt-6 rounded-xl bg-neutral p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            {c.index}
          </p>
          <ol className="mt-2 space-y-1">
            {content.sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-deep/70 transition-colors hover:text-primary"
                >
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-8 space-y-8">
          {content.sections.map((s, i) => (
            <Section key={s.id} index={i} section={s} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-deep/10 pt-6">
          <p className="text-sm text-deep/60">
            {c.otherLabel}:{" "}
            <Link
              href={other.href}
              className="font-bold text-primary transition-colors hover:text-primary-dark"
            >
              {other.label}
            </Link>
          </p>
          <a
            href="#top"
            className="rounded-full border border-deep/20 px-3 py-1 text-xs font-bold text-deep transition-colors hover:border-primary"
          >
            {c.backToTop}
          </a>
        </div>
      </div>
    </article>
  );
}
