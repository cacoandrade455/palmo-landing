"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Info,
  MapPin,
  Sprout,
  Droplets,
  DropletOff,
} from "lucide-react";
import { APP_ENABLED } from "@/lib/feature-flags";
import { useLanguage, type AppLang } from "@/lib/language-context";
import { UFS, formatBRL } from "@/lib/appraisal-data";
import {
  recommendUses,
  type RecommendResult,
  type Recommendation,
} from "@/lib/land-recommender";

/**
 * Recommender UI chrome, keyed by language. The heavy lifting (crop labels,
 * municipality list) reuses the calculator's own content dictionaries, which
 * cover all five languages; only these few wrapper strings live here (rule 5,
 * inline labels — never editing lib/content.ts). Data-layer copy (regional
 * facts, ranking reasons) is PT/EN only, exactly like the calculator, so the
 * extra languages reuse the EN variant.
 */
type Chrome = {
  eyebrow: string;
  title: string;
  subtitle: string;
  banner: string;
  waterLabel: string;
  waterYes: string;
  waterNo: string;
  hectaresOptional: string;
  submit: string;
  resultTitle: string;
  withWater: string;
  withoutWater: string;
  rankSuffix: string;
  incomeLabel: string;
  regionPrefix: string;
  sourcePrefix: string;
  calcCta: string;
  calcCtaSub: string;
  listCta: string;
  weakTitle: string;
  weakBody: string;
  weakBodyGeneric: string;
  weakKnownLabel: string;
  demotedTag: string;
  noIncome: string;
  disclaimer: string;
};

