"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Droplet, Search } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { UFS } from "@/lib/appraisal-data";
import { browseListings, type BrowseListing } from "./actions";

const inputCls =
  "w-full rounded-xl border border-deep/15 bg-white px-4 py-2.5 text-deep focus:border-primary focus:outline-none";

export function Marketplace() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [listings, setListings] = useState<BrowseListing[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState("");
  const [purpose, setPurpose] = useState("");
  const [minHa, setMinHa] = useState("");

  const label =
    lang === "en"
      ? { title: "Explore land", subtitle: "Idle land available to lease.", state: "State", purpose: "Use", minHa: "Min. hectares", all: "All", search: "Search", empty: "No listings match your filters yet.", perYear: "/ha/yr", water: "Water" }
      : { title: "Explorar terras", subtitle: "Terras paradas disponíveis para arrendar.", state: "Estado", purpose: "Uso", minHa: "Hectares mín.", all: "Todos", search: "Buscar", empty: "Nenhum anúncio corresponde aos filtros ainda.", perYear: "/ha/ano", water: "Água" };

  function load() {
    setLoading(true);
    browseListings({
      state: state || undefined,
      purpose: purpose || undefined,
      minHectares: minHa ? Number(minHa) : undefined,
    }).then((res) => {
      if (res.ok) setListings(res.listings);
      setLoading(false);
    });
  }

  useEffect(() => {
    queueMicrotask(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const purposeLabel = (v: string) =>
    t.waitlist.purposeOptions.find((o) => o.value === v)?.label ?? v;

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-deep">{label.title}</h1>
      <p className="mt-2 text-deep/60">{label.subtitle}</p>

      <div className="mt-6 grid gap-3 rounded-2xl border border-deep/10 bg-white p-4 shadow-sm sm:grid-cols-4">
        <select value={state} onChange={(e) => setState(e.target.value)} className={inputCls}>
          <option value="">{label.state}: {label.all}</option>
          {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
        </select>
        <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputCls}>
          <option value="">{label.purpose}: {label.all}</option>
          {t.waitlist.purposeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input type="number" min="0" value={minHa} onChange={(e) => setMinHa(e.target.value)} placeholder={label.minHa} className={inputCls} />
        <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark">
          <Search className="h-4 w-4" aria-hidden="true" />
          {label.search}
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="py-10 text-center text-deep/40">…</p>
        ) : !listings || listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-deep/20 bg-white p-10 text-center text-deep/60 shadow-sm">
            {label.empty}
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {listings.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => router.push(`/app/imovel/${l.id}`)}
                  className="w-full rounded-2xl border border-deep/10 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-extrabold text-deep">{l.title}</h3>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      {l.hectares} ha
                    </span>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-sm text-deep/60">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {l.municipality}, {l.state}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-deep/80">{purposeLabel(l.purpose)}</p>
                  <div className="mt-3 flex items-center gap-3 text-sm">
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
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
