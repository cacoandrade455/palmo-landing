"use client";

import Link from "next/link";
import { ArrowRight, Info, MapPin, Sprout, DropletOff, Star } from "lucide-react";
import { APP_ENABLED } from "@/lib/feature-flags";
import { useLanguage, type AppLang } from "@/lib/language-context";
import { formatBRL } from "@/lib/appraisal-data";
import type { RecommendResult, Recommendation } from "@/lib/land-recommender";

/**
 * Presentational RANKING of the land-use recommender — the cards that used to
 * live on the standalone /recomendar page, now embedded inside the calculator's
 * discovery mode (components/Appraiser.tsx). It is pure UI over a precomputed
 * `RecommendResult`: it never re-ranks or invents anything.
 *
 * The order is decided upstream by `recommendUses` (highest revenue ceiling
 * first). The regional vocation no longer moves a card — it surfaces here as a
 * discreet "Forte na sua região" badge (rule 5 inline strings; data-layer copy
 * is PT/EN only, so the extra languages reuse the EN variant).
 *
 * `onCalcSelect` bridges a card back to the SAME tool's calculation mode,
 * pre-filled — no page navigation, so the calculator keeps its state.
 */
type Chrome = {
  resultTitle: string;
  withWater: string;
  withoutWater: string;
  rankSuffix: string;
  incomeLabel: string;
  regionPrefix: string;
  sourcePrefix: string;
  calcCta: string;
  listCta: string;
  regionalBadge: string;
  weakTitle: string;
  weakBody: string;
  weakBodyGeneric: string;
  weakKnownLabel: string;
  demotedTag: string;
  noIncome: string;
  disclaimer: string;
};

const PT: Chrome = {
  resultTitle: "Vocações da sua região, do maior retorno ao menor",
  withWater: "com fonte de água",
  withoutWater: "sem fonte de água",
  rankSuffix: "º",
  incomeLabel: "Renda de arrendamento estimada",
  regionPrefix: "Sua região:",
  sourcePrefix: "Base:",
  calcCta: "Calcular o valor exato",
  listCta: "Anunciar minha terra",
  regionalBadge: "Forte na sua região",
  weakTitle: "Ainda não temos uma vocação regional registrada por aqui",
  weakBody:
    "A vocação mais registrada da sua região é {use}. Para outras culturas, vale conversar com um agrônomo.",
  weakBodyGeneric:
    "Não temos uma vocação regional registrada para a sua região nas nossas fontes oficiais. Vale conversar com um agrônomo local antes de decidir.",
  weakKnownLabel: "Usos com faixa de mercado levantada na sua região:",
  demotedTag: "requer água",
  noIncome:
    "Sem faixa de renda de referência para esta cultura na sua região — a Palmo pode ajudar a levantar.",
  disclaimer:
    "Não é avaliação agronômica: nada de solo, pH ou microclima. Ranqueamos apenas a vocação registrada da sua região (fontes oficiais) — não prometemos produtividade nem sucesso.",
};

const EN: Chrome = {
  resultTitle: "Your region's vocations, highest return first",
  withWater: "with a water source",
  withoutWater: "no water source",
  rankSuffix: "",
  incomeLabel: "Estimated lease income",
  regionPrefix: "Your region:",
  sourcePrefix: "Basis:",
  calcCta: "Calculate the exact value",
  listCta: "List my land",
  regionalBadge: "Strong in your region",
  weakTitle: "We don't have a registered regional vocation here yet",
  weakBody:
    "The most registered use in your region is {use}. For other crops, it's worth talking to an agronomist.",
  weakBodyGeneric:
    "We don't have a registered regional vocation for your region in our official sources. It's worth talking to a local agronomist before deciding.",
  weakKnownLabel: "Uses with a surveyed market range in your region:",
  demotedTag: "needs water",
  noIncome:
    "No reference income range for this crop in your region — Palmo can help survey it.",
  disclaimer:
    "Not an agronomic appraisal: no soil, pH or micro-climate. We rank only your region's registered vocation (official sources) — we don't promise yield or success.",
};

const CHROME: Record<AppLang, Chrome> = { pt: PT, en: EN, zh: EN, fr: EN, ar: EN };

