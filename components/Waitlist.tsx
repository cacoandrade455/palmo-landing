"use client";

import { useActionState, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { submitWaitlist, type WaitlistResult } from "@/app/actions";
import { useLanguage, type AppLang } from "@/lib/language-context";

const initialState: WaitlistResult | null = null;

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

const UF_NOMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins",
};

const inputCls =
  "mt-1.5 w-full rounded-xl border border-deep/15 px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none";

type MuniCache = Record<string, string[] | "error" | undefined>;

/** Accent-insensitive lowercase, for the municipality search box. */
function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Rótulos extras da UI de região nos 5 idiomas (os demais vêm de
 * `lib/content.ts` + `lib/content-extra.ts`). Nomes de UF, municípios e
 * fontes nunca são traduzidos — só o texto ao redor deles.
 */
type XLabels = {
  whereWant: string;
  whereWantHint: string;
  anywhere: string;
  statesLabel: string;
  wholeState: (uf: string) => string;
  muniOptional: (nome: string) => string;
  noneMeansAll: string;
  searchMuni: string;
  checkedLabel: string;
  muniError: string;
  retry: string;
  selectUf: string;
  selectMuni: string;
  selectMuniFirst: string;
  loading: string;
  muniFallback: string;
  errMissing: string;
  errNoRegion: string;
  successCta: string;
};

