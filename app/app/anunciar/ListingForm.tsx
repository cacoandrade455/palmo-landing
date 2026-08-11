"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useLanguage } from "@/lib/language-context";
import { getSupabase } from "@/lib/supabase";
import { UFS, estimateLease, formatBRL } from "@/lib/appraisal-data";
import { pricesUpdatedLabel } from "@/lib/prices";
import { PURPOSE_OPEN } from "@/lib/purpose-open";
import { sortOptionsByLabel } from "@/lib/sort-options";
import { createListing, verificarCarDoAnuncio } from "./actions";
import { acceptListingTerms } from "@/app/app/legal-actions";
import { CAR_FORMATO_EXEMPLO, parseCar } from "@/lib/car-checks";
import { CampoDeArea } from "@/components/CampoDeArea";
import { PhotoPicker } from "./PhotoPicker";
import { enviarFotos, novoEstado, type EstadoUpload } from "./upload-client";
import { useMunicipios } from "./use-municipios";

const inputCls =
  "mt-1.5 w-full rounded-xl border border-deep/15 bg-white px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none";

/** Optional pre-fill coming from the /quanto-vale calculator bridge. */
export type ListingPrefill = {
  uf?: string;
  municipality?: string;
  hectares?: string;
  purpose?: string;
  crop?: string;
  variant?: string;
  suggested?: string;
};

