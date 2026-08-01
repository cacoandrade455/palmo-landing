"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Archive, CheckCircle2, Eye, Pause, Play } from "lucide-react";

import { useLanguage } from "@/lib/language-context";
import { UFS } from "@/lib/appraisal-data";
import { sortOptionsByLabel } from "@/lib/sort-options";
import { CAR_FORMATO_EXEMPLO, parseCar } from "@/lib/car-checks";
import { useMunicipios } from "@/app/app/anunciar/use-municipios";
import { CampoDeArea } from "@/components/CampoDeArea";
import { acceptListingTerms } from "@/app/app/legal-actions";
import { PhotoManager } from "./PhotoManager";
import { mudarStatusDoAnuncio, updateListing, type ListingParaEditar } from "./actions";

const inputCls =
  "mt-1.5 w-full rounded-xl border border-deep/15 bg-white px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none";

/**
 * Edição de anúncio. Reusa do fluxo de criação o que realmente não pode
 * divergir: o hook `useMunicipios` (com o sentinela de falha do IBGE e o
 * casamento por nome), as opções de finalidade e cultura, e a validação do CAR.
 *
 * NÃO existe exclusão aqui, e isso é deliberado — ver o comentário de cabeçalho
 * de `actions.ts`. A ação equivalente é ARQUIVAR: sai do /explorar e não apaga
 * conversa, mensagem, proposta nem aceite.
 */