export function RecommenderRanking({
  result,
  onCalcSelect,
}: {
  result: RecommendResult & { hectares?: number; water: boolean };
  onCalcSelect: (rec: Recommendation) => void;
}) {
  const { t, lang } = useLanguage();
  const c = CHROME[lang];
  const dataLang: "pt" | "en" = lang === "pt" ? "pt" : "en";
  const a = t.appraiser;

  // Crop/purpose label in the CURRENT language (all five), reusing the
  // calculator's own dictionaries — we never translate a crop name ourselves.
  function labelOf(rec: Recommendation): string {
    if (rec.cropValue) {
      const hit = a.crops[rec.purpose]?.find((x) => x.value === rec.cropValue);
      if (hit) return hit.label;
    }
    return (
      t.waitlist.purposeOptions.find((o) => o.value === rec.purpose)?.label ??
      (dataLang === "en" ? rec.cropLabelEn : rec.cropLabelPt)
    );
  }
  function purposeLabelOf(purpose: string): string {
    return (
      t.waitlist.purposeOptions.find((o) => o.value === purpose)?.label ?? purpose
    );
  }

  function buildParams(rec: Recommendation) {
    const p = new URLSearchParams({ uf: result.uf, purpose: rec.purpose });
    if (result.municipality) p.set("municipality", result.municipality);
    if (rec.cropValue) p.set("crop", rec.cropValue);
    if (result.hectares) p.set("hectares", String(result.hectares));
    return p.toString();
  }

  if (result.weakSignal) {
    return (
      <div className="rounded-2xl bg-neutral p-6 sm:p-8">
        <h2 className="text-lg font-extrabold text-deep">{c.weakTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-deep/70">
          {(() => {
            // Name a real vocation, not a selective market (solar/carbon).
            const headline =
              result.known.find((k) => !k.selective) ?? result.known[0];
            if (!headline) return c.weakBodyGeneric;
            return c.weakBody.replace(
              "{use}",
              dataLang === "en" ? headline.labelEn : headline.labelPt,
            );
          })()}
        </p>
        {result.known.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-deep/60">
              {c.weakKnownLabel}
            </h3>
            <ul className="mt-3 space-y-2">
              {result.known.map((k) => (
                <li
                  key={k.purpose}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/75"
                >
                  <span>
                    {dataLang === "en" ? k.labelEn : k.labelPt}
                    {k.selective && (
                      <span className="mt-0.5 block text-xs font-normal text-deep/50">
                        {a.selectiveTag}
                      </span>
                    )}
                  </span>
                  <span className="whitespace-nowrap font-semibold">
                    {formatBRL(k.incomeMinPerHa)}–{formatBRL(k.incomeMaxPerHa)}
                    <span className="ml-1 text-xs font-normal text-deep/50">
                      {a.compareUnit}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-5 flex gap-2 text-xs leading-relaxed text-deep/55">
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{c.disclaimer}</span>
        </p>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-sm font-bold uppercase tracking-wide text-primary">
        {c.resultTitle}
      </h2>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-deep/60">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
        {result.municipality ? `${result.municipality}, ` : ""}
        {result.uf} · {result.water ? c.withWater : c.withoutWater}
      </p>

      <ul className="mt-5 space-y-4">
        {result.recommendations.map((rec) => {
          const listHref = `/app/anunciar?${buildParams(rec)}`;
          const hasIncome =
            rec.incomeMinPerHa != null && rec.incomeMaxPerHa != null;
          const warn =
            dataLang === "en" ? rec.waterWarningEn : rec.waterWarningPt;
          return (
            <li
              key={`${rec.purpose}:${rec.cropValue}`}
              className={`rounded-2xl border border-deep/10 bg-white p-6 shadow-sm ${
                rec.demoted ? "opacity-80" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-extrabold ${
                    rec.demoted
                      ? "bg-neutral text-deep/50"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {rec.rank}
                  {c.rankSuffix}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-extrabold text-deep">
                      {labelOf(rec)}
                    </h3>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      {purposeLabelOf(rec.purpose)}
                    </span>
                    {rec.regionalStrong && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                        <Star
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                          fill="currentColor"
                        />
                        {c.regionalBadge}
                      </span>
                    )}
                    {rec.demoted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-bold text-deep">
                        <DropletOff className="h-3.5 w-3.5" aria-hidden="true" />
                        {c.demotedTag}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 flex items-start gap-1.5 text-sm text-deep/70">
                    <Sprout
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>
                      {dataLang === "en" ? rec.scoreReasonEn : rec.scoreReasonPt}
                    </span>
                  </p>

                  <p className="mt-2 rounded-xl bg-neutral px-4 py-2.5 text-sm text-deep/70">
                    <span className="font-bold text-deep">{c.regionPrefix}</span>{" "}
                    {dataLang === "en" ? rec.regionalFactEn : rec.regionalFactPt}
                  </p>

                  {hasIncome ? (
                    <div className="mt-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-deep/50">
                        {c.incomeLabel}
                      </p>
                      <p className="mt-1 text-2xl font-extrabold text-deep">
                        {formatBRL(rec.incomeMinPerHa!)} –{" "}
                        {formatBRL(rec.incomeMaxPerHa!)}
                        <span className="ml-1.5 text-sm font-bold text-deep/50">
                          {a.perHaYear}
                        </span>
                      </p>
                      {result.hectares != null && (
                        <p className="mt-0.5 text-sm font-semibold text-deep/60">
                          {a.totalForArea}{" "}
                          {formatBRL(rec.incomeMinPerHa! * result.hectares)} –{" "}
                          {formatBRL(rec.incomeMaxPerHa! * result.hectares)}
                        </p>
                      )}
                      {rec.sourceNote && (
                        <p className="mt-1 text-xs leading-relaxed text-deep/55">
                          {c.sourcePrefix} {rec.sourceNote}
                        </p>
                      )}
                      {rec.incomeFallback && (
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-deep/50">
                          {a.nationalFallbackNote}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-xl bg-neutral px-4 py-2.5 text-sm text-deep/60">
                      {c.noIncome}
                    </p>
                  )}

                  {rec.demoted && warn && (
                    <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
                      <DropletOff
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{warn}</span>
                    </p>
                  )}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => onCalcSelect(rec)}
                      className="group flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark"
                    >
                      {c.calcCta}
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </button>
                    {APP_ENABLED && (
                      <Link
                        href={listHref}
                        className="flex items-center justify-center gap-2 rounded-full border border-deep/20 px-5 py-2.5 text-sm font-bold text-deep transition-colors hover:border-deep/40"
                      >
                        {c.listCta}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 flex gap-2 text-xs leading-relaxed text-deep/55">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{c.disclaimer}</span>
      </p>
    </>
  );
}
