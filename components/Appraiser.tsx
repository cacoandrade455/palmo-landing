"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Info,
  Droplets,
  DropletOff,
} from "lucide-react";
import { APP_ENABLED } from "@/lib/feature-flags";
import { submitWaitlist, type WaitlistResult } from "@/app/actions";
import { useLanguage, type AppLang } from "@/lib/language-context";
import {
  recommendUses,
  type RecommendResult,
  type Recommendation,
} from "@/lib/land-recommender";
import { RecommenderRanking } from "@/components/RecommenderRanking";
import {
  compareUses,
  estimateLease,
  formatBRL,
  UFS,
  type Estimate,
} from "@/lib/appraisal-data";
import { cropLandLeaseRef, formedCropLeaseRef } from "@/lib/appraisal-data";
import { estimateFromVTN } from "@/lib/vtn";
import { pevsPriceRef, formatKg } from "@/lib/pevs";
import { stateAdvantageFor } from "@/lib/state-advantage";
import { pricesUpdatedLabel } from "@/lib/prices";
import { sortOptionsByLabel } from "@/lib/sort-options";

type Query = {
  uf: string;
  municipality: string;
  hectares: number;
  purpose: string;
  crop: string;
  variant: string;
};

function LeadSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-primary px-6 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/**
 * Rótulos inline extras da calculadora nos 5 idiomas (o grosso das strings vem
 * de `lib/content.ts` + `lib/content-extra.ts`). Números, unidades e nomes de
 * fontes nunca aparecem aqui — só o texto ao redor deles.
 */
const XL: Record<
  AppLang,
  {
    year: string;
    pricesUpdated: string;
    listTitle: string;
    listSub: string;
    country: string;
    bestUsesTitle: string;
  }
> = {
  pt: {
    year: "ano",
    pricesUpdated: "Preços atualizados em ",
    listTitle: "Anunciar minha terra por esse valor",
    listSub: "Anúncio pré-preenchido com os dados da calculadora",
    country: "Brasil",
    bestUsesTitle: "Melhores usos para sua terra",
  },
  en: {
    year: "year",
    pricesUpdated: "Prices updated ",
    listTitle: "List my land at this value",
    listSub: "Listing pre-filled with your calculator data",
    country: "Brazil",
    bestUsesTitle: "Best uses for your land",
  },
  zh: {
    year: "年",
    pricesUpdated: "价格更新于 ",
    listTitle: "按此价格发布我的土地",
    listSub: "房源已用计算器的数据预先填写",
    country: "Brazil",
    bestUsesTitle: "Best uses for your land",
  },
  fr: {
    year: "an",
    pricesUpdated: "Prix mis à jour le ",
    listTitle: "Annoncer ma terre à cette valeur",
    listSub: "Annonce pré-remplie avec les données du calculateur",
    country: "Brazil",
    bestUsesTitle: "Best uses for your land",
  },
  ar: {
    year: "سنة",
    pricesUpdated: "حُدِّثت الأسعار في ",
    listTitle: "أعلن عن أرضي بهذه القيمة",
    listSub: "إعلان معبّأ مسبقًا ببيانات الحاسبة",
    country: "Brazil",
    bestUsesTitle: "Best uses for your land",
  },
};

/**
 * Chrome for the two-mode switch that fuses the land-use RECOMMENDER (discovery)
 * into the calculator (exact value). New inline strings (rule 5): PT/EN written
 * here, the extra languages reuse the EN variant — same policy the calculator
 * already follows for data-layer copy.
 */
type ModeCopy = {
  modeDiscover: string;
  modeCalc: string;
  discoverBanner: string;
  waterLabel: string;
  waterYes: string;
  waterNo: string;
  hectaresOptional: string;
  discoverSubmit: string;
};

const MODE_PT: ModeCopy = {
  modeDiscover: "Não sei o que plantar",
  modeCalc: "Já sei a cultura",
  discoverBanner:
    "Diga onde fica a terra e nós ranqueamos as vocações que a sua região comprovadamente faz — da maior renda para a menor. A decisão final é sua e do seu agrônomo.",
  waterLabel: "Tem fonte de água para irrigar?",
  waterYes: "Sim",
  waterNo: "Não",
  hectaresOptional: "opcional",
  discoverSubmit: "Ver recomendações",
};

