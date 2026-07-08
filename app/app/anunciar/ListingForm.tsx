"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { UFS } from "@/lib/appraisal-data";
import { createListing } from "./actions";

const inputCls =
  "mt-1.5 w-full rounded-xl border border-deep/15 bg-white px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none";

export function ListingForm() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const w = t.waitlist; // reuse purpose options
  const crops = t.appraiser.crops; // crop sub-options
  const [ufSel, setUfSel] = useState("");
  const [purposeSel, setPurposeSel] = useState("");
  const [muniByUf, setMuniByUf] = useState<Record<string, string[] | "error">>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!ufSel || muniByUf[ufSel]) return;
    let cancelled = false;
    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufSel}/municipios?orderBy=nome`,
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((list: { nome: string }[]) => {
        if (!cancelled) setMuniByUf((p) => ({ ...p, [ufSel]: list.map((m) => m.nome) }));
      })
      .catch(() => {
        if (!cancelled) setMuniByUf((p) => ({ ...p, [ufSel]: "error" }));
      });
    return () => {
      cancelled = true;
    };
  }, [ufSel, muniByUf]);

  const muniEntry = ufSel ? muniByUf[ufSel] : undefined;
  const municipalities = Array.isArray(muniEntry) ? muniEntry : [];
  const muniFailed = muniEntry === "error";

  const label = lang === "en"
    ? {
        title: "List my land",
        subtitle: "Create a listing. You can save it as a draft or publish it now.",
        listingTitle: "Listing title",
        listingTitlePh: "e.g. 128 ha with water in Rio Verde",
        state: "State",
        municipality: "Municipality",
        hectares: "Area (hectares)",
        purpose: "Intended use",
        crop: "Specific crop (optional)",
        price: "Expected price (R$/ha/year, optional)",
        description: "Description (optional)",
        descriptionPh: "Access, soil, infrastructure, distance to town…",
        water: "Has water source",
        car: "CAR number (optional)",
        saveDraft: "Save as draft",
        publish: "Publish listing",
        submitting: "Saving…",
        successTitle: "Listing saved!",
        successBody: "You can manage it from your account.",
        errGeneric: "Something went wrong. Please try again.",
        errAuth: "Please sign in first.",
        selectUf: "UF",
        selectMuni: "Select…",
        selectMuniFirst: "Pick the state first",
        selectPurpose: "Select…",
        allCrops: "All / not sure",
      }
    : {
        title: "Anunciar minha terra",
        subtitle: "Crie um anúncio. Você pode salvar como rascunho ou publicar agora.",
        listingTitle: "Título do anúncio",
        listingTitlePh: "Ex.: 128 ha com água em Rio Verde",
        state: "Estado",
        municipality: "Município",
        hectares: "Área (hectares)",
        purpose: "Finalidade de uso",
        crop: "Cultura específica (opcional)",
        price: "Preço esperado (R$/ha/ano, opcional)",
        description: "Descrição (opcional)",
        descriptionPh: "Acesso, solo, infraestrutura, distância da cidade…",
        water: "Tem água",
        car: "Número do CAR (opcional)",
        saveDraft: "Salvar rascunho",
        publish: "Publicar anúncio",
        submitting: "Salvando…",
        successTitle: "Anúncio salvo!",
        successBody: "Você pode gerenciá-lo na sua conta.",
        errGeneric: "Algo deu errado. Tente novamente.",
        errAuth: "Entre na sua conta primeiro.",
        selectUf: "UF",
        selectMuni: "Selecione…",
        selectMuniFirst: "Escolha o estado primeiro",
        selectPurpose: "Selecione…",
        allCrops: "Todas / não sei",
      };

  async function submit(publish: boolean, form: HTMLFormElement) {
    setError(null);
    setSubmitting(true);
    const fd = new FormData(form);
    fd.set("publish", publish ? "true" : "false");
    const res = await createListing(fd);
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
    } else {
      setError(res.error === "not_signed_in" ? label.errAuth : label.errGeneric);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-extrabold text-deep">{label.successTitle}</h2>
        <p className="mt-2 text-deep/60">{label.successBody}</p>
        <button
          onClick={() => router.push("/app/conta")}
          className="mt-6 rounded-full bg-primary px-6 py-3 text-base font-bold text-white hover:bg-primary-dark"
        >
          {lang === "en" ? "Go to my account" : "Ir para minha conta"}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="space-y-4 rounded-2xl border border-deep/10 bg-white p-6 shadow-sm sm:p-8"
    >
      <div>
        <label htmlFor="title" className="text-sm font-semibold text-deep">
          {label.listingTitle}
        </label>
        <input id="title" name="title" required placeholder={label.listingTitlePh} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="state" className="text-sm font-semibold text-deep">{label.state}</label>
          <select id="state" name="state" required value={ufSel} onChange={(e) => setUfSel(e.target.value)} className={inputCls}>
            <option value="" disabled>{label.selectUf}</option>
            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="municipality" className="text-sm font-semibold text-deep">{label.municipality}</label>
          {muniFailed ? (
            <input id="municipality" name="municipality" required className={inputCls} />
          ) : (
            <select id="municipality" name="municipality" required key={ufSel} defaultValue="" disabled={!ufSel} className={inputCls}>
              <option value="" disabled>{!ufSel ? label.selectMuniFirst : label.selectMuni}</option>
              {municipalities.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="hectares" className="text-sm font-semibold text-deep">{label.hectares}</label>
          <input id="hectares" name="hectares" type="number" min="1" step="any" required className={inputCls} />
        </div>
        <div>
          <label htmlFor="purpose" className="text-sm font-semibold text-deep">{label.purpose}</label>
          <select id="purpose" name="purpose" required value={purposeSel} onChange={(e) => setPurposeSel(e.target.value)} className={inputCls}>
            <option value="" disabled>{label.selectPurpose}</option>
            {w.purposeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {crops?.[purposeSel] && (
        <div>
          <label htmlFor="crop" className="text-sm font-semibold text-deep">{label.crop}</label>
          <select id="crop" name="crop" key={purposeSel} defaultValue="" className={inputCls}>
            <option value="">{label.allCrops}</option>
            {crops[purposeSel].map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="price_per_ha_year" className="text-sm font-semibold text-deep">{label.price}</label>
        <input id="price_per_ha_year" name="price_per_ha_year" type="number" min="0" step="any" className={inputCls} />
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-semibold text-deep">{label.description}</label>
        <textarea id="description" name="description" rows={3} placeholder={label.descriptionPh} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 rounded-xl border border-deep/15 px-4 py-3 text-sm font-semibold text-deep">
          <input type="checkbox" name="has_water" className="accent-primary" />
          {label.water}
        </label>
        <div>
          <input name="car_number" placeholder={label.car} className={`${inputCls} mt-0`} />
        </div>
      </div>

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={submitting}
          onClick={(e) => submit(false, e.currentTarget.form!)}
          className="flex-1 rounded-full border border-deep/20 px-6 py-3 text-base font-bold text-deep transition-colors hover:border-primary disabled:opacity-60"
        >
          {submitting ? label.submitting : label.saveDraft}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={(e) => submit(true, e.currentTarget.form!)}
          className="flex-1 rounded-full bg-primary px-6 py-3 text-base font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? label.submitting : label.publish}
        </button>
      </div>
    </form>
  );
}