export function ListingForm({ prefill }: { prefill?: ListingPrefill }) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const w = t.waitlist; // reuse purpose options
  const crops = t.appraiser.crops; // crop sub-options
  const variants = t.appraiser.cropVariants; // variety sub-options (cafe/uva/banana)
  const [ufSel, setUfSel] = useState(() =>
    prefill?.uf && UFS.includes(prefill.uf) ? prefill.uf : "",
  );
  const [purposeSel, setPurposeSel] = useState(() =>
    prefill?.purpose && w.purposeOptions.some((o) => o.value === prefill.purpose)
      ? prefill.purpose
      : "",
  );
  const [cropSel, setCropSel] = useState(() =>
    prefill?.purpose &&
    prefill?.crop &&
    w.purposeOptions.some((o) => o.value === prefill.purpose) &&
    (crops?.[prefill.purpose] ?? []).some((c) => c.value === prefill.crop)
      ? prefill.crop
      : "",
  );
  const [muniSel, setMuniSel] = useState("");
  // A.1 — preço "Aberto a propostas". Nasce desmarcado sempre (inclusive quando
  // a ponte da calculadora traz um sugerido: nesse caso o campo já vem cheio).
  const [openPrice, setOpenPrice] = useState(false);
  // Preço controlado para o toggle poder esvaziar/restaurar o campo. O name
  // continua `price_per_ha_year`; desabilitado, ele fica fora do FormData e a
  // action grava null (comportamento já existente da action).
  const [priceVal, setPriceVal] = useState(prefill?.suggested ?? "");
  // Municipality can only be selected once the IBGE list for the UF arrives,
  // so the prefill waits for the fetch and is applied exactly once.
  const pendingMuniRef = useRef(prefill?.municipality ?? "");
  // O hook guarda o CÓDIGO IBGE junto com o nome. O `<select>` continua
  // exibindo e casando por NOME (é o que o prefill da calculadora conhece), mas
  // o código vai no FormData para a checagem do CAR poder existir.
  const { municipios: municipalities, falhou: muniFailed, entry: muniEntry, codigoDe } =
    useMunicipios(ufSel);
  const [submitting, setSubmitting] = useState(false);
  // C.2 — sem esta confirmação o anúncio não é publicado (rascunho pode).
  const [acceptedFee, setAcceptedFee] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // CAR controlado, para dar retorno de formato enquanto a pessoa digita.
  const [carRaw, setCarRaw] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [estadosFoto, setEstadosFoto] = useState<EstadoUpload[]>([]);

  // Só avisa quando já dá para julgar: 43 é o comprimento do CAR canônico, e
  // reclamar de formato no terceiro caractere digitado seria hostilidade.
  const carLimpo = carRaw.trim();
  const carNaoReconhecido = carLimpo.length >= 40 && parseCar(carLimpo) === null;
  // undefined = still checking; null = signed out; User = signed in
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const supabaseReady = !!getSupabase();
  const authChecked = !supabaseReady || user !== undefined;

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const target = pendingMuniRef.current;
    const loaded = Array.isArray(muniEntry) ? muniEntry : [];
    if (!target || loaded.length === 0) return;
    pendingMuniRef.current = "";
    // Casa por NOME de propósito: é o único dado que a ponte da calculadora
    // carrega. Trocar isto por comparação de id quebraria o prefill em silêncio.
    if (loaded.some((m) => m.nome === target)) {
      queueMicrotask(() => setMuniSel(target));
    }
  }, [muniEntry]);

  // Código IBGE do município escolhido, derivado — não é estado novo, então não
  // há setState em efeito para a regra do ESLint reclamar.
  const muniIbge = codigoDe(muniSel);

  const label = lang === "en"
    ? {
        title: "List my land",
        subtitle: "Create a listing. You can save it as a draft or publish it now.",
        listingTitle: "Listing title",
        listingTitlePh: "e.g. 128 ha with water in Rio Verde",
        state: "State",
        municipality: "Municipality",
        hectares: "Area",
        purpose: "Intended use",
        crop: "Specific crop (optional)",
        variety: "Variety (optional)",
        varietyAll: "All / not sure",
        price: "Expected price (R$/ha/year, optional)",
        priceSuggested:
          "Suggested by the Palmo calculator (official sources). Adjust as you like.",
        priceOpen: "Open to proposals",
        priceOpenHint:
          "Let producers propose the value. The real price is set by the proposal.",
        purposeOpen: "Open to proposals (producers propose the use)",
        rangeInfo: (use: string, min: string, max: string) =>
          `In your region, land for ${use} usually earns between ${min} and ${max} per hectare per year (public market sources, updated ${pricesUpdatedLabel("en")}).`,
        description: "Description (optional)",
        descriptionPh: "Access, soil, infrastructure, distance to town…",
        water: "Has water source",
        car: "CAR number (optional)",
        // Antes: "Listings with a CAR earn the Verified badge". Era falso — o
        // selo vinha de o campo não estar vazio, então "123" bastava. Agora o
        // selo só nasce de confirmação na base do SICAR, e a copy diz isso.
        carHint:
          "We check it against the official SICAR database. If the property comes back active, your listing gets the “CAR active on SICAR” badge.",
        carUnknown: "We don't recognise this format.",
        carExpected: "Have another look. It should look like",
        matricula: "Property record at the CRI (optional)",
        matriculaHint:
          "The Palmo standard contract requires the land registry (CRI) record number. You can also fill it in later, in the draft.",
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
        feeConsent:
          "By publishing, you agree to the Terms, including the 5% success fee on the total contract value, owed by the landowner, charged proportionally with each annual payment.",
        feeConsentLink: "Read the fee clause",
      }
    : {
        title: "Anunciar minha terra",
        subtitle: "Crie um anúncio. Você pode salvar como rascunho ou publicar agora.",
        listingTitle: "Título do anúncio",
        listingTitlePh: "Ex.: 128 ha com água em Rio Verde",
        state: "Estado",
        municipality: "Município",
        hectares: "Área",
        purpose: "Finalidade de uso",
        crop: "Cultura específica (opcional)",
        variety: "Variedade (opcional)",
        varietyAll: "Todas / não sei",
        price: "Preço esperado (R$/ha/ano, opcional)",
        priceSuggested:
          "Sugerido pela calculadora Palmo (fontes oficiais). Ajuste como quiser.",
        priceOpen: "Aberto a propostas",
        priceOpenHint:
          "Deixe que os produtores proponham o valor. Quem define o preço de verdade é a proposta.",
        purposeOpen: "Aberta a propostas (produtores propõem o uso)",
        rangeInfo: (use: string, min: string, max: string) =>
          `Na sua região, terras para ${use} costumam render entre ${min} e ${max} por hectare por ano (fontes públicas de mercado, atualizadas em ${pricesUpdatedLabel("pt")}).`,
        description: "Descrição (opcional)",
        descriptionPh: "Acesso, solo, infraestrutura, distância da cidade…",
        water: "Tem água",
        car: "Número do CAR (opcional)",
        // Antes: "Anúncios com CAR ganham o selo Verificado". Era falso — o selo
        // vinha de o campo não estar vazio, então "123" bastava. Agora o selo só
        // nasce de confirmação na base do SICAR, e a copy diz isso.
        carHint:
          "A gente confere na base oficial do SICAR. Se o imóvel voltar como ativo, seu anúncio recebe o selo “CAR ativo no SICAR”.",
        carUnknown: "Não reconhecemos esse formato.",
        carExpected: "Dá uma conferida. Ele costuma ser assim:",
        matricula: "Matrícula do imóvel no CRI (opcional)",
        matriculaHint:
          "O contrato padrão Palmo exige a matrícula do Cartório de Registro de Imóveis. Dá para preencher depois, na minuta.",
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
        feeConsent:
          "Ao publicar, você concorda com os Termos, incluindo a Taxa de 5% sobre o valor total do contrato, devida pelo proprietário, cobrada proporcionalmente a cada pagamento anual.",
        feeConsentLink: "Ler a cláusula da taxa",
      };

  // A.3 — faixa informativa, derivada em render (estimateLease é síncrono e
  // barato, então nada de setState em effect). Só existe com o toggle de preço
  // marcado, UF escolhida, finalidade real e faixa REGIONAL: o fallback
  // nacional não é "sua região", e faixa sem fonte regional não aparece.
  const faixa = (() => {
    if (!openPrice || !ufSel || !purposeSel || purposeSel === PURPOSE_OPEN) return null;
    const est = estimateLease(purposeSel, ufSel, cropSel || undefined);
    if (est.kind !== "range" || est.fallback) return null;
    const uso = w.purposeOptions.find((o) => o.value === purposeSel)?.label ?? purposeSel;
    return label.rangeInfo(
      uso.toLocaleLowerCase(lang === "en" ? "en" : "pt-BR"),
      formatBRL(est.minPerHa),
      formatBRL(est.maxPerHa),
    );
  })();

  async function submit(publish: boolean, form: HTMLFormElement) {
    setError(null);
    setSubmitting(true);
    const fd = new FormData(form);
    fd.set("publish", publish ? "true" : "false");
    // The variety lives inside the description (no dedicated column yet), so
    // swap the slug value for its human-readable label before submitting.
    const variantVal = String(fd.get("variant") ?? "");
    if (variantVal) {
      const vLabel = (variants?.[String(fd.get("crop") ?? "")] ?? []).find(
        (v) => v.value === variantVal,
      )?.label;
      fd.set("variant", vLabel ?? variantVal);
    }
    const res = await createListing(fd);
    if (!res.ok) {
      setSubmitting(false);
      setError(res.error === "not_signed_in" ? label.errAuth : label.errGeneric);
      return;
    }

    // C.2 — registra o aceite DEPOIS de publicar, com o id do anúncio como
    // contexto. Falhar aqui não desfaz nem bloqueia a publicação.
    if (publish) void acceptListingTerms(res.id);

    // A checagem do CAR fala com o SICAR, então NÃO seguramos a submissão nela:
    // mesmo padrão `void` do aceite acima. O anúncio já está salvo; se o SICAR
    // estiver fora do ar, o resultado fica em `formato_ok` e a próxima edição
    // tenta de novo. Selo nenhum depende de sorte de rede.
    void verificarCarDoAnuncio(res.id);

    // Fotos só agora, porque o caminho no bucket precisa do id do anúncio.
    // Falha de uma foto não desfaz o anúncio nem impede as outras — o dono
    // completa na tela de edição.
    if (fotos.length > 0) {
      await enviarFotos(res.id, fotos, estadosFoto, (key, patch) => {
        setEstadosFoto((p) => p.map((e) => (e.key === key ? { ...e, ...patch } : e)));
      });
    }

    setSubmitting(false);
    setDone(true);
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

  if (authChecked && !user) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-extrabold text-deep">
          {lang === "en" ? "Sign in to list your land" : "Entre para anunciar sua terra"}
        </h2>
        <p className="mt-2 text-deep/60">
          {lang === "en"
            ? "You need an account to create a listing."
            : "Você precisa de uma conta para criar um anúncio."}
        </p>
        <Link
          href="/entrar?next=%2Fapp%2Fanunciar"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-base font-bold text-white hover:bg-primary-dark"
        >
          {lang === "en" ? "Sign in or create an account" : "Entrar ou criar conta"}
        </Link>
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
          <select
            id="state"
            name="state"
            required
            value={ufSel}
            onChange={(e) => {
              setUfSel(e.target.value);
              setMuniSel("");
            }}
            className={inputCls}
          >
            <option value="" disabled>{label.selectUf}</option>
            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="municipality" className="text-sm font-semibold text-deep">{label.municipality}</label>
          {muniFailed ? (
            <input id="municipality" name="municipality" required defaultValue={prefill?.municipality ?? ""} className={inputCls} />
          ) : (
            <select id="municipality" name="municipality" required value={muniSel} onChange={(e) => setMuniSel(e.target.value)} disabled={!ufSel} className={inputCls}>
              <option value="" disabled>{!ufSel ? label.selectMuniFirst : label.selectMuni}</option>
              {municipalities.map((m) => <option key={m.id} value={m.nome}>{m.nome}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="hectares" className="text-sm font-semibold text-deep">{label.hectares}</label>
          {/* Conversor de medidas agrárias: quem pensa em tarefas/alqueires
              digita na unidade da sua região; o FormData continua recebendo
              `hectares` (input hidden do componente), sempre em hectares. */}
          <CampoDeArea uf={ufSel} inputCls={inputCls} required defaultHectares={prefill?.hectares ?? ""} />
        </div>
        <div>
          <label htmlFor="purpose" className="text-sm font-semibold text-deep">{label.purpose}</label>
          <select id="purpose" name="purpose" required value={purposeSel} onChange={(e) => { setPurposeSel(e.target.value); setCropSel(""); }} className={inputCls}>
            <option value="" disabled>{label.selectPurpose}</option>
            {/* A.2 — finalidade aberta vem PRIMEIRO, antes das ordenadas.
                Valor de aplicação (lib/purpose-open.ts), não de content.ts. */}
            <option value={PURPOSE_OPEN}>{label.purposeOpen}</option>
            {sortOptionsByLabel(w.purposeOptions).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {crops?.[purposeSel] && (
        <div>
          <label htmlFor="crop" className="text-sm font-semibold text-deep">{label.crop}</label>
          <select
            id="crop"
            name="crop"
            value={cropSel}
            onChange={(e) => setCropSel(e.target.value)}
            className={inputCls}
          >
            <option value="">{label.allCrops}</option>
            {sortOptionsByLabel(crops[purposeSel]).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      )}

      {cropSel && (variants?.[cropSel]?.length ?? 0) > 0 && (
        <div>
          <label htmlFor="variant" className="text-sm font-semibold text-deep">{label.variety}</label>
          <select
            id="variant"
            name="variant"
            key={cropSel}
            defaultValue={
              cropSel === prefill?.crop &&
              (variants?.[cropSel] ?? []).some((v) => v.value === prefill?.variant)
                ? prefill?.variant
                : ""
            }
            className={inputCls}
          >
            <option value="">{label.varietyAll}</option>
            {sortOptionsByLabel(variants?.[cropSel] ?? []).map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="price_per_ha_year" className="text-sm font-semibold text-deep">{label.price}</label>
        {/* A.1 — com o toggle marcado, o input fica desabilitado e vazio: fora
            do FormData, a action grava null (comportamento já existente). O
            estado `priceVal` sobrevive ao toggle, então desmarcar devolve o
            valor digitado (ou o sugerido da calculadora). */}
        <input
          id="price_per_ha_year"
          name="price_per_ha_year"
          type="number"
          min="0"
          step="any"
          value={openPrice ? "" : priceVal}
          onChange={(e) => setPriceVal(e.target.value)}
          disabled={openPrice}
          className={`${inputCls} disabled:opacity-60`}
        />
        {prefill?.suggested && !openPrice && (
          <p className="mt-1.5 text-xs leading-relaxed text-deep/50">
            {label.priceSuggested}
          </p>
        )}
        <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-xl border border-deep/15 px-4 py-3">
          <input
            type="checkbox"
            checked={openPrice}
            onChange={(e) => setOpenPrice(e.target.checked)}
            className="mt-0.5 accent-primary"
          />
          <span className="text-sm font-semibold text-deep">
            {label.priceOpen}
            <span className="mt-0.5 block text-xs font-normal leading-relaxed text-deep/60">
              {label.priceOpenHint}
            </span>
          </span>
        </label>
        {faixa && (
          <div className="mt-2">
            <p className="rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
              {faixa}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-deep/60">
              {t.appraiser.disclaimer}
            </p>
          </div>
        )}
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
          <input
            name="car_number"
            aria-label={label.car}
            placeholder={label.car}
            value={carRaw}
            onChange={(e) => setCarRaw(e.target.value)}
            className={`${inputCls} mt-0`}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-deep/50">{label.carHint}</p>
          {/* Formato não reconhecido NÃO bloqueia o rascunho nem a publicação.
              E a copy nunca diz "inválido": a nossa regex pode estar incompleta
              e o CAR do dono pode ser legítimo e atípico. A plataforma admite
              que pode ser ela que não sabe. */}
          {carNaoReconhecido && (
            <p className="mt-1.5 rounded-xl bg-accent/20 px-4 py-2.5 text-sm text-deep">
              <span className="font-semibold">{label.carUnknown}</span>{" "}
              <span className="leading-relaxed text-deep/70">
                {label.carExpected}{" "}
                <span className="font-mono text-xs">{CAR_FORMATO_EXEMPLO}</span>
              </span>
            </p>
          )}
        </div>
      </div>

      <div>
        <input name="matricula" aria-label={label.matricula} placeholder={label.matricula} className={`${inputCls} mt-0`} />
        <p className="mt-1.5 text-xs leading-relaxed text-deep/50">{label.matriculaHint}</p>
      </div>

      {/* Código IBGE do município, para a checagem do CAR poder acontecer. Fica
          vazio quando a API do IBGE falhou e o campo virou texto livre — nesse
          caminho não existe código, e isso é tratado como indeterminado, nunca
          como divergência. */}
      <input type="hidden" name="municipality_ibge" value={muniIbge ?? ""} />

      <PhotoPicker
        arquivos={fotos}
        estados={estadosFoto}
        onEscolher={(novos) => {
          setFotos((p) => [...p, ...novos]);
          setEstadosFoto((p) => [...p, ...novos.map((f, i) => novoEstado(f, p.length + i))]);
        }}
        onRemover={(i) => {
          URL.revokeObjectURL(estadosFoto[i]?.previa ?? "");
          setFotos((p) => p.filter((_, k) => k !== i));
          setEstadosFoto((p) => p.filter((_, k) => k !== i));
        }}
        desabilitado={submitting}
      />

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

      {/* C.2 — aceite exibido no momento em que a taxa passa a valer: ao
          PUBLICAR. Salvar rascunho não publica nada e segue livre. */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-neutral p-4">
        <input
          type="checkbox"
          checked={acceptedFee}
          onChange={(e) => setAcceptedFee(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
        />
        <span className="text-sm leading-relaxed text-deep">
          {label.feeConsent}{" "}
          <Link
            href="/termos#taxa"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-primary underline transition-colors hover:text-primary-dark"
          >
            {label.feeConsentLink}
          </Link>
        </span>
      </label>

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
          disabled={submitting || !acceptedFee}
          onClick={(e) => submit(true, e.currentTarget.form!)}
          className="flex-1 rounded-full bg-primary px-6 py-3 text-base font-bold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? label.submitting : label.publish}
        </button>
      </div>
    </form>
  );
}