const MODE_EN: ModeCopy = {
  modeDiscover: "I don't know what to plant",
  modeCalc: "I know the crop",
  discoverBanner:
    "Tell us where the land is and we rank the vocations your region provably does — highest income first. The final decision is yours and your agronomist's.",
  waterLabel: "Do you have a water source to irrigate?",
  waterYes: "Yes",
  waterNo: "No",
  hectaresOptional: "optional",
  discoverSubmit: "See recommendations",
};

const MODE: Record<AppLang, ModeCopy> = {
  pt: MODE_PT,
  en: MODE_EN,
  zh: MODE_EN,
  fr: MODE_EN,
  ar: MODE_EN,
};

export function Appraiser() {
  const { t, lang } = useLanguage();
  const xl = XL[lang];
  const mc = MODE[lang];
  // `lib/prices.ts` e `lib/appraisal-data.ts` são camadas de dados calibradas
  // (PT/EN apenas): idiomas adicionais reaproveitam a variante EN.
  const dataLang: "pt" | "en" = lang === "pt" ? "pt" : "en";
  // Two modes in one tool: "discover" runs the land-use recommender (region →
  // ranking of vocations by return); "calc" is the classic exact-value flow.
  const [mode, setMode] = useState<"discover" | "calc">("calc");
  const [water, setWater] = useState<"" | "yes" | "no">("");
  const [recResult, setRecResult] = useState<
    (RecommendResult & { hectares?: number; water: boolean }) | null
  >(null);
  const [query, setQuery] = useState<Query | null>(null);
  const [purposeSel, setPurposeSel] = useState("");
  const [cropSel, setCropSel] = useState("");
  const [ufSel, setUfSel] = useState("");
  const [muniSel, setMuniSel] = useState("");
  const [haInput, setHaInput] = useState("");
  // per-UF cache: string[] = loaded; "error" = IBGE unavailable (free-text fallback)
  const [muniByUf, setMuniByUf] = useState<Record<string, string[] | "error">>({});

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
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [leadState, leadAction] = useActionState<WaitlistResult | null, FormData>(
    async (_prev, formData) => submitWaitlist(formData),
    null,
  );

  const a = t.appraiser;

  // Prefill bridge FROM the land-use recommender (/recomendar): it links here
  // with uf/municipality/purpose/crop/hectares in the query string. We fill the
  // form and, when hectares is present, compute the result immediately. Read in
  // an effect (client-only, never during SSR); setState is deferred to satisfy
  // react-hooks/set-state-in-effect.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    // `/recomendar` and the "discover" entry points redirect here with
    // ?descobrir=1, opening the tool straight in discovery mode.
    const wantDiscover =
      sp.get("descobrir") === "1" || sp.get("mode") === "descobrir";
    const uf = sp.get("uf") ?? "";
    const purpose = sp.get("purpose") ?? "";
    if (!wantDiscover && !uf && !purpose) return;
    const crop = sp.get("crop") ?? "";
    const variant = sp.get("variant") ?? "";
    const municipality = (sp.get("municipality") ?? "").trim();
    const hectares = Number(sp.get("hectares") ?? 0);
    const hasHa = Number.isFinite(hectares) && hectares > 0;
    queueMicrotask(() => {
      if (wantDiscover) setMode("discover");
      if (uf) setUfSel(uf);
      if (purpose) setPurposeSel(purpose);
      if (crop) setCropSel(crop);
      if (municipality) setMuniSel(municipality);
      if (hasHa) setHaInput(String(hectares));
      if (!wantDiscover && uf && purpose && hasHa) {
        setQuery({ uf, municipality, hectares, purpose, crop, variant });
        setEstimate(estimateLease(purpose, uf, crop || undefined));
      }
    });
  }, []);

  function handleDiscover(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const uf = String(fd.get("uf") ?? "");
    const municipality = String(fd.get("municipality") ?? "").trim();
    const haRaw = Number(fd.get("hectares") ?? 0);
    const hectares =
      Number.isFinite(haRaw) && haRaw > 0 ? haRaw : undefined;
    if (!uf || water === "") return;
    const hasWater = water === "yes";
    const res = recommendUses({ uf, municipality, water: hasWater, hectares });
    setRecResult({ ...res, hectares, water: hasWater });
  }

  // Bridge a ranking card back to calculation mode, pre-filled — same tool, no
  // navigation, so the calculator keeps its loaded municipality list and state.
  function goToCalc(rec: Recommendation) {
    const uf = recResult?.uf ?? ufSel;
    const municipality = recResult?.municipality ?? muniSel;
    const hectares = recResult?.hectares;
    setMode("calc");
    setUfSel(uf);
    setMuniSel(municipality);
    setPurposeSel(rec.purpose);
    setCropSel(rec.cropValue);
    if (hectares) setHaInput(String(hectares));
    if (uf && rec.purpose && hectares && hectares > 0) {
      setQuery({
        uf,
        municipality,
        hectares,
        purpose: rec.purpose,
        crop: rec.cropValue,
        variant: "",
      });
      setEstimate(estimateLease(rec.purpose, uf, rec.cropValue || undefined));
    } else {
      setQuery(null);
      setEstimate(null);
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleCalculate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q: Query = {
      uf: String(fd.get("uf") ?? ""),
      municipality: String(fd.get("municipality") ?? "").trim(),
      hectares: Number(fd.get("hectares") ?? 0),
      purpose: String(fd.get("purpose") ?? ""),
      crop: String(fd.get("crop") ?? ""),
      variant: String(fd.get("variant") ?? ""),
    };
    if (!q.uf || !q.purpose || !q.hectares || q.hectares <= 0) return;
    setQuery(q);
    setEstimate(estimateLease(q.purpose, q.uf, q.crop || undefined));
  }

  const purposeLabel =
    query &&
    (t.waitlist.purposeOptions.find((o) => o.value === query.purpose)?.label ??
      query.purpose);

  const inputCls =
    "mt-1.5 w-full rounded-xl border border-deep/15 bg-white px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none";

  // Bridge calculator → listing form (dark-launched app only). The suggested
  // price is the midpoint of the SAME per-ha range the result headlines:
  // range estimate, formed-crop model, crop land reference or VTN — in the
  // exact order the result block picks its headline. No numbers → no CTA.
  const listCta = { title: xl.listTitle, sub: xl.listSub };
  const listUrl = (() => {
    if (!APP_ENABLED || !query || !estimate) return null;
    const midOf = (min: number, max: number) => Math.round((min + max) / 2);
    let suggested: number | null = null;
    if (estimate.kind === "range") {
      suggested = midOf(estimate.minPerHa, estimate.maxPerHa);
    } else {
      const formed = query.crop ? formedCropLeaseRef(query.crop, query.uf) : null;
      const cropRef = query.crop ? cropLandLeaseRef(query.crop, query.uf) : null;
      const vtn = estimateFromVTN(
        query.uf,
        query.municipality,
        query.purpose === "extrativismo" ? "silvicultura" : query.purpose,
      );
      if (formed) suggested = midOf(formed.minPerHa, formed.maxPerHa);
      else if (cropRef) suggested = midOf(cropRef.minPerHa, cropRef.maxPerHa);
      else if (vtn) suggested = midOf(vtn.minPerHa, vtn.maxPerHa);
    }
    if (suggested == null) return null;
    const params = new URLSearchParams({
      uf: query.uf,
      municipality: query.municipality,
      hectares: String(query.hectares),
      purpose: query.purpose,
      suggested: String(suggested),
    });
    if (query.crop) params.set("crop", query.crop);
    if (query.variant) params.set("variant", query.variant);
    return `/app/anunciar?${params.toString()}`;
  })();

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-2xl px-6">
        <p className="text-center text-sm font-bold uppercase tracking-wide text-primary">
          {a.eyebrow}
        </p>
        <h1 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-deep sm:text-4xl">
          {a.title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-base text-deep/70">
          {a.subtitle}
        </p>

        {/* One tool, two modes: discover the best use, or calculate its value. */}
        <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-1 rounded-full bg-neutral p-1">
          <button
            type="button"
            onClick={() => setMode("discover")}
            aria-pressed={mode === "discover"}
            className={`rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
              mode === "discover"
                ? "bg-primary text-white shadow-sm"
                : "text-deep/60 hover:text-deep"
            }`}
          >
            {mc.modeDiscover}
          </button>
          <button
            type="button"
            onClick={() => setMode("calc")}
            aria-pressed={mode === "calc"}
            className={`rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
              mode === "calc"
                ? "bg-primary text-white shadow-sm"
                : "text-deep/60 hover:text-deep"
            }`}
          >
            {mc.modeCalc}
          </button>
        </div>

        {mode === "discover" && (
          <>
            <p className="mx-auto mt-6 flex max-w-md items-start gap-2 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{mc.discoverBanner}</span>
            </p>

            <form
              onSubmit={handleDiscover}
              className="mt-6 space-y-4 rounded-2xl border border-deep/10 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="disc-uf"
                    className="text-sm font-semibold text-deep"
                  >
                    {a.stateLabel}
                  </label>
                  <select
                    id="disc-uf"
                    name="uf"
                    required
                    value={ufSel}
                    onChange={(e) => {
                      setUfSel(e.target.value);
                      setMuniSel("");
                    }}
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
                    htmlFor="disc-municipality"
                    className="text-sm font-semibold text-deep"
                  >
                    {a.municipalityLabel}
                  </label>
                  {muniFailed ? (
                    <input
                      id="disc-municipality"
                      name="municipality"
                      type="text"
                      value={muniSel}
                      onChange={(e) => setMuniSel(e.target.value)}
                      placeholder={a.municipalityLabel}
                      className={inputCls}
                    />
                  ) : (
                    <select
                      id="disc-municipality"
                      name="municipality"
                      value={muniSel}
                      onChange={(e) => setMuniSel(e.target.value)}
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
                <span className="text-sm font-semibold text-deep">
                  {mc.waterLabel}
                </span>
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
                    {mc.waterYes}
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
                    {mc.waterNo}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="disc-hectares"
                  className="text-sm font-semibold text-deep"
                >
                  {a.hectaresLabel}{" "}
                  <span className="font-normal text-deep/50">
                    ({mc.hectaresOptional})
                  </span>
                </label>
                <input
                  id="disc-hectares"
                  name="hectares"
                  type="number"
                  min="1"
                  step="any"
                  value={haInput}
                  onChange={(e) => setHaInput(e.target.value)}
                  placeholder={a.hectaresPlaceholder}
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                disabled={!ufSel || water === ""}
                className="w-full rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mc.discoverSubmit}
              </button>
            </form>

            {recResult && (
              <div className="mt-8">
                <RecommenderRanking
                  result={recResult}
                  onCalcSelect={goToCalc}
                />
              </div>
            )}
          </>
        )}

        {mode === "calc" && (
          <>
        <form
          onSubmit={handleCalculate}
          className="mt-8 space-y-4 rounded-2xl border border-deep/10 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="uf" className="text-sm font-semibold text-deep">
                {a.stateLabel}
              </label>
              <select
                id="uf"
                name="uf"
                required
                value={ufSel}
                onChange={(e) => {
                  setUfSel(e.target.value);
                  setMuniSel("");
                }}
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
                htmlFor="ap-municipality"
                className="text-sm font-semibold text-deep"
              >
                {a.municipalityLabel}
              </label>
              {muniFailed ? (
                <input
                  id="ap-municipality"
                  name="municipality"
                  type="text"
                  required
                  value={muniSel}
                  onChange={(e) => setMuniSel(e.target.value)}
                  placeholder={a.municipalityLabel}
                  className={inputCls}
                />
              ) : (
                <select
                  id="ap-municipality"
                  name="municipality"
                  required
                  value={muniSel}
                  onChange={(e) => setMuniSel(e.target.value)}
                  disabled={!ufSel || muniLoading}
                  className={`${inputCls} disabled:cursor-not-allowed disabled:bg-neutral/60 disabled:text-deep/40`}
                >
                  <option value="" disabled>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="hectares" className="text-sm font-semibold text-deep">
                {a.hectaresLabel}
              </label>
              <input
                id="hectares"
                name="hectares"
                type="number"
                min="1"
                step="any"
                required
                value={haInput}
                onChange={(e) => setHaInput(e.target.value)}
                placeholder={a.hectaresPlaceholder}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="ap-purpose" className="text-sm font-semibold text-deep">
                {a.purposeLabel}
              </label>
              <select
                id="ap-purpose"
                name="purpose"
                required
                value={purposeSel}
                onChange={(e) => {
                  setPurposeSel(e.target.value);
                  setCropSel("");
                }}
                className={inputCls}
              >
                <option value="" disabled>
                  {a.purposePlaceholder}
                </option>
                {sortOptionsByLabel(t.waitlist.purposeOptions).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {a.crops[purposeSel] && (
            <div>
              <label htmlFor="ap-crop" className="text-sm font-semibold text-deep">
                {a.cropLabel}
              </label>
              <select
                id="ap-crop"
                name="crop"
                value={cropSel}
                onChange={(e) => setCropSel(e.target.value)}
                className={inputCls}
              >
                <option value="">{a.cropPlaceholder}</option>
                {sortOptionsByLabel(a.crops[purposeSel]).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {cropSel && (a.cropVariants[cropSel]?.length ?? 0) > 0 && (
            <div>
              <label htmlFor="ap-variant" className="text-sm font-semibold text-deep">
                {a.variantLabel}
              </label>
              <select
                id="ap-variant"
                name="variant"
                key={cropSel}
                defaultValue=""
                className={inputCls}
              >
                <option value="">{a.variantPlaceholder}</option>
                {sortOptionsByLabel(a.cropVariants[cropSel] ?? []).map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-accent px-6 py-3.5 text-base font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark"
          >
            {a.submit}
          </button>
        </form>

        {query && estimate && (
          <div className="mt-8 rounded-2xl bg-neutral p-6 sm:p-8">
            {(() => {
              const adv =
                (query.crop && stateAdvantageFor(query.crop, query.uf)) ||
                stateAdvantageFor(query.purpose, query.uf);
              if (!adv) return null;
              return (
                <div className="mb-5 rounded-xl bg-primary/10 px-4 py-3 ring-1 ring-primary/20">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    ⭐ {a.advantageLabel}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-deep">
                    {dataLang === "en" ? adv.factEn : adv.factPt}
                  </p>
                </div>
              );
            })()}
            {estimate.kind === "range" ? (
              <>
                <h2 className="text-sm font-bold uppercase tracking-wide text-primary">
                  {a.resultTitle}
                </h2>
                <p className="mt-1 text-sm text-deep/60">
                  {(query.crop &&
                    a.crops[query.purpose]?.find((c) => c.value === query.crop)
                      ?.label) ||
                    purposeLabel}{" "}
                  · {query.municipality}, {query.uf} · {query.hectares} ha
                </p>
                <p className="mt-4 text-3xl font-extrabold text-deep sm:text-5xl">
                  {formatBRL(estimate.minPerHa * query.hectares)} –{" "}
                  {formatBRL(estimate.maxPerHa * query.hectares)}
                  <span className="ml-2 text-lg font-bold text-deep/50">
                    /{xl.year}
                  </span>
                </p>
                <p className="mt-2 text-base font-semibold text-deep/70">
                  {formatBRL(estimate.minPerHa)} – {formatBRL(estimate.maxPerHa)}{" "}
                  {a.perHaYear}
                </p>
                {estimate.fallback && (
                  <p className="mt-1.5 text-xs font-semibold leading-relaxed text-deep/50">
                    {a.nationalFallbackNote}
                  </p>
                )}
                {query.crop && a.cropNotes[query.crop] && (
                  <p className="mt-2 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70">
                    🌱 {a.cropNotes[query.crop]}
                  </p>
                )}
                {query.crop && a.cropFormation[query.crop] && (
                  <p className="mt-2 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70">
                    ⏳ {a.cropFormation[query.crop]}
                  </p>
                )}
                {(() => {
                  const vtn = estimateFromVTN(
                    query.uf,
                    query.municipality,
                    query.purpose === "extrativismo" ? "silvicultura" : query.purpose,
                  );
                  if (!vtn) return null;
                  return (
                    <p className="mt-2 text-sm font-semibold text-deep/60">
                      🏛️{" "}
                      {(vtn.approx ? a.vtnLineApprox : a.vtnLine)
                        .replace("{year}", String(vtn.year))
                        .replace("{value}", formatBRL(vtn.vtnPerHa))}
                    </p>
                  );
                })()}
              </>
            ) : (
              (() => {
                // A crop with its own market model (formed plantation or land
                // reference) should HEADLINE the result — "market too specific"
                // only shows when there is truly nothing crop-specific.
                const cropRef = query.crop
                  ? cropLandLeaseRef(query.crop, query.uf)
                  : null;
                const formed = query.crop
                  ? formedCropLeaseRef(query.crop, query.uf)
                  : null;
                const hasModel = !!(formed || cropRef);
                // Extrativismo usa o campo de silvicultura do VTN — a proxy
                // oficial mais próxima para vegetação nativa em pé.
                const vtnHead = estimateFromVTN(
                  query.uf,
                  query.municipality,
                  query.purpose === "extrativismo" ? "silvicultura" : query.purpose,
                );
                const hasNumbers = hasModel || !!vtnHead;
                return (
              <>
                {hasNumbers && (
                  <h2 className="text-sm font-bold uppercase tracking-wide text-primary">
                    {a.resultTitle}
                  </h2>
                )}
                <p className={hasNumbers ? "mt-1 text-sm text-deep/60" : "text-sm font-semibold text-deep/60"}>
                  {(query.crop &&
                    a.crops[query.purpose]?.find((c) => c.value === query.crop)
                      ?.label) ||
                    purposeLabel}{" "}
                  · {query.municipality}, {query.uf} · {query.hectares} ha
                </p>
                {!hasNumbers && (
                  <>
                    <h2 className="mt-2 text-lg font-extrabold text-deep">{a.consultTitle}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-deep/70">
                      {a.consultBody}
                    </p>
                  </>
                )}
                {!hasModel && !query.crop && (a.crops[query.purpose]?.length ?? 0) > 0 && (
                  <p className="mt-2 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
                    💡 {a.consultPickCrop}
                  </p>
                )}
                {query.crop && a.cropNotes[query.crop] && (
                  <p className="mt-3 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70">
                    🌱 {a.cropNotes[query.crop]}
                  </p>
                )}
                {query.crop && a.cropFormation[query.crop] && (
                  <p className="mt-2 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70">
                    ⏳ {a.cropFormation[query.crop]}
                  </p>
                )}
                {query.purpose === "extrativismo" &&
                  query.crop &&
                  (() => {
                    const ref = pevsPriceRef(query.crop, query.uf, query.municipality);
                    if (!ref) return null;
                    const where =
                      ref.scope === "muni"
                        ? a.pevsWhereMuni
                        : ref.scope === "uf"
                          ? a.pevsWhereUf
                          : a.pevsWhereBr;
                    return (
                      <div className="mt-3 rounded-xl bg-primary/10 px-4 py-3">
                        <p className="text-sm font-bold text-deep">
                          {a.pevsPriceLine
                            .replace("{where}", where)
                            .replace("{price}", formatKg(ref.price))
                            .replace("{year}", ref.year)}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-deep/70">
                          {a.pevsHint}
                        </p>
                      </div>
                    );
                  })()}
                {(() => {
                  const vtn = estimateFromVTN(
                    query.uf,
                    query.municipality,
                    query.purpose === "extrativismo" ? "silvicultura" : query.purpose,
                  );
                  if (formed) {
                    const raw = cropRef ?? vtn;
                    return (
                      <>
                        <p className="mt-4 text-sm font-semibold text-deep/70">
                          🌾{" "}
                          {a.formedPotential.replace("{source}", formed.sourceNote)}
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-deep sm:text-5xl">
                          {formatBRL(formed.minPerHa * query.hectares)} –{" "}
                          {formatBRL(formed.maxPerHa * query.hectares)}
                          <span className="ml-2 text-lg font-bold text-deep/50">
                            /{xl.year}
                          </span>
                        </p>
                        <p className="mt-1 text-sm font-semibold text-deep/60">
                          {formatBRL(formed.minPerHa)} – {formatBRL(formed.maxPerHa)}{" "}
                          {a.perHaYear}
                        </p>
                        <p className="mt-3 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
                          {a.formedNote}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-deep/60">
                          {a.formedMath
                            .replace("{revMin}", formatBRL(formed.revMin))
                            .replace("{revMax}", formatBRL(formed.revMax))}
                        </p>
                        {raw && (
                          <p className="mt-3 text-sm font-semibold text-deep/60">
                            {a.rawLandLabel}{" "}
                            {formatBRL(raw.minPerHa)} – {formatBRL(raw.maxPerHa)}{" "}
                            {a.perHaYear}
                            {vtn && !cropRef && (
                              <>
                                {" "}
                                (
                                {(vtn.approx ? a.vtnLineApprox : a.vtnLine)
                                  .replace("{year}", String(vtn.year))
                                  .replace("{value}", formatBRL(vtn.vtnPerHa))}
                                )
                              </>
                            )}
                          </p>
                        )}
                      </>
                    );
                  }
                  if (cropRef) {
                    return (
                      <>
                        <p className="mt-4 text-sm font-semibold text-deep/70">
                          📈{" "}
                          {a.cropRefPotential
                            .replace("{source}", cropRef.sourceNote)
                            .replace("{landMin}", String(Math.round(cropRef.landMin / 1000)))
                            .replace("{landMax}", String(Math.round(cropRef.landMax / 1000)))}
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-deep sm:text-5xl">
                          {formatBRL(cropRef.minPerHa * query.hectares)} –{" "}
                          {formatBRL(cropRef.maxPerHa * query.hectares)}
                          <span className="ml-2 text-lg font-bold text-deep/50">
                            /{xl.year}
                          </span>
                        </p>
                        {vtn && (
                          <p className="mt-2 text-sm font-semibold text-deep/60">
                            🏛️{" "}
                            {(vtn.approx ? a.vtnLineApprox : a.vtnLine)
                              .replace("{year}", String(vtn.year))
                              .replace("{value}", formatBRL(vtn.vtnPerHa))}
                          </p>
                        )}
                      </>
                    );
                  }
                  if (vtn) {
                    return (
                      <>
                        <p className="mt-4 text-sm font-semibold text-deep/70">
                          🏛️{" "}
                          {(vtn.approx ? a.vtnPotentialApprox : a.vtnPotential).replace(
                            "{year}",
                            String(vtn.year),
                          )}
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-deep sm:text-5xl">
                          {formatBRL(vtn.minPerHa * query.hectares)} –{" "}
                          {formatBRL(vtn.maxPerHa * query.hectares)}
                          <span className="ml-2 text-lg font-bold text-deep/50">
                            /{xl.year}
                          </span>
                        </p>
                      </>
                    );
                  }
                  const comps = compareUses(query.uf);
                  const top = comps.find((c) => !c.selective) ?? comps[0];
                  if (!top) return null;
                  const labelOf = (p: string) =>
                    t.waitlist.purposeOptions.find((o) => o.value === p)?.label ?? p;
                  return (
                    <>
                      <p className="mt-4 text-sm font-semibold text-deep/70">
                        {a.consultPotential.replace("{use}", labelOf(top.purpose))}
                      </p>
                      <p className="mt-2 text-3xl font-extrabold text-deep sm:text-5xl">
                        {formatBRL(top.minPerHa * query.hectares)} –{" "}
                        {formatBRL(top.maxPerHa * query.hectares)}
                        <span className="ml-2 text-lg font-bold text-deep/50">
                          /{xl.year}
                        </span>
                      </p>
                      {top.fallback && (
                        <p className="mt-1.5 text-xs font-semibold leading-relaxed text-deep/50">
                          {a.nationalFallbackNote}
                        </p>
                      )}
                    </>
                  );
                })()}
              </>
                );
              })()
            )}

            {listUrl && (
              <Link
                href={listUrl}
                className="group mt-6 flex items-center gap-4 rounded-2xl border-2 border-accent bg-accent/10 px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent/20 hover:shadow-md"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-extrabold leading-snug text-deep sm:text-lg">
                    {listCta.title}
                  </span>
                  <span className="mt-0.5 block text-sm leading-snug text-deep/60">
                    {listCta.sub}
                  </span>
                </span>
                <ArrowRight
                  className="h-5 w-5 shrink-0 text-deep transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            )}

            {/* Best uses for your land — ranked by return, each with the
                sourced regional "why". The justification is NOT computed here:
                we route the same land through the recommender engine and reuse,
                verbatim, the fact it already exposes per use (regionalFact from
                lib/state-advantage.ts). No engine → no fact line. */}
            {(() => {
              const comps = compareUses(query.uf)
                .filter((c) => !c.selective || c.purpose === query.purpose)
                .slice(0, 4);
              if (comps.length < 2) return null;
              const chosen = comps.find((c) => c.purpose === query.purpose);
              const topRealistic = comps.find(
                (c) => !c.selective && c.purpose !== query.purpose,
              );
              const showUpsell =
                estimate.kind === "range" &&
                chosen &&
                !!topRealistic &&
                topRealistic.mid >= chosen.mid * 1.5;
              const labelOf = (p: string) =>
                t.waitlist.purposeOptions.find((o) => o.value === p)?.label ?? p;
              // The "why" for each use, taken straight from the recommender
              // engine (which reads lib/state-advantage.ts). We index by crop
              // and by purpose so the chosen crop shows its own fact when it has
              // one, and every other line shows its purpose's top-ranked fact.
              const rec = recommendUses({
                uf: query.uf,
                municipality: query.municipality,
                water: true,
                hectares: query.hectares,
              });
              const factByCrop = new Map<string, { pt: string; en: string }>();
              const factByPurpose = new Map<string, { pt: string; en: string }>();
              if (!rec.weakSignal) {
                for (const r of rec.recommendations) {
                  const f = { pt: r.regionalFactPt, en: r.regionalFactEn };
                  if (r.cropValue && !factByCrop.has(r.cropValue))
                    factByCrop.set(r.cropValue, f);
                  if (!factByPurpose.has(r.purpose)) factByPurpose.set(r.purpose, f);
                }
              }
              const factFor = (purpose: string, isChosen: boolean) => {
                const own =
                  isChosen && query.crop ? factByCrop.get(query.crop) : undefined;
                const f = own ?? factByPurpose.get(purpose);
                if (!f) return null;
                return dataLang === "en" ? f.en : f.pt;
              };
              return (
                <div className="mt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-deep/60">
                    {xl.bestUsesTitle}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {comps.map((c) => {
                      const isChosen = c.purpose === query.purpose;
                      const why = factFor(c.purpose, isChosen);
                      return (
                        <li
                          key={c.purpose}
                          className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm ${
                            isChosen
                              ? "bg-primary/10 font-bold text-deep ring-1 ring-primary/30"
                              : "bg-white text-deep/75"
                          }`}
                        >
                          <span>
                            {labelOf(c.purpose)}
                            {isChosen && (
                              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                                {a.compareYourChoice}
                              </span>
                            )}
                            {c.selective && (
                              <span className="mt-0.5 block text-xs font-normal text-deep/50">
                                {a.selectiveTag}
                              </span>
                            )}
                            {why && (
                              <span className="mt-0.5 block text-xs font-normal text-deep/50">
                                {why}
                              </span>
                            )}
                          </span>
                          <span className="whitespace-nowrap font-semibold">
                            {formatBRL(c.minPerHa)}–{formatBRL(c.maxPerHa)}
                            <span className="ml-1 text-xs font-normal text-deep/50">
                              {a.compareUnit}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {showUpsell && chosen && topRealistic && (
                    <p className="mt-3 rounded-xl bg-accent/20 px-4 py-3 text-sm font-semibold text-deep">
                      💡{" "}
                      {a.compareUpsell
                        .replace("{use}", labelOf(topRealistic.purpose))
                        .replace(
                          "{ratio}",
                          (
                            Math.round((topRealistic.mid / chosen.mid) * 10) / 10
                          ).toLocaleString(dataLang === "en" ? "en-US" : "pt-BR"),
                        )}
                    </p>
                  )}
                  <p className="mt-2 text-xs leading-relaxed text-deep/55">
                    {a.compareCaveat}
                  </p>
                </div>
              );
            })()}

            <p className="mt-5 flex gap-2 text-xs leading-relaxed text-deep/55">
              <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {a.disclaimer}
                {estimate.kind === "range" && <> {a.legalNote}</>}{" "}
                {xl.pricesUpdated}
                {pricesUpdatedLabel(dataLang)}.
              </span>
            </p>

            {/* Lead capture — posts to the same waitlist sheet */}
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              {leadState?.ok ? (
                <div className="flex items-center gap-2 text-deep">
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <p className="font-semibold">{t.waitlist.success}</p>
                </div>
              ) : (
                <>
                  <h3 className="text-base font-extrabold text-deep">{a.leadTitle}</h3>
                  <p className="mt-1 text-sm text-deep/60">{a.leadSubtitle}</p>
                  <form action={leadAction} className="mt-4 space-y-3">
                    <input type="hidden" name="language" value={lang} />
                    <input type="hidden" name="country" value={xl.country} />
                    <input type="hidden" name="state" value={query.uf} />
                    <input type="hidden" name="municipality" value={query.municipality} />
                    <input type="hidden" name="purpose" value={query.purpose} />
                    {query.crop && (
                      <input
                        type="hidden"
                        name="purposeDetail"
                        value={(() => {
                          const cl =
                            a.crops[query.purpose]?.find((c) => c.value === query.crop)
                              ?.label ?? query.crop;
                          const vl = query.variant
                            ? a.cropVariants[query.crop]?.find(
                                (v) => v.value === query.variant,
                              )?.label
                            : undefined;
                          return vl ? `${cl} / ${vl}` : cl;
                        })()}
                      />
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        name="name"
                        type="text"
                        required
                        placeholder={t.waitlist.namePlaceholder}
                        aria-label={t.waitlist.nameLabel}
                        className={inputCls}
                      />
                      <input
                        name="phone"
                        type="tel"
                        required
                        placeholder={t.waitlist.phonePlaceholder}
                        aria-label={t.waitlist.phoneLabel}
                        className={inputCls}
                      />
                    </div>
                    <select
                      name="role"
                      required
                      defaultValue="have"
                      aria-label={t.waitlist.roleLabel}
                      className={inputCls}
                    >
                      <option value="have">{t.waitlist.roleHave}</option>
                      <option value="want">{t.waitlist.roleWant}</option>
                    </select>
                    {leadState && !leadState.ok && (
                      <p className="text-sm font-semibold text-red-600">
                        {t.waitlist.error}
                      </p>
                    )}
                    <LeadSubmit
                      label={t.waitlist.submit}
                      pendingLabel={t.waitlist.submitting}
                    />
                  </form>
                </>
              )}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </section>
  );
}
