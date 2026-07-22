"use client";

import { Compass } from "lucide-react";
import { useLanguage, type AppLang } from "@/lib/language-context";
import type { RegiaoRetrato } from "@/lib/regioes-agricolas";

/**
 * Retrato estratégico regional — o "consultor" que abre o resultado do modo
 * "Não sei / me recomende", logo ACIMA do ranking de usos.
 *
 * É 100% apresentacional: nome, texto e fonte vêm PRONTOS da camada de dados
 * (`lib/regioes-agricolas.ts`, somente leitura). Nada aqui reescreve, traduz
 * ou calcula número — só escolhe entre `retratoPt` e `retratoEn`, que o dado
 * já traz. Sem retrato resolvido, o componente nem é renderizado (o chamador
 * mostra só o ranking, como antes).
 */
type Copy = { eyebrow: string; sourcePrefix: string };

const PT: Copy = { eyebrow: "Retrato da sua região", sourcePrefix: "Fonte:" };
const EN: Copy = { eyebrow: "Your region at a glance", sourcePrefix: "Source:" };

// Copy da camada de dados é PT/EN apenas: os demais idiomas reusam o EN,
// mesma política que o resto da calculadora já segue.
const COPY: Record<AppLang, Copy> = { pt: PT, en: EN, zh: EN, fr: EN, ar: EN };

export function RegionalPortrait({
  retrato,
}: {
  retrato?: RegiaoRetrato | null;
}) {
  const { lang } = useLanguage();
  const c = COPY[lang] ?? EN;
  // O retrato é EXTRA: qualquer dado ausente some da tela em silêncio, nunca
  // derruba a calculadora. Sem nome ou sem texto não há retrato para mostrar.
  const texto =
    (lang === "pt" ? retrato?.retratoPt : retrato?.retratoEn) ??
    retrato?.retratoPt ??
    retrato?.retratoEn;
  if (!retrato?.nome || !texto) return null;

  return (
    <div className="rounded-2xl bg-neutral p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
          <Compass className="h-5 w-5 text-primary" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            {c.eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-extrabold text-deep">
            {retrato.nome}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-deep/70">{texto}</p>
          {retrato.fonte && (
            <p className="mt-3 text-xs leading-relaxed text-deep/50">
              {c.sourcePrefix} {retrato.fonte}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
