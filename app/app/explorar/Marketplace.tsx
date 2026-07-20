"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Droplet, Image as ImageIcon, MapPin, Search } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { UFS } from "@/lib/appraisal-data";
import { browseListings, type BrowseListing } from "./actions";

const inputCls =
  "w-full rounded-xl border border-deep/15 bg-white px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-neutral/60 disabled:text-deep/40";

type FilterValues = {
  uf: string;
  muni: string;
  purpose: string;
  minHa: string;
  maxHa: string;
};

const EMPTY_FILTERS: FilterValues = { uf: "", muni: "", purpose: "", minHa: "", maxHa: "" };

export function Marketplace() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [listings, setListings] = useState<BrowseListing[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [uf, setUf] = useState("");
  const [muni, setMuni] = useState("");
  const [purpose, setPurpose] = useState("");
  const [minHa, setMinHa] = useState("");
  const [maxHa, setMaxHa] = useState("");
  const [muniByUf, setMuniByUf] = useState<Record<string, string[] | "error">>({});

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
          perYear: "/ha/yr",
          water: "Water",
          loading: "Loading listings…",
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
          perYear: "/ha/ano",
          water: "Água",
          loading: "Carregando anúncios…",
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

  function load(f: FilterValues) {
    setLoading(true);
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

  useEffect(() => {
    queueMicrotask(() => load(EMPTY_FILTERS));
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
    load(EMPTY_FILTERS);
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
              {t.waitlist.purposeOptions.map((o) => (
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
                  <button
                    onClick={() => router.push(`/app/imovel/${l.id}`)}
                    className="w-full overflow-hidden rounded-2xl border border-deep/10 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex h-40 items-center justify-center bg-neutral">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-deep/50 shadow-sm">
                        <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {label.photoSoon}
                      </span>
                    </div>
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
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
