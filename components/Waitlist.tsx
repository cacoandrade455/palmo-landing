"use client";

import { useEffect, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Plus, X } from "lucide-react";
import { submitWaitlist, type WaitlistResult } from "@/app/actions";
import { useLanguage } from "@/lib/language-context";

const initialState: WaitlistResult | null = null;

const inputCls =
  "mt-1.5 w-full rounded-xl border border-deep/15 bg-white px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

/** Brazilian states — full name shown to the user, sigla sent to the sheet. */
const UF_OPTIONS: { sigla: string; nome: string }[] = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

/** muni === "" means "the whole state". */
type Region = { uf: string; muni: string };

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
  const [country, setCountry] = useState<string | null>(null);
  // Single location (Tenho terra)
  const [uf, setUf] = useState("");
  const [muni, setMuni] = useState("");
  // Region picker + chips (Procuro terra)
  const [selUf, setSelUf] = useState("");
  const [selMuni, setSelMuni] = useState("");
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionError, setRegionError] = useState(false);
  // per-UF municipality cache: string[] = loaded; "error" = IBGE unavailable
  const [muniByUf, setMuniByUf] = useState<Record<string, string[] | "error">>({});

  const countryValue = country ?? (lang === "en" ? "Brazil" : "Brasil");
  const isBrazil = ["brasil", "brazil"].includes(
    countryValue
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""),
  );

  const activeUf = role === "have" ? uf : selUf;

  useEffect(() => {
    if (!isBrazil || !activeUf || muniByUf[activeUf]) return;
    let cancelled = false;
    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${activeUf}/municipios?orderBy=nome`,
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((list: { nome: string }[]) => {
        if (!cancelled)
          setMuniByUf((p) => ({ ...p, [activeUf]: list.map((m) => m.nome) }));
      })
      .catch(() => {
        if (!cancelled) setMuniByUf((p) => ({ ...p, [activeUf]: "error" }));
      });
    return () => {
      cancelled = true;
    };
  }, [activeUf, muniByUf, isBrazil]);

  const muniEntry = activeUf ? muniByUf[activeUf] : undefined;
  const municipalities = Array.isArray(muniEntry) ? muniEntry : [];
  const muniFailed = muniEntry === "error";
  const muniLoading = isBrazil && !!activeUf && muniEntry === undefined;

  const x =
    lang === "en"
      ? {
          selectState: "Select the state...",
          muniFirst: "Pick the state first",
          muniLoading: "Loading municipalities...",
          selectMuni: "Select the municipality...",
          typeMuni: "Type the municipality",
          wholeState: "Whole state",
          whereLooking: "Where are you looking for land?",
          multiHint: "You can add more than one region.",
          addRegion: "Add another region",
          removeRegion: "Remove",
          needRegion: "Add at least one region (pick a state).",
        }
      : {
          selectState: "Selecione o estado...",
          muniFirst: "Escolha o estado primeiro",
          muniLoading: "Carregando municípios...",
          selectMuni: "Selecione o município...",
          typeMuni: "Digite o município",
          wholeState: "Todo o estado",
          whereLooking: "Onde você procura terra?",
          multiHint: "Você pode adicionar mais de uma região.",
          addRegion: "Adicionar outra região",
          removeRegion: "Remover",
          needRegion: "Adicione pelo menos uma região (escolha um estado).",
        };

  function regionLabel(r: Region) {
    return r.muni ? `${r.muni}/${r.uf}` : `${x.wholeState}/${r.uf}`;
  }
  function sameRegion(a: Region, b: Region) {
    return a.uf === b.uf && a.muni === b.muni;
  }
  function addRegion() {
    if (!selUf) return;
    const r: Region = { uf: selUf, muni: selMuni };
    setRegions((prev) => (prev.some((p) => sameRegion(p, r)) ? prev : [...prev, r]));
    setSelUf("");
    setSelMuni("");
    setRegionError(false);
  }
  function removeRegion(r: Region) {
    setRegions((prev) => prev.filter((p) => !sameRegion(p, r)));
  }

  // Regions actually submitted: the added chips + whatever is currently in
  // the picker (so choosing BA/Salvador and hitting submit without clicking
  // "Adicionar" still counts).
  const pending: Region[] = selUf ? [{ uf: selUf, muni: selMuni }] : [];
  const effectiveRegions = [
    ...regions,
    ...pending.filter((p) => !regions.some((r) => sameRegion(r, p))),
  ];
  const wantState = [...new Set(effectiveRegions.map((r) => r.uf))].join(", ");
  const wantMunicipality = effectiveRegions.map(regionLabel).join("; ");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (isBrazil && role === "want" && effectiveRegions.length === 0) {
      e.preventDefault();
      setRegionError(true);
    }
  }

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
          <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-8 text-deep shadow-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="font-semibold">{t.waitlist.success}</p>
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

            {/* The role comes BEFORE the location now — the location fields
                change shape depending on this choice. */}
            <fieldset>
              <legend className="text-sm font-semibold text-deep">
                {t.waitlist.roleLabel}
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-deep/15 px-4 py-3 text-sm font-semibold text-deep transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                  <input
                    type="radio"
                    name="role"
                    value="have"
                    checked={role === "have"}
                    onChange={() => setRole("have")}
                    className="accent-primary"
                  />
                  {t.waitlist.roleHave}
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-deep/15 px-4 py-3 text-sm font-semibold text-deep transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                  <input
                    type="radio"
                    name="role"
                    value="want"
                    checked={role === "want"}
                    onChange={() => setRole("want")}
                    className="accent-primary"
                  />
                  {t.waitlist.roleWant}
                </label>
              </div>
            </fieldset>

            <div>
              <label htmlFor="country" className="text-sm font-semibold text-deep">
                {t.waitlist.countryLabel}
              </label>
              <input
                id="country"
                name="country"
                type="text"
                required
                value={countryValue}
                onChange={(e) => setCountry(e.target.value)}
                className={inputCls}
              />
            </div>

            {!isBrazil ? (
              /* Outside Brazil: free-text region, same as before */
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
                  <label
                    htmlFor="municipality"
                    className="text-sm font-semibold text-deep"
                  >
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
            ) : role === "have" ? (
              /* Tenho terra: one state + one municipality (IBGE dropdowns) */
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="state" className="text-sm font-semibold text-deep">
                    {t.waitlist.stateLabel}
                  </label>
                  <select
                    id="state"
                    name="state"
                    required
                    value={uf}
                    onChange={(e) => {
                      setUf(e.target.value);
                      setMuni("");
                    }}
                    className={inputCls}
                  >
                    <option value="" disabled>
                      {x.selectState}
                    </option>
                    {UF_OPTIONS.map((o) => (
                      <option key={o.sigla} value={o.sigla}>
                        {o.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="municipality"
                    className="text-sm font-semibold text-deep"
                  >
                    {t.waitlist.municipalityLabel}
                  </label>
                  {muniFailed ? (
                    <input
                      id="municipality"
                      name="municipality"
                      type="text"
                      required
                      placeholder={x.typeMuni}
                      className={inputCls}
                    />
                  ) : (
                    <select
                      id="municipality"
                      name="municipality"
                      required
                      disabled={!uf || muniLoading}
                      value={muni}
                      onChange={(e) => setMuni(e.target.value)}
                      className={inputCls}
                    >
                      <option value="" disabled>
                        {!uf ? x.muniFirst : muniLoading ? x.muniLoading : x.selectMuni}
                      </option>
                      {municipalities.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ) : (
              /* Procuro terra: multiple regions via picker + chips */
              <div>
                <p className="text-sm font-semibold text-deep">{x.whereLooking}</p>
                <p className="mt-0.5 text-xs text-deep/50">{x.multiHint}</p>

                {regions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {regions.map((r) => (
                      <span
                        key={`${r.uf}|${r.muni}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-deep"
                      >
                        {regionLabel(r)}
                        <button
                          type="button"
                          onClick={() => removeRegion(r)}
                          aria-label={`${x.removeRegion} ${regionLabel(r)}`}
                          className="text-deep/50 transition-colors hover:text-deep"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2 grid grid-cols-2 gap-3">
                  <select
                    aria-label={t.waitlist.stateLabel}
                    value={selUf}
                    onChange={(e) => {
                      setSelUf(e.target.value);
                      setSelMuni("");
                      setRegionError(false);
                    }}
                    className={inputCls}
                  >
                    <option value="" disabled>
                      {x.selectState}
                    </option>
                    {UF_OPTIONS.map((o) => (
                      <option key={o.sigla} value={o.sigla}>
                        {o.nome}
                      </option>
                    ))}
                  </select>
                  {muniFailed ? (
                    <input
                      aria-label={t.waitlist.municipalityLabel}
                      type="text"
                      value={selMuni}
                      onChange={(e) => setSelMuni(e.target.value)}
                      placeholder={x.typeMuni}
                      className={inputCls}
                    />
                  ) : (
                    <select
                      aria-label={t.waitlist.municipalityLabel}
                      disabled={!selUf || muniLoading}
                      value={selMuni}
                      onChange={(e) => setSelMuni(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">
                        {!selUf ? x.muniFirst : muniLoading ? x.muniLoading : x.wholeState}
                      </option>
                      {municipalities.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  type="button"
                  onClick={addRegion}
                  disabled={!selUf}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/40 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {x.addRegion}
                </button>

                {regionError && (
                  <p className="mt-2 text-sm font-semibold text-red-600">
                    {x.needRegion}
                  </p>
                )}

                <input type="hidden" name="state" value={wantState} />
                <input type="hidden" name="municipality" value={wantMunicipality} />
              </div>
            )}

            {state && !state.ok && (
              <p className="text-sm font-semibold text-red-600">{t.waitlist.error}</p>
            )}

            <SubmitButton label={t.waitlist.submit} pendingLabel={t.waitlist.submitting} />
          </form>
        )}
      </div>
    </section>
  );
}