export function EditListing({ listing }: { listing: ListingParaEditar }) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const w = t.waitlist;
  const crops = t.appraiser.crops;

  const [ufSel, setUfSel] = useState(listing.state);
  const [muniSel, setMuniSel] = useState(listing.municipality);
  const [purposeSel, setPurposeSel] = useState(listing.purpose);
  const [cropSel, setCropSel] = useState(listing.crop ?? "");
  const [carRaw, setCarRaw] = useState(listing.car_number ?? "");
  const [hectares, setHectares] = useState(String(listing.hectares));
  const [preco, setPreco] = useState(
    listing.price_per_ha_year == null ? "" : String(listing.price_per_ha_year),
  );
  const [status, setStatus] = useState(listing.status);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aceitouTaxa, setAceitouTaxa] = useState(false);
  const [carStatus, setCarStatus] = useState(listing.car?.status ?? null);

  const { municipios, falhou: muniFailed, entry: muniEntry, codigoDe } = useMunicipios(ufSel);

  // O município atual só pode ser reselecionado quando a lista da UF chega.
  // Mesma mecânica do prefill da calculadora, e pelo mesmo motivo: casa por
  // NOME, porque é o que temos gravado no anúncio.
  const pendenteRef = useRef(listing.municipality);
  useEffect(() => {
    const alvo = pendenteRef.current;
    const carregados = Array.isArray(muniEntry) ? muniEntry : [];
    if (!alvo || carregados.length === 0) return;
    pendenteRef.current = "";
    if (carregados.some((m) => m.nome === alvo)) {
      queueMicrotask(() => setMuniSel(alvo));
    }
  }, [muniEntry]);

  const muniIbge = codigoDe(muniSel);
  const carLimpo = carRaw.trim();
  const carNaoReconhecido = carLimpo.length >= 40 && parseCar(carLimpo) === null;

  // Editar QUALQUER um destes refaz a verificação do CAR no servidor, porque o
  // selo depende dos quatro juntos.
  const mexeuNoCar =
    (listing.car_number ?? "") !== carLimpo ||
    listing.state !== ufSel ||
    listing.municipality !== muniSel ||
    Number(listing.hectares) !== Number(hectares);

  const mexeuNoContrato =
    Number(listing.price_per_ha_year ?? 0) !== Number(preco || 0) ||
    Number(listing.hectares) !== Number(hectares) ||
    listing.purpose !== purposeSel;

  const label =
    lang === "en"
      ? {
          voltar: "Back to my listings",
          titulo: "Edit listing",
          subtitulo: "Changes go live as soon as you save.",
          listingTitle: "Listing title",
          state: "State",
          municipality: "Municipality",
          selectUf: "UF",
          selectMuni: "Select…",
          hectares: "Area (hectares)",
          purpose: "Intended use",
          selectPurpose: "Select…",
          crop: "Specific crop (optional)",
          allCrops: "All / not sure",
          price: "Expected price (R$/ha/year, optional)",
          description: "Description (optional)",
          water: "Has water source",
          car: "CAR number (optional)",
          carHint: "We check it against the official SICAR database.",
          carUnknown: "We don't recognise this format.",
          carExpected: "Have another look — it should look like",
          matricula: "Property record at the CRI (optional)",
          salvar: "Save changes",
          salvando: "Saving…",
          salvo: "Changes saved.",
          erro: "Something went wrong. Nothing was changed.",
          avisoCar:
            "Because you changed the CAR, the state, the municipality or the area, we'll check the property on SICAR again. The badge reflects the new numbers.",
          avisoContrato: (temNegociacao: boolean) =>
            temNegociacao
              ? "You're changing price, area or intended use, and this listing already has a conversation or an offer. We record the change and show “listing edited on …” to the other party. Offers already made keep their own agreed terms."
              : "You're changing price, area or intended use. We record the change in the listing history.",
          estado: "Listing status",
          publicar: "Publish listing",
          pausar: "Pause",
          reativar: "Reactivate",
          arquivar: "Archive",
          verAnuncio: "View listing",
          statusLabels: {
            draft: "Draft — not visible to anyone",
            active: "Active — visible on the marketplace",
            paused: "Paused — hidden from the marketplace",
            archived: "Archived — hidden, nothing was deleted",
            closed: "Closed — handled by the contract flow",
          } as Record<string, string>,
          arquivarAjuda:
            "Archiving removes the listing from the marketplace. Conversations, messages and offers are kept — nothing is deleted.",
          feeConsent:
            "By publishing, you agree to the Terms, including the 5% success fee on the total contract value, owed by the landowner, charged proportionally with each annual payment.",
          feeConsentLink: "Read the fee clause",
          carEstado: {
            confirmado_sicar: "CAR active on SICAR",
            formato_ok: "CAR declared, not checked yet",
            formato_invalido: "We don't recognise this CAR format",
            divergente_sicar: "Worth double-checking this CAR",
            nao_informado: "No CAR informed",
          } as Record<string, string>,
          carConvite: "Check the CAR to earn the “CAR active on SICAR” badge.",
          conferidoEm: (d: string) => `Checked on ${d}`,
        }
      : {
          voltar: "Voltar para meus anúncios",
          titulo: "Editar anúncio",
          subtitulo: "As mudanças valem assim que você salvar.",
          listingTitle: "Título do anúncio",
          state: "Estado",
          municipality: "Município",
          selectUf: "UF",
          selectMuni: "Selecione…",
          hectares: "Área (hectares)",
          purpose: "Finalidade de uso",
          selectPurpose: "Selecione…",
          crop: "Cultura específica (opcional)",
          allCrops: "Todas / não sei",
          price: "Preço esperado (R$/ha/ano, opcional)",
          description: "Descrição (opcional)",
          water: "Tem água",
          car: "Número do CAR (opcional)",
          carHint: "A gente confere na base oficial do SICAR.",
          carUnknown: "Não reconhecemos esse formato.",
          carExpected: "Dá uma conferida — ele costuma ser assim:",
          matricula: "Matrícula do imóvel no CRI (opcional)",
          salvar: "Salvar alterações",
          salvando: "Salvando…",
          salvo: "Alterações salvas.",
          erro: "Algo deu errado. Nada foi alterado.",
          avisoCar:
            "Como você mudou o CAR, o estado, o município ou a área, a gente vai conferir o imóvel no SICAR de novo. O selo passa a refletir os números novos.",
          avisoContrato: (temNegociacao: boolean) =>
            temNegociacao
              ? "Você está mudando preço, área ou finalidade, e este anúncio já tem conversa ou proposta. A gente registra a alteração e mostra “anúncio editado em …” para a outra parte. Propostas já feitas mantêm os termos que foram acordados nelas."
              : "Você está mudando preço, área ou finalidade. A gente registra a alteração no histórico do anúncio.",
          estado: "Situação do anúncio",
          publicar: "Publicar anúncio",
          pausar: "Pausar",
          reativar: "Reativar",
          arquivar: "Arquivar",
          verAnuncio: "Ver anúncio",
          statusLabels: {
            draft: "Rascunho — ninguém vê",
            active: "Ativo — aparece no marketplace",
            paused: "Pausado — fora do marketplace",
            archived: "Arquivado — fora do ar, nada foi apagado",
            closed: "Fechado — quem cuida é o fluxo do contrato",
          } as Record<string, string>,
          arquivarAjuda:
            "Arquivar tira o anúncio do marketplace. Conversas, mensagens e propostas continuam guardadas — nada é apagado.",
          feeConsent:
            "Ao publicar, você concorda com os Termos, incluindo a Taxa de 5% sobre o valor total do contrato, devida pelo proprietário, cobrada proporcionalmente a cada pagamento anual.",
          feeConsentLink: "Ler a cláusula da taxa",
          carEstado: {
            confirmado_sicar: "CAR ativo no SICAR",
            formato_ok: "CAR declarado, ainda não conferido",
            formato_invalido: "Não reconhecemos o formato desse CAR",
            divergente_sicar: "Vale conferir esse CAR",
            nao_informado: "CAR não informado",
          } as Record<string, string>,
          carConvite: "Confira o CAR para ganhar o selo “CAR ativo no SICAR”.",
          conferidoEm: (d: string) => `Conferido em ${d}`,
        };

  async function salvar(form: HTMLFormElement) {
    setErro(null);
    setSalvo(false);
    setSalvando(true);
    const fd = new FormData(form);
    fd.set("municipality_ibge", muniIbge == null ? "" : String(muniIbge));
    const res = await updateListing(listing.id, fd);
    setSalvando(false);
    if (!res.ok) {
      setErro(label.erro);
      return;
    }
    if (res.carStatus) setCarStatus(res.carStatus);
    setSalvo(true);
    router.refresh();
  }

  async function trocarStatus(novo: "draft" | "active" | "paused" | "archived") {
    setErro(null);
    const res = await mudarStatusDoAnuncio(listing.id, novo);
    if (!res.ok) {
      setErro(label.erro);
      return;
    }
    setStatus(novo);
    // Publicar é o momento em que a Taxa passa a valer: registra o aceite com o
    // id do anúncio como contexto, igual faz o formulário de criação.
    if (novo === "active") void acceptListingTerms(listing.id);
    router.refresh();
  }

  const carEstadoTexto = carStatus ? label.carEstado[carStatus] : null;
  const mostraConvite =
    carStatus === "formato_invalido" ||
    carStatus === "divergente_sicar" ||
    carStatus === "nao_informado";

  return (
    <div className="space-y-4">
      <Link
        href="/app/conta"
        className="inline-flex items-center gap-2 text-sm font-bold text-deep transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {label.voltar}
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-deep">{label.titulo}</h1>
        <p className="mt-1 text-deep/60">{label.subtitulo}</p>
      </div>

      {/* ── Situação do anúncio ─────────────────────────────────────────────
          `closed` não é transição do proprietário: pertence ao fluxo do
          contrato, e mexer nele daqui seria contornar o gate de contato. */}
      <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-primary">{label.estado}</p>
        <p className="mt-1.5 text-sm text-deep/70">{label.statusLabels[status] ?? status}</p>
        {status !== "closed" && (
          <div className="mt-3 flex flex-wrap gap-2">
            {status === "draft" && (
              <button
                type="button"
                onClick={() => trocarStatus("active")}
                disabled={!aceitouTaxa}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                {label.publicar}
              </button>
            )}
            {status === "active" && (
              <button
                type="button"
                onClick={() => trocarStatus("paused")}
                className="inline-flex items-center gap-2 rounded-full border border-deep/20 px-4 py-2 text-sm font-bold text-deep transition-colors hover:border-primary"
              >
                <Pause className="h-4 w-4" aria-hidden="true" />
                {label.pausar}
              </button>
            )}
            {/* Arquivado também reativa: sem este botão, `archived` seria
                beco sem saída na interface — e reativar é o que traz as
                fotos de volta do staging para a vitrine. */}
            {(status === "paused" || status === "archived") && (
              <button
                type="button"
                onClick={() => trocarStatus("active")}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                {label.reativar}
              </button>
            )}
            {status !== "archived" && (
              <button
                type="button"
                onClick={() => trocarStatus("archived")}
                className="inline-flex items-center gap-2 rounded-full border border-deep/20 px-4 py-2 text-sm font-bold text-deep transition-colors hover:border-primary"
              >
                <Archive className="h-4 w-4" aria-hidden="true" />
                {label.arquivar}
              </button>
            )}
            {status === "active" && (
              <Link
                href={`/terra/${listing.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-deep/20 px-4 py-2 text-sm font-bold text-deep transition-colors hover:border-primary"
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                {label.verAnuncio}
              </Link>
            )}
          </div>
        )}
        <p className="mt-3 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70">
          {label.arquivarAjuda}
        </p>
        {status === "draft" && (
          <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl bg-neutral p-4">
            <input
              type="checkbox"
              checked={aceitouTaxa}
              onChange={(e) => setAceitouTaxa(e.target.checked)}
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
        )}
      </div>

      {/* ── Estado do CAR, em tom de consultor ──────────────────────────────
          Nunca a palavra "inválido": a nossa regex pode estar incompleta e o
          CAR do dono pode ser legítimo e atípico. E aqui é a área privada do
          próprio dono, então o convite a conferir é apropriado — em página
          pública, `divergente_sicar` não aparece de forma nenhuma. */}
      {carEstadoTexto && (
        <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
          {carStatus === "confirmado_sicar" ? (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {carEstadoTexto}
              </span>
              {listing.car?.checked_at && (
                <p className="mt-1.5 text-xs text-deep/50">
                  {label.conferidoEm(
                    new Date(listing.car.checked_at).toLocaleDateString(
                      lang === "en" ? "en-US" : "pt-BR",
                    ),
                  )}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-deep/70">{carEstadoTexto}</p>
          )}
          {mostraConvite && (
            <p className="mt-2 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
              {label.carConvite}
            </p>
          )}
        </div>
      )}

      <PhotoManager listingId={listing.id} fotosIniciais={listing.photos} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void salvar(e.currentTarget);
        }}
        className="space-y-4 rounded-2xl border border-deep/10 bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <label htmlFor="title" className="text-sm font-semibold text-deep">
            {label.listingTitle}
          </label>
          <input id="title" name="title" required defaultValue={listing.title} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="state" className="text-sm font-semibold text-deep">{label.state}</label>
            <select
              id="state"
              name="state"
              required
              value={ufSel}
              onChange={(e) => { setUfSel(e.target.value); setMuniSel(""); }}
              className={inputCls}
            >
              <option value="" disabled>{label.selectUf}</option>
              {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="municipality" className="text-sm font-semibold text-deep">{label.municipality}</label>
            {muniFailed ? (
              // IBGE fora do ar: texto livre, e nesse caminho NÃO existe código
              // IBGE. A checagem trata como indeterminado, nunca divergência.
              <input id="municipality" name="municipality" required defaultValue={listing.municipality} className={inputCls} />
            ) : (
              <select id="municipality" name="municipality" required value={muniSel} onChange={(e) => setMuniSel(e.target.value)} className={inputCls}>
                <option value="" disabled>{label.selectMuni}</option>
                {municipios.map((m) => <option key={m.id} value={m.nome}>{m.nome}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="hectares" className="text-sm font-semibold text-deep">{label.hectares}</label>
            {/* Conversor de medidas agrárias. O estado `hectares` continua
                carregando o valor EM HECTARES (via onHectaresChange), então o
                dirty-check acima e o updateListing não mudam; o FormData segue
                recebendo `hectares` pelo input hidden do componente. */}
            <CampoDeArea uf={ufSel} inputCls={inputCls} required hectares={hectares} onHectaresChange={setHectares} />
          </div>
          <div>
            <label htmlFor="purpose" className="text-sm font-semibold text-deep">{label.purpose}</label>
            <select id="purpose" name="purpose" required value={purposeSel} onChange={(e) => { setPurposeSel(e.target.value); setCropSel(""); }} className={inputCls}>
              <option value="" disabled>{label.selectPurpose}</option>
              {sortOptionsByLabel(w.purposeOptions).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {crops?.[purposeSel] && (
          <div>
            <label htmlFor="crop" className="text-sm font-semibold text-deep">{label.crop}</label>
            <select id="crop" name="crop" value={cropSel} onChange={(e) => setCropSel(e.target.value)} className={inputCls}>
              <option value="">{label.allCrops}</option>
              {sortOptionsByLabel(crops[purposeSel]).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="price_per_ha_year" className="text-sm font-semibold text-deep">{label.price}</label>
          <input id="price_per_ha_year" name="price_per_ha_year" type="number" min="0" step="any" value={preco} onChange={(e) => setPreco(e.target.value)} className={inputCls} />
        </div>

        <div>
          <label htmlFor="description" className="text-sm font-semibold text-deep">{label.description}</label>
          <textarea id="description" name="description" rows={3} defaultValue={listing.description ?? ""} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 rounded-xl border border-deep/15 px-4 py-3 text-sm font-semibold text-deep">
            <input type="checkbox" name="has_water" defaultChecked={!!listing.has_water} className="accent-primary" />
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
          <input name="matricula" aria-label={label.matricula} placeholder={label.matricula} defaultValue={listing.matricula ?? ""} className={`${inputCls} mt-0`} />
        </div>

        {/* Avisos antes de salvar: a pessoa sabe o que a edição dispara. */}
        {mexeuNoCar && (
          <p className="rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70">{label.avisoCar}</p>
        )}
        {mexeuNoContrato && (
          <p className="rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
            {label.avisoContrato(listing.temNegociacaoAberta)}
          </p>
        )}

        {erro && <p className="text-sm font-semibold text-deep">{erro}</p>}
        {salvo && <p className="text-sm font-semibold text-primary">{label.salvo}</p>}

        <button
          type="submit"
          disabled={salvando}
          className="w-full rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {salvando ? label.salvando : label.salvar}
        </button>
      </form>
    </div>
  );
}
