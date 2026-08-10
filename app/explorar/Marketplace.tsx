"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { CheckCircle2, Droplet, Image as ImageIcon, MapPin, Search } from "lucide-react";
import { useLanguage, type AppLang } from "@/lib/language-context";
import { UFS } from "@/lib/appraisal-data";
import { getSupabase } from "@/lib/supabase";
import { listingPath } from "@/lib/listing-slug";
import { sortOptionsByLabel } from "@/lib/sort-options";
import { browseListings, type BrowseListing } from "./actions";
import { registerRegionInterest } from "./interest-actions";

const inputCls =
  "w-full rounded-xl border border-deep/15 bg-white px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-neutral/60 disabled:text-deep/40";

/** Data curta na convenção do idioma (29/07/2026 em pt-BR, 07/29/2026 em en-US). */
function shortDate(iso: string | null, lang: AppLang): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(lang === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Confiança do CAR no card público. Três estados, e só UM deles é selo:
 *   • verified → selo forte ("CAR ativo no SICAR"), com a data da conferência
 *     logo abaixo quando ela existe. Selo sem lastro é afirmação vazia; se
 *     `car_checked_at` vier nulo, mostramos o selo e nenhuma data inventada.
 *   • car_declarado → NINGUÉM conferiu. Texto apagado, sem fundo, sem borda,
 *     sem ícone e sem negrito: de relance não pode ser lido como selo.
 *   • nenhum dos dois → não renderiza nada. Página pública NUNCA tem selo
 *     negativo: a plataforma não acusa ninguém.
 */
function CarTrust({
  verified,
  declared,
  checkedAt,
  lang,
}: {
  verified: boolean;
  declared: boolean;
  checkedAt: string | null;
  lang: AppLang;
}) {
  const date = shortDate(checkedAt, lang);
  const copy =
    lang === "en"
      ? {
          active: "CAR active in SICAR",
          checkedOn: (d: string) => `Checked on ${d}`,
          declared: "CAR declared by the owner",
        }
      : {
          active: "CAR ativo no SICAR",
          checkedOn: (d: string) => `Conferido em ${d}`,
          declared: "CAR declarado pelo proprietário",
        };

  if (verified) {
    return (
      <div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          {copy.active}
        </span>
        {date && <p className="mt-1 text-xs text-deep/50">{copy.checkedOn(date)}</p>}
      </div>
    );
  }

  if (declared) return <p className="text-xs text-deep/60">{copy.declared}</p>;

  return null;
}

type FilterValues = {
  uf: string;
  muni: string;
  purpose: string;
  minHa: string;
  maxHa: string;
};

export function Marketplace({ initialUf = "" }: { initialUf?: string }) {
  const { t, lang } = useLanguage();
  const [listings, setListings] = useState<BrowseListing[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [uf, setUf] = useState(initialUf);
  const [muni, setMuni] = useState("");
  const [purpose, setPurpose] = useState("");
  const [minHa, setMinHa] = useState("");
  const [maxHa, setMaxHa] = useState("");
  const [muniByUf, setMuniByUf] = useState<Record<string, string[] | "error">>({});
  // Filtros da ÚLTIMA busca efetivamente aplicada. Os states do formulário
  // acima podem divergir (o usuário mexe nos selects sem clicar em Filtrar);
  // o registro de interesse usa SEMPRE o que foi buscado de fato.
  const [lastApplied, setLastApplied] = useState<FilterValues | null>(null);
  const [interest, setInterest] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  // undefined = ainda carregando a sessão; null = deslogado.
  const [sessionUser, setSessionUser] = useState<User | null | undefined>(undefined);

  const label =
    lang === "en"
      ? {
          title: "Explore land",
          subtitle: "Idle land available to lease.",
          state: "State",
          municipality: "Municipality",
          purpose: "Purpose",
          minHa: "Min. hectares",
          maxHa: "Max. hectares",
          all: "All",
          allF: "All",
          selectMuniFirst: "Pick the state first",
          filter: "Filter",
          clear: "Clear",
          emptyTitle: "No land found with these filters",
          emptyBody: "Try widening the search or clear the filters to see everything.",
          clearFilters: "Clear filters",
          resultOne: "1 plot",
          resultMany: "plots",
          photoSoon: "Photo coming soon",
          photoAlt: (title: string) => `Photo of ${title}`,
          perYear: "/ha/yr",
          water: "Water",
          loading: "Loading listings…",
          interestTitle: "Want a heads-up when land like this arrives?",
          interestCta: "Notify me when it appears",
          interestDone:
            "Noted. We will let you know when land like this shows up in your region.",
          interestError:
            "We could not register your interest right now. Please try again later.",
          interestSignIn: "Sign in to get notified",
        }
      : {
          title: "Explorar terras",
          subtitle: "Terras paradas disponíveis para arrendar.",
          state: "Estado",
          municipality: "Município",
          purpose: "Finalidade",
          minHa: "Hectares mín.",
          maxHa: "Hectares máx.",
          all: "Todos",
          allF: "Todas",
          selectMuniFirst: "Escolha o estado primeiro",
          filter: "Filtrar",
          clear: "Limpar",
          emptyTitle: "Nenhuma terra encontrada com esses filtros",
          emptyBody: "Tente ampliar a busca ou limpe os filtros para ver tudo.",
          clearFilters: "Limpar filtros",
          resultOne: "1 terra",
          resultMany: "terras",
          photoSoon: "Foto em breve",
          photoAlt: (title: string) => `Foto de ${title}`,
          perYear: "/ha/ano",
          water: "Água",
          loading: "Carregando anúncios…",
          interestTitle: "Quer ser avisado quando entrar terra assim?",
          interestCta: "Avisar quando aparecer",
          interestDone:
            "Anotado. Avisamos quando aparecer terra assim na sua região.",
          interestError:
            "Não foi possível registrar agora. Tente de novo mais tarde.",
          interestSignIn: "Entrar para ser avisado",
        };

  // Same IBGE municipality pattern used by ListingForm: fetch once per UF,
  // cache the list, fall back to free text if the API fails.
  useEffect(() => {
    if (!uf || muniByUf[uf]) return;
    let cancelled = false;
    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((list: { nome: string }[]) => {
        if (!cancelled) setMuniByUf((p) => ({ ...p, [uf]: list.map((m) => m.nome) }));
      })
      .catch(() => {
        if (!cancelled) setMuniByUf((p) => ({ ...p, [uf]: "error" }));
      });
    return () => {
      cancelled = true;
    };
  }, [uf, muniByUf]);

  const muniEntry = uf ? muniByUf[uf] : undefined;
  const municipalities = Array.isArray(muniEntry) ? muniEntry : [];
  const muniFailed = muniEntry === "error";

  // Sessão do navegador, no mesmo padrão do AccountDashboard: lazy, com
  // queueMicrotask no caminho síncrono (regra react-hooks/set-state-in-effect).
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      queueMicrotask(() => setSessionUser(null));
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSessionUser(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSessionUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  function load(f: FilterValues) {
    setLoading(true);
    // Cada busca nova zera o sub-bloco de interesse e grava os filtros que
    // REALMENTE foram aplicados (o formulário pode divergir depois).
    setLastApplied(f);
    setInterest("idle");
    browseListings({
      state: f.uf || undefined,
      municipality: f.muni || undefined,
      purpose: f.purpose || undefined,
      minHectares: f.minHa ? Number(f.minHa) : undefined,
      maxHectares: f.maxHa ? Number(f.maxHa) : undefined,
    }).then((res) => {
      if (res.ok) setListings(res.listings);
      setLoading(false);
    });
  }

  // Primeira carga já respeita o ?uf= vindo da calculadora ("Ver terras
  // disponíveis na sua região").
  useEffect(() => {
    queueMicrotask(() =>
      load({ uf: initialUf, muni: "", purpose: "", minHa: "", maxHa: "" }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem
  }, []);

  function applyFilters() {
    load({ uf, muni, purpose, minHa, maxHa });
  }

  function clearFilters() {
    setUf("");
    setMuni("");
    setPurpose("");
    setMinHa("");
    setMaxHa("");
    load({ uf: "", muni: "", purpose: "", minHa: "", maxHa: "" });
  }

  function submitInterest() {
    if (!lastApplied?.uf || interest === "sending") return;
    setInterest("sending");
    registerRegionInterest({
      state: lastApplied.uf,
      municipality: lastApplied.muni || null,
      purpose: lastApplied.purpose || null,
    }).then((res) => {
      if (res.ok) {
        setInterest("done");
      } else if (res.error === "not_signed_in") {
        // Sessão expirou entre o carregamento e o clique: troca para o CTA
        // de entrar em vez de mostrar um erro genérico.
        setSessionUser(null);
        setInterest("idle");
      } else {
        setInterest("error");
      }
    });
  }

  const purposeLabel = (v: string) =>
    t.waitlist.purposeOptions.find((o) => o.value === v)?.label ?? v;

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-deep">{label.title}</h1>
      <p className="mt-2 text-deep/60">{label.subtitle}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters();
        }}
        className="mt-6 rounded-2xl border border-deep/10 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="filter-uf" className="text-sm font-semibold text-deep">
              {label.state}
            </label>
            <select
              id="filter-uf"
              value={uf}
              onChange={(e) => {
                setUf(e.target.value);
                setMuni("");
              }}
              className={`mt-1.5 ${inputCls}`}
            >
              <option value="">{label.all}</option>
              {UFS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-muni" className="text-sm font-semibold text-deep">
              {label.municipality}
            </label>
            {muniFailed ? (
              <input
                id="filter-muni"
                value={muni}
                onChange={(e) => setMuni(e.target.value)}
                placeholder={label.municipality}
                className={`mt-1.5 ${inputCls}`}
              />
            ) : (
              <select
                id="filter-muni"
                value={muni}
                onChange={(e) => setMuni(e.target.value)}
                disabled={!uf}
                className={`mt-1.5 ${inputCls}`}
              >
                <option value="">{!uf ? label.selectMuniFirst : label.all}</option>
                {municipalities.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="filter-purpose" className="text-sm font-semibold text-deep">
              {label.purpose}
            </label>
            <select
              id="filter-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className={`mt-1.5 ${inputCls}`}
            >
              <option value="">{label.allF}</option>
              {sortOptionsByLabel(t.waitlist.purposeOptions).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="filter-min-ha" className="text-sm font-semibold text-deep">
                {label.minHa}
              </label>
              <input
                id="filter-min-ha"
                type="number"
                min="0"
                step="any"
                value={minHa}
                onChange={(e) => setMinHa(e.target.value)}
                placeholder="0"
                className={`mt-1.5 ${inputCls}`}
              />
            </div>
            <div>
              <label htmlFor="filter-max-ha" className="text-sm font-semibold text-deep">
                {label.maxHa}
              </label>
              <input
                id="filter-max-ha"
                type="number"
                min="0"
                step="any"
                value={maxHa}
                onChange={(e) => setMaxHa(e.target.value)}
                placeholder="—"
                className={`mt-1.5 ${inputCls}`}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            {label.filter}
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full border border-deep/20 px-6 py-3.5 text-base font-bold text-deep transition-colors hover:border-primary"
          >
            {label.clear}
          </button>
        </div>
      </form>

      <div className="mt-8">
        {loading ? (
          <p className="py-10 text-center text-deep/50">{label.loading}</p>
        ) : !listings || listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-deep/20 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-extrabold text-deep">{label.emptyTitle}</p>
            <p className="mt-2 text-deep/60">{label.emptyBody}</p>
            <button
              onClick={clearFilters}
              className="mt-6 rounded-full bg-accent px-6 py-3.5 text-base font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark"
            >
              {label.clearFilters}
            </button>
            {/* Interesse por região: só quando a ÚLTIMA busca aplicada tinha
                UF (interesse por região exige região). */}
            {lastApplied?.uf && (
              <div className="mx-auto mt-8 max-w-md border-t border-deep/10 pt-6">
                <p className="text-sm font-semibold text-deep">{label.interestTitle}</p>
                {interest === "done" ? (
                  <p className="mt-3 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
                    {label.interestDone}
                  </p>
                ) : sessionUser === null ? (
                  <Link
                    href="/entrar"
                    className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
                  >
                    {label.interestSignIn}
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={submitInterest}
                      disabled={interest === "sending"}
                      className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed"
                    >
                      {label.interestCta}
                    </button>
                    {interest === "error" && (
                      <p className="mt-2 text-sm text-deep/60">{label.interestError}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              {listings.length === 1
                ? label.resultOne
                : `${listings.length} ${label.resultMany}`}
            </p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <li key={l.id}>
                  <Link
                    href={listingPath(l)}
                    className="block w-full overflow-hidden rounded-2xl border border-deep/10 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {l.photos.length > 0 ? (
                      <div className="relative h-40 bg-neutral">
                        {/* eslint-disable-next-line @next/next/no-img-element -- fotos vêm do storage do Supabase (host externo) */}
                        <img
                          src={l.photos[0]}
                          alt={label.photoAlt(l.title)}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-neutral">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-deep/50 shadow-sm">
                          <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          {label.photoSoon}
                        </span>
                      </div>
                    )}
                    <div className="space-y-2 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-extrabold text-deep">{l.title}</h3>
                        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                          {l.hectares.toLocaleString(lang === "en" ? "en-US" : "pt-BR")} ha
                        </span>
                      </div>
                      <p className="flex items-center gap-1 text-sm text-deep/60">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {l.municipality}, {l.state}
                      </p>
                      <p className="text-sm font-semibold text-deep/70">
                        {purposeLabel(l.purpose)}
                      </p>
                      <CarTrust
                        verified={l.verified}
                        declared={l.car_declarado}
                        checkedAt={l.car_checked_at}
                        lang={lang}
                      />
                      {(l.price_per_ha_year || l.has_water) && (
                        <div className="flex items-center gap-3 pt-1 text-sm">
                          {l.price_per_ha_year && (
                            <span className="font-bold text-deep">
                              R$ {l.price_per_ha_year.toLocaleString("pt-BR")}
                              <span className="font-normal text-deep/50">{label.perYear}</span>
                            </span>
                          )}
                          {l.has_water && (
                            <span className="inline-flex items-center gap-1 text-primary">
                              <Droplet className="h-3.5 w-3.5" aria-hidden="true" />
                              {label.water}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