const PT: Chrome = {
  eyebrow: "Recomendador de uso da terra",
  title: "Descubra o melhor uso da sua terra",
  subtitle:
    "Diga onde fica a terra e nós ranqueamos as vocações que a sua região comprovadamente faz — antes de calcular quanto vale.",
  banner:
    "Sugestões baseadas na vocação registrada da região (fontes oficiais). A decisão final é sua e do seu agrônomo.",
  waterLabel: "Tem fonte de água para irrigar?",
  waterYes: "Sim",
  waterNo: "Não",
  hectaresOptional: "opcional",
  submit: "Ver recomendações",
  resultTitle: "Vocações da sua região, ranqueadas",
  withWater: "com fonte de água",
  withoutWater: "sem fonte de água",
  rankSuffix: "º",
  incomeLabel: "Renda de arrendamento estimada",
  regionPrefix: "Sua região:",
  sourcePrefix: "Base:",
  calcCta: "Calcular o valor exato",
  calcCtaSub: "Abre a calculadora já preenchida",
  listCta: "Anunciar minha terra",
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
  eyebrow: "Land-use recommender",
  title: "Discover the best use for your land",
  subtitle:
    "Tell us where the land is and we rank the vocations your region provably does — before calculating what it's worth.",
  banner:
    "Suggestions based on the region's registered vocation (official sources). The final decision is yours and your agronomist's.",
  waterLabel: "Do you have a water source to irrigate?",
  waterYes: "Yes",
  waterNo: "No",
  hectaresOptional: "optional",
  submit: "See recommendations",
  resultTitle: "Your region's vocations, ranked",
  withWater: "with a water source",
  withoutWater: "no water source",
  rankSuffix: "",
  incomeLabel: "Estimated lease income",
  regionPrefix: "Your region:",
  sourcePrefix: "Basis:",
  calcCta: "Calculate the exact value",
  calcCtaSub: "Opens the calculator pre-filled",
  listCta: "List my land",
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

export function LandRecommender() {
  const { t, lang } = useLanguage();
  const c = CHROME[lang];
  const dataLang: "pt" | "en" = lang === "pt" ? "pt" : "en";
  const a = t.appraiser;

  const [ufSel, setUfSel] = useState("");
  const [muniByUf, setMuniByUf] = useState<Record<string, string[] | "error">>({});
  const [water, setWater] = useState<"" | "yes" | "no">("");
  const [result, setResult] = useState<
    (RecommendResult & { hectares?: number; water: boolean }) | null
  >(null);

  useEffect(() => {
    if (!ufSel || muniByUf[ufSel]) return;
    let cancelled = false;
    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufSel}/municipios?orderBy=nome`,
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((list: { nome: string }[]) => {
        if (cancelled) return;
        setMuniByUf((prev) => ({ ...prev, [ufSel]: list.map((m) => m.nome) }));
      })
      .catch(() => {
        if (!cancelled) setMuniByUf((prev) => ({ ...prev, [ufSel]: "error" }));
      });
    return () => {
      cancelled = true;
    };
  }, [ufSel, muniByUf]);

  const muniEntry = ufSel ? muniByUf[ufSel] : undefined;
  const municipalities = Array.isArray(muniEntry) ? muniEntry : [];
  const muniFailed = muniEntry === "error";
  const muniLoading = !!ufSel && muniEntry === undefined;

  const inputCls =
    "mt-1.5 w-full rounded-xl border border-deep/15 bg-white px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const uf = String(fd.get("uf") ?? "");
    const municipality = String(fd.get("municipality") ?? "").trim();
    const hectaresRaw = Number(fd.get("hectares") ?? 0);
    const hectares =
      Number.isFinite(hectaresRaw) && hectaresRaw > 0 ? hectaresRaw : undefined;
    if (!uf || water === "") return;
    const hasWater = water === "yes";
    const res = recommendUses({ uf, municipality, water: hasWater, hectares });
    setResult({ ...res, hectares, water: hasWater });
  }

  // Resolve the crop/purpose label in the CURRENT language (all five), reusing
  // the calculator's own dictionaries — same rule: never translate a crop name
  // ourselves.
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

  function buildParams(rec: Recommendation, uf: string, muni: string, ha?: number) {
    const p = new URLSearchParams({ uf, purpose: rec.purpose });
    if (muni) p.set("municipality", muni);
    if (rec.cropValue) p.set("crop", rec.cropValue);
    if (ha) p.set("hectares", String(ha));
    return p.toString();
  }

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-2xl px-6">
        <p className="text-center text-sm font-bold uppercase tracking-wide text-primary">
          {c.eyebrow}
        </p>
        <h1 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-deep sm:text-4xl">
          {c.title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-base text-deep/70">
          {c.subtitle}
        </p>

        {/* Honesty banner */}
        <p className="mx-auto mt-6 flex max-w-md items-start gap-2 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{c.banner}</span>
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-2xl border border-deep/10 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rec-uf" className="text-sm font-semibold text-deep">
                {a.stateLabel}
              </label>
              <select
                id="rec-uf"
                name="uf"
                required
                value={ufSel}
                onChange={(e) => setUfSel(e.target.value)}
                className={inputCls}
              >
                <option value="" disabled>
                  UF
                </option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="rec-municipality"
                className="text-sm font-semibold text-deep"
              >
                {a.municipalityLabel}
              </label>
              {muniFailed ? (
                <input
                  id="rec-municipality"
                  name="municipality"
                  type="text"
                  placeholder={a.municipalityLabel}
                  className={inputCls}
                />
              ) : (
                <select
                  id="rec-municipality"
                  name="municipality"
                  key={ufSel}
                  defaultValue=""
                  disabled={!ufSel || muniLoading}
                  className={`${inputCls} disabled:cursor-not-allowed disabled:bg-neutral/60 disabled:text-deep/40`}
                >
                  <option value="">
                    {!ufSel
                      ? a.municipalitySelectState
                      : muniLoading
                        ? a.municipalityLoading
                        : a.municipalityPlaceholder}
                  </option>
                  {municipalities.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <span className="text-sm font-semibold text-deep">{c.waterLabel}</span>
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWater("yes")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-base font-bold transition-colors ${
                  water === "yes"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-deep/15 bg-white text-deep/70 hover:border-primary/40"
                }`}
                aria-pressed={water === "yes"}
              >
                <Droplets className="h-5 w-5" aria-hidden="true" />
                {c.waterYes}
              </button>
              <button
                type="button"
                onClick={() => setWater("no")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-base font-bold transition-colors ${
                  water === "no"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-deep/15 bg-white text-deep/70 hover:border-primary/40"
                }`}
                aria-pressed={water === "no"}
              >
                <DropletOff className="h-5 w-5" aria-hidden="true" />
                {c.waterNo}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="rec-hectares" className="text-sm font-semibold text-deep">
              {a.hectaresLabel}{" "}
              <span className="font-normal text-deep/50">({c.hectaresOptional})</span>
            </label>
            <input
              id="rec-hectares"
              name="hectares"
              type="number"
              min="1"
              step="any"
              placeholder={a.hectaresPlaceholder}
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={!ufSel || water === ""}
            className="w-full rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {c.submit}
          </button>
        </form>

        {result && (
          <div className="mt-8">
            {result.weakSignal ? (
              <div className="rounded-2xl border border-deep/10 bg-neutral p-6 shadow-sm sm:p-8">
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
            ) : (
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
                    const calcHref = `/quanto-vale?${buildParams(
                      rec,
                      result.uf,
                      result.municipality,
                      result.hectares,
                    )}`;
                    const listHref = `/app/anunciar?${buildParams(
                      rec,
                      result.uf,
                      result.municipality,
                      result.hectares,
                    )}`;
                    const hasIncome =
                      rec.incomeMinPerHa != null && rec.incomeMaxPerHa != null;
                    const warn =
                      dataLang === "en" ? rec.waterWarningEn : rec.waterWarningPt;
                    return (
                      <li
                        key={`${rec.purpose}:${rec.cropValue}`}
                        className={`rounded-2xl border bg-white p-6 shadow-sm ${
                          rec.demoted ? "border-deep/10 opacity-80" : "border-deep/10"
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
                              {rec.demoted && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-bold text-deep">
                                  <DropletOff
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  />
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
                                {dataLang === "en"
                                  ? rec.scoreReasonEn
                                  : rec.scoreReasonPt}
                              </span>
                            </p>

                            <p className="mt-2 rounded-xl bg-neutral px-4 py-2.5 text-sm text-deep/70">
                              <span className="font-bold text-deep">
                                {c.regionPrefix}
                              </span>{" "}
                              {dataLang === "en"
                                ? rec.regionalFactEn
                                : rec.regionalFactPt}
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
                                    {formatBRL(rec.incomeMinPerHa! * result.hectares)}{" "}
                                    – {formatBRL(rec.incomeMaxPerHa! * result.hectares)}
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
                              <p className="mt-3 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/60 ring-1 ring-deep/5">
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
                              <Link
                                href={calcHref}
                                className="group flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark"
                              >
                                {c.calcCta}
                                <ArrowRight
                                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                  aria-hidden="true"
                                />
                              </Link>
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
            )}
          </div>
        )}
      </div>
    </section>
  );
}