const X_LABELS: Record<AppLang, XLabels> = {
  pt: {
    whereWant: "Onde você procura terra?",
    whereWantHint:
      "Marque todos os estados que te interessam — e, se quiser, municípios específicos.",
    anywhere: "Qualquer lugar do Brasil",
    statesLabel: "Estados de interesse",
    wholeState: (uf: string) => `Todo o estado de ${uf}`,
    muniOptional: (nome: string) => `Municípios em ${nome} (opcional)`,
    noneMeansAll: "Nenhum marcado = estado inteiro",
    searchMuni: "Buscar município…",
    checkedLabel: "Marcados:",
    muniError: "Não deu para carregar os municípios — vamos considerar o estado inteiro.",
    retry: "Tentar de novo",
    selectUf: "Selecione…",
    selectMuni: "Selecione…",
    selectMuniFirst: "Escolha o estado primeiro",
    loading: "Carregando…",
    muniFallback: "Município (digite)",
    errMissing: "Confira os campos e tente de novo.",
    errNoRegion: "Marque pelo menos um estado — ou “Qualquer lugar do Brasil”.",
    successCta: "Enquanto isso, veja quanto sua terra pode render →",
  },
  en: {
    whereWant: "Where are you looking for land?",
    whereWantHint:
      "Check every state you're interested in — and, if you want, specific municipalities.",
    anywhere: "Anywhere in Brazil",
    statesLabel: "States of interest",
    wholeState: (uf: string) => `All of ${uf}`,
    muniOptional: (nome: string) => `Municipalities in ${nome} (optional)`,
    noneMeansAll: "None checked = the whole state",
    searchMuni: "Search municipality…",
    checkedLabel: "Checked:",
    muniError: "Couldn't load the municipalities — we'll consider the whole state.",
    retry: "Try again",
    selectUf: "Select…",
    selectMuni: "Select…",
    selectMuniFirst: "Pick the state first",
    loading: "Loading…",
    muniFallback: "Municipality (type it)",
    errMissing: "Please review the fields and try again.",
    errNoRegion: "Check at least one state — or “Anywhere in Brazil”.",
    successCta: "Meanwhile, see what your land could earn →",
  },
  zh: {
    whereWant: "您在哪里寻找土地？",
    whereWantHint:
      "勾选所有您感兴趣的州——如需要，也可勾选具体的市。",
    anywhere: "巴西境内任何地方",
    statesLabel: "感兴趣的州",
    wholeState: (uf: string) => `${uf} 全州`,
    muniOptional: (nome: string) => `${nome} 的市（可选）`,
    noneMeansAll: "未勾选任何市 = 整个州",
    searchMuni: "搜索市…",
    checkedLabel: "已勾选：",
    muniError: "无法加载市列表——我们将按整个州处理。",
    retry: "重试",
    selectUf: "请选择…",
    selectMuni: "请选择…",
    selectMuniFirst: "请先选择州",
    loading: "加载中…",
    muniFallback: "市（请输入）",
    errMissing: "请检查各字段后重试。",
    errNoRegion: "请至少勾选一个州——或选择“巴西境内任何地方”。",
    successCta: "在此期间，看看您的土地能带来多少收益 →",
  },
  fr: {
    whereWant: "Où cherchez-vous une terre ?",
    whereWantHint:
      "Cochez tous les états qui vous intéressent — et, si vous le souhaitez, des municipalités précises.",
    anywhere: "N'importe où au Brésil",
    statesLabel: "États d'intérêt",
    wholeState: (uf: string) => `Tout l'état du ${uf}`,
    muniOptional: (nome: string) => `Municipalités du ${nome} (facultatif)`,
    noneMeansAll: "Aucune cochée = l'état entier",
    searchMuni: "Rechercher une municipalité…",
    checkedLabel: "Cochées :",
    muniError: "Impossible de charger les municipalités — nous prendrons l'état entier.",
    retry: "Réessayer",
    selectUf: "Sélectionnez…",
    selectMuni: "Sélectionnez…",
    selectMuniFirst: "Choisissez d'abord l'état",
    loading: "Chargement…",
    muniFallback: "Municipalité (à saisir)",
    errMissing: "Veuillez vérifier les champs et réessayer.",
    errNoRegion: "Cochez au moins un état — ou « N'importe où au Brésil ».",
    successCta: "En attendant, voyez ce que votre terre pourrait rapporter →",
  },
  ar: {
    whereWant: "أين تبحث عن أرض؟",
    whereWantHint:
      "حدِّد كل الولايات التي تهمّك — وإن شئت، بلديات بعينها.",
    anywhere: "أي مكان في البرازيل",
    statesLabel: "الولايات المهتمّ بها",
    wholeState: (uf: string) => `ولاية ${uf} بأكملها`,
    muniOptional: (nome: string) => `بلديات ${nome} (اختياري)`,
    noneMeansAll: "لا شيء محدَّد = الولاية بأكملها",
    searchMuni: "ابحث عن بلدية…",
    checkedLabel: "المحدَّدة:",
    muniError: "تعذّر تحميل البلديات — سنأخذ الولاية بأكملها.",
    retry: "أعد المحاولة",
    selectUf: "اختر…",
    selectMuni: "اختر…",
    selectMuniFirst: "اختر الولاية أولاً",
    loading: "جارٍ التحميل…",
    muniFallback: "البلدية (اكتبها)",
    errMissing: "يرجى مراجعة الحقول والمحاولة مجددًا.",
    errNoRegion: "حدِّد ولاية واحدة على الأقل — أو «أي مكان في البرازيل».",
    successCta: "في هذه الأثناء، اطّلع على ما يمكن أن تدرّه أرضك →",
  },
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function Waitlist() {
  const { t, lang } = useLanguage();
  const [state, formAction] = useActionState<WaitlistResult | null, FormData>(
    async (_prev, formData) => submitWaitlist(formData),
    initialState,
  );

  const [role, setRole] = useState<"have" | "want">("have");
  const [country, setCountry] = useState(lang === "en" ? "Brazil" : "Brasil");

  // "Tenho terra" (one UF + one município).
  const [ufSel, setUfSel] = useState("");
  const [munSel, setMunSel] = useState("");
  const [munText, setMunText] = useState(""); // fallback when the IBGE API is down

  // "Procuro terra" (multi-state + optional multi-município per state).
  const [wantUfs, setWantUfs] = useState<string[]>([]);
  const [wantMunis, setWantMunis] = useState<Record<string, string[]>>({});
  const [wantFilter, setWantFilter] = useState<Record<string, string>>({});
  const [brasilInteiro, setBrasilInteiro] = useState(false);

  const [muniByUf, setMuniByUf] = useState<MuniCache>({});
  const [localError, setLocalError] = useState<string | null>(null);

  const x = X_LABELS[lang];

  const isBrasil = ["brasil", "brazil", "br"].includes(country.trim().toLowerCase());

  const muniEntry = ufSel ? muniByUf[ufSel] : undefined;
  const municipios = Array.isArray(muniEntry) ? muniEntry : [];
  const muniFailed = muniEntry === "error";
  const muniLoading = !!ufSel && muniEntry === undefined;

  /** Loads a UF's municipalities from the IBGE API (cached per UF). */
  function ensureMunicipios(uf: string) {
    if (!uf || Array.isArray(muniByUf[uf])) return;
    setMuniByUf((prev) => {
      const next = { ...prev };
      delete next[uf]; // clears a previous "error" so the UI shows "loading" while retrying
      return next;
    });
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((list: { nome: string }[]) =>
        setMuniByUf((prev) => ({ ...prev, [uf]: list.map((m) => m.nome) })),
      )
      .catch(() => setMuniByUf((prev) => ({ ...prev, [uf]: "error" })));
  }

  /** "Tenho terra": selecting the UF resets the município and loads the list. */
  function loadMunicipios(uf: string) {
    setUfSel(uf);
    setMunSel("");
    setMunText("");
    ensureMunicipios(uf);
  }

  /** "Procuro terra": checks/unchecks a state of interest. */
  function toggleWantUf(uf: string) {
    setLocalError(null);
    if (wantUfs.includes(uf)) {
      setWantUfs((prev) => prev.filter((u) => u !== uf));
      setWantMunis((prev) => {
        const next = { ...prev };
        delete next[uf];
        return next;
      });
      setWantFilter((prev) => {
        const next = { ...prev };
        delete next[uf];
        return next;
      });
    } else {
      setWantUfs((prev) => (prev.includes(uf) ? prev : [...prev, uf]));
      ensureMunicipios(uf);
    }
  }

  /** "Procuro terra": checks/unchecks a município inside a checked state. */
  function toggleWantMuni(uf: string, muni: string) {
    setWantMunis((prev) => {
      const atual = prev[uf] ?? [];
      return {
        ...prev,
        [uf]: atual.includes(muni) ? atual.filter((m) => m !== muni) : [...atual, muni],
      };
    });
  }

  // States of interest in canonical UF order (stable output for the sheet).
  const wantUfsOrdenados = UFS.filter((uf) => wantUfs.includes(uf));

  // Values that go to the sheet (State / Municipality columns), pre-joined as
  // text — same flat "a; b; c" format as the existing rows, no script changes.
  const stateValue = brasilInteiro
    ? lang === "en"
      ? "Brazil"
      : "Brasil"
    : wantUfsOrdenados.join("; ");
  const municipalityValue = brasilInteiro
    ? lang === "en"
      ? "Anywhere in Brazil"
      : "Brasil inteiro"
    : wantUfsOrdenados
        .flatMap((uf) => {
          const marcados = wantMunis[uf] ?? [];
          return marcados.length > 0 ? marcados.map((m) => `${m}/${uf}`) : [x.wholeState(uf)];
        })
        .join("; ");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    setLocalError(null);
    if (role === "want" && isBrasil && !brasilInteiro && wantUfs.length === 0) {
      e.preventDefault();
      setLocalError(x.errNoRegion);
    }
  }

  const serverError = state && !state.ok ? state.error : null;

  return (
    <section id="lista-de-espera" className="bg-primary py-20">
      <div className="mx-auto max-w-xl px-6 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-accent">
          {t.waitlist.eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {t.waitlist.title}
        </h2>
        <p className="mt-3 text-base text-white/80">{t.waitlist.subtitle}</p>

        {state?.ok ? (
          <div className="mt-8 rounded-2xl bg-white px-6 py-8 text-deep shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="font-semibold">{t.waitlist.success}</p>
            </div>
            <a
              href="/quanto-vale"
              className="mt-3 inline-block text-sm font-bold text-primary underline underline-offset-4"
            >
              {x.successCta}
            </a>
          </div>
        ) : (
          <form
            action={formAction}
            onSubmit={handleSubmit}
            className="mt-8 space-y-4 rounded-2xl bg-white p-6 text-left shadow-sm sm:p-8"
          >
            <input type="hidden" name="language" value={lang} />

            <div>
              <label htmlFor="name" className="text-sm font-semibold text-deep">
                {t.waitlist.nameLabel}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder={t.waitlist.namePlaceholder}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="phone" className="text-sm font-semibold text-deep">
                {t.waitlist.phoneLabel}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder={t.waitlist.phonePlaceholder}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="country" className="text-sm font-semibold text-deep">
                {t.waitlist.countryLabel}
              </label>
              <input
                id="country"
                name="country"
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputCls}
              />
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-deep">{t.waitlist.roleLabel}</legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {(["have", "want"] as const).map((r) => (
                  <label
                    key={r}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-deep/15 px-4 py-3 text-sm font-semibold text-deep transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={() => {
                        setRole(r);
                        setLocalError(null);
                      }}
                      className="accent-primary"
                    />
                    {r === "have" ? t.waitlist.roleHave : t.waitlist.roleWant}
                  </label>
                ))}
              </div>
            </fieldset>

            {isBrasil ? (
              role === "have" ? (
                /* ---------- Tenho terra: one UF + one município (IBGE) ---------- */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="wl-uf" className="text-sm font-semibold text-deep">
                      {t.waitlist.stateLabel}
                    </label>
                    <select
                      id="wl-uf"
                      name="state"
                      required
                      value={ufSel}
                      onChange={(e) => loadMunicipios(e.target.value)}
                      className={inputCls}
                    >
                      <option value="" disabled>
                        {x.selectUf}
                      </option>
                      {UFS.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="wl-muni" className="text-sm font-semibold text-deep">
                      {t.waitlist.municipalityLabel}
                    </label>
                    {muniFailed ? (
                      <input
                        id="wl-muni"
                        name="municipality"
                        type="text"
                        required
                        value={munText}
                        onChange={(e) => setMunText(e.target.value)}
                        placeholder={t.waitlist.municipalityPlaceholder}
                        className={inputCls}
                      />
                    ) : (
                      <select
                        id="wl-muni"
                        name="municipality"
                        required
                        disabled={!ufSel || muniLoading}
                        value={munSel}
                        onChange={(e) => setMunSel(e.target.value)}
                        className={`${inputCls} disabled:opacity-60`}
                      >
                        <option value="" disabled>
                          {!ufSel ? x.selectMuniFirst : muniLoading ? x.loading : x.selectMuni}
                        </option>
                        {municipios.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ) : (
                /* ---------- Procuro terra: check states + optional municípios ---------- */
                <div>
                  <p className="text-sm font-semibold text-deep">{x.whereWant}</p>
                  <p className="mt-0.5 text-xs text-deep/50">{x.whereWantHint}</p>

                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm font-semibold text-deep">
                    <input
                      type="checkbox"
                      checked={brasilInteiro}
                      onChange={(e) => {
                        setBrasilInteiro(e.target.checked);
                        setLocalError(null);
                      }}
                      className="h-4 w-4 accent-primary"
                    />
                    {x.anywhere}
                  </label>

                  {!brasilInteiro && (
                    <>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-deep/50">
                        {x.statesLabel}
                      </p>
                      <div className="mt-1.5 grid grid-cols-5 gap-1.5 sm:grid-cols-9">
                        {UFS.map((uf) => (
                          <label
                            key={uf}
                            title={UF_NOMES[uf]}
                            className="cursor-pointer rounded-lg border border-deep/15 py-1.5 text-center text-xs font-bold text-deep transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-white has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
                          >
                            <input
                              type="checkbox"
                              checked={wantUfs.includes(uf)}
                              onChange={() => toggleWantUf(uf)}
                              className="sr-only"
                            />
                            {uf}
                          </label>
                        ))}
                      </div>

                      {wantUfsOrdenados.map((uf) => {
                        const entry = muniByUf[uf];
                        const lista = Array.isArray(entry) ? entry : [];
                        const carregando = entry === undefined;
                        const falhou = entry === "error";
                        const filtro = wantFilter[uf] ?? "";
                        const marcados = wantMunis[uf] ?? [];
                        const visiveis = filtro
                          ? lista.filter((m) => norm(m).includes(norm(filtro)))
                          : lista;
                        return (
                          <div
                            key={uf}
                            className="mt-3 rounded-xl border border-deep/15 p-3"
                          >
                            <p className="text-sm font-bold text-deep">
                              {UF_NOMES[uf]} ({uf})
                            </p>
                            <p className="mt-0.5 text-xs text-deep/50">
                              {x.muniOptional(UF_NOMES[uf] ?? uf)} — {x.noneMeansAll}
                            </p>

                            {carregando && (
                              <p className="mt-2 text-xs text-deep/50">{x.loading}</p>
                            )}

                            {falhou && (
                              <div className="mt-2">
                                <p className="text-xs text-deep/60">{x.muniError}</p>
                                <button
                                  type="button"
                                  onClick={() => ensureMunicipios(uf)}
                                  className="mt-1 text-xs font-bold text-primary underline underline-offset-2"
                                >
                                  {x.retry}
                                </button>
                              </div>
                            )}

                            {!carregando && !falhou && (
                              <>
                                <input
                                  type="text"
                                  value={filtro}
                                  onChange={(e) =>
                                    setWantFilter((prev) => ({ ...prev, [uf]: e.target.value }))
                                  }
                                  placeholder={x.searchMuni}
                                  aria-label={`${x.searchMuni} — ${UF_NOMES[uf]}`}
                                  className="mt-2 w-full rounded-lg border border-deep/15 px-3 py-2 text-sm text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none"
                                />
                                <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-deep/10">
                                  {visiveis.map((m) => (
                                    <label
                                      key={m}
                                      className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-sm text-deep transition-colors hover:bg-primary/5"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={marcados.includes(m)}
                                        onChange={() => toggleWantMuni(uf, m)}
                                        className="h-4 w-4 shrink-0 accent-primary"
                                      />
                                      {m}
                                    </label>
                                  ))}
                                </div>
                                {marcados.length > 0 && (
                                  <p className="mt-1.5 text-xs text-deep/60">
                                    <span className="font-bold">{x.checkedLabel}</span>{" "}
                                    {marcados.join(", ")}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}

                  <input type="hidden" name="state" value={stateValue} />
                  <input type="hidden" name="municipality" value={municipalityValue} />
                </div>
              )
            ) : (
              /* ---------- Outside Brazil: free-text state + city ---------- */
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="state" className="text-sm font-semibold text-deep">
                    {t.waitlist.stateLabel}
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    required
                    placeholder={t.waitlist.statePlaceholder}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="municipality" className="text-sm font-semibold text-deep">
                    {t.waitlist.municipalityLabel}
                  </label>
                  <input
                    id="municipality"
                    name="municipality"
                    type="text"
                    required
                    placeholder={t.waitlist.municipalityPlaceholder}
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="wl-purpose" className="text-sm font-semibold text-deep">
                {t.waitlist.purposeLabel}
              </label>
              <select
                id="wl-purpose"
                name="purpose"
                required
                defaultValue=""
                className={inputCls}
              >
                <option value="" disabled>
                  {t.waitlist.purposePlaceholder}
                </option>
                {t.waitlist.purposeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {(localError || serverError) && (
              <p className="text-sm font-semibold text-red-600">
                {localError ?? (serverError === "missing_fields" ? x.errMissing : t.waitlist.error)}
              </p>
            )}

            <SubmitButton label={t.waitlist.submit} pendingLabel={t.waitlist.submitting} />
          </form>
        )}
      </div>
    </section>
  );
}
