"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  MessageSquare,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import {
  minYearsFor,
  PARCERIA_MAX_SHARE,
  PARCERIA_SHARE_HINT,
} from "@/lib/contract-templates";
import {
  addComment,
  approveVersion,
  getContract,
  resolveProposal,
  saveFields,
  type ContractData,
} from "./actions";

const inputCls =
  "w-full rounded-xl border border-deep/15 bg-white px-3 py-2 text-sm text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none";

const FIELD_LABELS_PT: Record<string, string> = {
  PROPRIETARIO_NOME: "Nome do proprietário",
  PROPRIETARIO_DOC: "CPF/CNPJ do proprietário",
  PRODUTOR_NOME: "Nome do produtor",
  PRODUTOR_DOC: "CPF/CNPJ do produtor",
  IMOVEL_TITULO: "Título do imóvel",
  IMOVEL_MUNICIPIO: "Município do imóvel",
  IMOVEL_UF: "UF do imóvel",
  IMOVEL_HECTARES: "Área (ha)",
  IMOVEL_CAR: "Número do CAR",
  IMOVEL_MATRICULA: "Matrícula do imóvel (CRI)",
  FINALIDADE: "Finalidade",
  CULTURA: "Cultura",
  PRAZO_ANOS: "Prazo (anos)",
  INICIO: "Data de início",
  PRECO_HA_ANO: "Preço por ha/ano",
  PRECO_TOTAL_ANO: "Preço total por ano",
  FORMA_PAGAMENTO: "Forma de pagamento",
  VENCIMENTO: "Vencimento",
  INDICE_REAJUSTE: "Índice de reajuste",
  DIAS_MORA: "Dias de mora (rescisão)",
  RESP_ITR: "Responsável pelo ITR",
  COMARCA: "Comarca",
  PERCENTUAL_PROPRIETARIO: "Percentual do proprietário (%)",
  PERCENTUAL_PRODUTOR: "Percentual do produtor (%)",
  CONTRIBUICOES_PROPRIETARIO: "Contribuições do proprietário",
  CONTRIBUICOES_PRODUTOR: "Contribuições do produtor",
  CRITERIO_APURACAO: "Critério de apuração da partilha",
};

const FIELD_LABELS_EN: Record<string, string> = {
  PROPRIETARIO_NOME: "Owner's name",
  PROPRIETARIO_DOC: "Owner's CPF/CNPJ",
  PRODUTOR_NOME: "Producer's name",
  PRODUTOR_DOC: "Producer's CPF/CNPJ",
  IMOVEL_TITULO: "Property title",
  IMOVEL_MUNICIPIO: "Property municipality",
  IMOVEL_UF: "Property state (UF)",
  IMOVEL_HECTARES: "Area (ha)",
  IMOVEL_CAR: "CAR number",
  IMOVEL_MATRICULA: "Land registry record (CRI)",
  FINALIDADE: "Intended use",
  CULTURA: "Crop",
  PRAZO_ANOS: "Term (years)",
  INICIO: "Start date",
  PRECO_HA_ANO: "Price per ha/year",
  PRECO_TOTAL_ANO: "Total price per year",
  FORMA_PAGAMENTO: "Payment method",
  VENCIMENTO: "Due date",
  INDICE_REAJUSTE: "Adjustment index",
  DIAS_MORA: "Days in arrears (termination)",
  RESP_ITR: "Responsible for ITR tax",
  COMARCA: "Judicial district",
  PERCENTUAL_PROPRIETARIO: "Owner's share (%)",
  PERCENTUAL_PRODUTOR: "Producer's share (%)",
  CONTRIBUICOES_PROPRIETARIO: "Owner's contributions",
  CONTRIBUICOES_PRODUTOR: "Producer's contributions",
  CRITERIO_APURACAO: "Split calculation criteria",
};

function prettify(key: string) {
  return key.toLowerCase().replace(/_/g, " ");
}

/** Render a clause body highlighting unresolved {{PLACEHOLDERS}} as pills. */
function BlockBody({ body }: { body: string }) {
  const parts = body.split(/(\{\{\w+\}\})/g);
  return (
    <p className="text-sm leading-relaxed text-deep/70">
      {parts.map((p, i) =>
        /^\{\{\w+\}\}$/.test(p) ? (
          <span
            key={i}
            className="mx-0.5 inline-block rounded-full bg-accent/20 px-2 py-0.5 text-xs font-bold text-deep"
          >
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </p>
  );
}

export function ContractRoom({ id }: { id: string }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openBlock, setOpenBlock] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [proposeMode, setProposeMode] = useState(false);
  const [proposalDraft, setProposalDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [savingFields, setSavingFields] = useState(false);
  const [approving, setApproving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const label =
    lang === "en"
      ? {
          back: "Back to conversation",
          viewFull: "View full contract",
          legalBanner: "Draft subject to legal review.",
          typeArrendamento: "Rural lease",
          typeParceria: "Rural partnership",
          statusDiscussion: (v: number) => `Draft v${v} under discussion`,
          statusReady: "Ready for signature",
          statusSigned: "Signed",
          statusCancelled: "Cancelled",
          frozen:
            "Text frozen. Palmo will send the contract for electronic signature (Law 14,063/2020).",
          owner: "Owner",
          producer: "Producer",
          hectares: "ha",
          coreBadge: "Core clause",
          discuss: "Comment / Propose change",
          closeThread: "Close",
          commentPh: "Write a comment…",
          proposeToggle: "Propose new text for this clause",
          send: "Send",
          before: "Before (current text)",
          after: "After (proposed text)",
          open: "Open proposal",
          accepted: "Accepted",
          rejected: "Rejected",
          acceptProposal: "Accept (new version)",
          rejectProposal: "Reject",
          waitOther: "Waiting for the other side to respond.",
          fieldsTitle: "Fields to fill in",
          fieldsHint:
            "Unfilled placeholders stay visible in the draft as {{FIELD}}. Fill them in and save — each save creates a new version.",
          saveFields: "Save fields (new version)",
          minTermErr: (min: number) =>
            `Term below the legal minimum: for this land use, Decree 59.566/66 (art. 13) requires at least ${min} years.`,
          maxShareErr: `Owner's share above the legal cap of ${PARCERIA_MAX_SHARE}%. ${PARCERIA_SHARE_HINT}`,
          approveTitle: "Draft approval",
          approveBtn: (v: number) => `Approve draft v${v}`,
          approvedChip: (v: number) => `Approved v${v}`,
          waitingChip: "Waiting",
          youApproved: (v: number) =>
            `You approved v${v}. Waiting for the other side.`,
          reapproveNote:
            "Any new change creates a new version and requires both sides to approve again.",
          genericErr: "Something went wrong. Please try again.",
          notFound: "Contract not found or you don't have access.",
        }
      : {
          back: "Voltar à conversa",
          viewFull: "Ver contrato completo",
          legalBanner: "Minuta sujeita a revisão jurídica.",
          typeArrendamento: "Arrendamento rural",
          typeParceria: "Parceria rural",
          statusDiscussion: (v: number) => `Minuta v${v} em discussão`,
          statusReady: "Pronta para assinatura",
          statusSigned: "Assinada",
          statusCancelled: "Cancelada",
          frozen:
            "Texto congelado. A Palmo enviará o contrato para assinatura eletrônica (Lei 14.063/2020).",
          owner: "Proprietário(a)",
          producer: "Produtor(a)",
          hectares: "ha",
          coreBadge: "Cláusula-núcleo",
          discuss: "Comentar / Propor alteração",
          closeThread: "Fechar",
          commentPh: "Escreva um comentário…",
          proposeToggle: "Propor novo texto para esta cláusula",
          send: "Enviar",
          before: "Antes (texto atual)",
          after: "Depois (texto proposto)",
          open: "Proposta aberta",
          accepted: "Aceita",
          rejected: "Recusada",
          acceptProposal: "Aceitar (nova versão)",
          rejectProposal: "Recusar",
          waitOther: "Aguardando resposta da outra parte.",
          fieldsTitle: "Campos a preencher",
          fieldsHint:
            "Placeholders sem dado ficam visíveis na minuta como {{CAMPO}}. Preencha e salve — cada salvamento gera uma nova versão.",
          saveFields: "Salvar campos (nova versão)",
          minTermErr: (min: number) =>
            `Prazo abaixo do mínimo legal: para esta finalidade, o Decreto 59.566/66 (art. 13) exige pelo menos ${min} anos.`,
          maxShareErr: `Percentual do proprietário acima do teto legal de ${PARCERIA_MAX_SHARE}%. ${PARCERIA_SHARE_HINT}`,
          approveTitle: "Aprovação da minuta",
          approveBtn: (v: number) => `Aprovar minuta v${v}`,
          approvedChip: (v: number) => `Aprovou a v${v}`,
          waitingChip: "Aguardando",
          youApproved: (v: number) =>
            `Você aprovou a v${v}. Aguardando a outra parte.`,
          reapproveNote:
            "Qualquer nova alteração gera nova versão e exige a reaprovação das duas partes.",
          genericErr: "Algo deu errado. Tente novamente.",
          notFound: "Contrato não encontrado ou sem acesso.",
        };

  const fieldLabels = lang === "en" ? FIELD_LABELS_EN : FIELD_LABELS_PT;

  function reload() {
    getContract(id).then((res) => {
      if (res.ok) setData(res.data);
      setLoading(false);
    });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const placeholderKeys = useMemo(() => {
    const keys: string[] = [];
    for (const b of data?.blocks ?? []) {
      for (const m of b.body.matchAll(/\{\{(\w+)\}\}/g)) {
        if (!keys.includes(m[1])) keys.push(m[1]);
      }
    }
    return keys;
  }, [data]);

  if (loading) return <p className="py-10 text-center text-deep/40">…</p>;
  if (!data)
    return <p className="py-10 text-center text-deep/50">{label.notFound}</p>;

  const editable = data.status === "discussion";
  const myApproved = data.approvals.includes(data.myId);
  const ownerApproved = data.approvals.includes(data.ownerId);
  const developerApproved = data.approvals.includes(data.developerId);
  const anyApproved = data.approvals.length > 0;

  const statusChip =
    data.status === "discussion"
      ? { text: label.statusDiscussion(data.current_version), cls: "bg-primary/10 text-primary" }
      : data.status === "ready"
        ? { text: label.statusReady, cls: "bg-accent/20 text-deep" }
        : data.status === "signed"
          ? { text: label.statusSigned, cls: "bg-primary text-white" }
          : { text: label.statusCancelled, cls: "bg-deep/10 text-deep/50" };

  /** Client-side legal gates (same rules re-checked on the server). */
  function validateFields(): string | null {
    const prazo = fieldValues.PRAZO_ANOS?.trim();
    if (prazo) {
      const n = Number(prazo.replace(",", "."));
      const min = minYearsFor(data!.listing.purpose);
      if (!Number.isFinite(n) || n < min) return label.minTermErr(min);
    }
    if (data!.type === "parceria") {
      const raw = fieldValues.PERCENTUAL_PROPRIETARIO?.trim();
      if (raw) {
        const p = Number(raw.replace(",", "."));
        if (!Number.isFinite(p) || p <= 0 || p > PARCERIA_MAX_SHARE)
          return label.maxShareErr;
      }
    }
    return null;
  }

  async function submitFields() {
    setFieldError(null);
    const filled = Object.fromEntries(
      Object.entries(fieldValues).filter(([, v]) => v.trim()),
    );
    if (Object.keys(filled).length === 0) return;
    const gate = validateFields();
    if (gate) {
      setFieldError(gate);
      return;
    }
    setSavingFields(true);
    const res = await saveFields(id, filled);
    setSavingFields(false);
    if (res.ok) {
      setFieldValues({});
      reload();
    } else if (res.error === "min_term") {
      setFieldError(label.minTermErr(res.minYears ?? 3));
    } else if (res.error === "max_share") {
      setFieldError(label.maxShareErr);
    } else {
      setFieldError(label.genericErr);
    }
  }

  async function submitComment(blockKey: string) {
    if (!commentDraft.trim() && !(proposeMode && proposalDraft.trim())) return;
    setSending(true);
    setActionError(null);
    const res = await addComment(
      id,
      blockKey,
      commentDraft,
      proposeMode ? proposalDraft : null,
    );
    setSending(false);
    if (res.ok) {
      setCommentDraft("");
      setProposalDraft("");
      setProposeMode(false);
      reload();
    } else {
      setActionError(label.genericErr);
    }
  }

  async function resolve(commentId: string, accept: boolean) {
    setResolvingId(commentId);
    setActionError(null);
    const res = await resolveProposal(commentId, accept);
    setResolvingId(null);
    if (res.ok) reload();
    else setActionError(label.genericErr);
  }

  async function approve() {
    setApproving(true);
    setActionError(null);
    const res = await approveVersion(id);
    setApproving(false);
    if (res.ok) reload();
    else setActionError(label.genericErr);
  }

  function openThread(key: string) {
    setOpenBlock((cur) => (cur === key ? null : key));
    setCommentDraft("");
    setProposalDraft("");
    setProposeMode(false);
    setActionError(null);
  }

  const partyName = (uid: string) =>
    (uid === data.ownerId ? data.ownerName : data.developerName) ?? "—";

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.push(`/app/mensagens/${data.conversation_id}`)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-deep/60 hover:text-deep"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {label.back}
      </button>

      {/* permanent legal banner */}
      <p className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70">
        <Scale className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        {label.legalBanner}
      </p>

      {/* header: parties, property, status */}
      <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            {data.type === "arrendamento"
              ? label.typeArrendamento
              : label.typeParceria}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusChip.cls}`}
          >
            {statusChip.text}
          </span>
        </div>
        <h1 className="mt-3 text-xl font-extrabold tracking-tight text-deep">
          {data.listing.title}
        </h1>
        <p className="mt-1 text-sm text-deep/60">
          {data.listing.municipality}, {data.listing.state} ·{" "}
          {data.listing.hectares.toLocaleString(
            lang === "en" ? "en-US" : "pt-BR",
          )}{" "}
          {label.hectares}
        </p>
        <div className="mt-3 space-y-1 text-sm text-deep/70">
          <p>
            <span className="font-bold text-deep">{label.owner}:</span>{" "}
            {data.ownerName ?? "—"}
          </p>
          <p>
            <span className="font-bold text-deep">{label.producer}:</span>{" "}
            {data.developerName ?? "—"}
          </p>
        </div>
        <button
          onClick={() => router.push(`/app/contrato/${id}/completo`)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          {label.viewFull}
        </button>
      </div>

      {data.status === "ready" && (
        <p className="rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
          {label.frozen}
        </p>
      )}

      {/* unresolved placeholders become inline fields */}
      {editable && placeholderKeys.length > 0 && (
        <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-primary">
            {label.fieldsTitle}
          </h2>
          <p className="mt-2 text-sm text-deep/60">{label.fieldsHint}</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {placeholderKeys.map((k) => (
              <div key={k}>
                <label
                  htmlFor={`field-${k}`}
                  className="text-xs font-bold text-deep/60"
                >
                  {fieldLabels[k] ?? prettify(k)}
                </label>
                <input
                  id={`field-${k}`}
                  value={fieldValues[k] ?? ""}
                  onChange={(e) =>
                    setFieldValues((p) => ({ ...p, [k]: e.target.value }))
                  }
                  placeholder={`{{${k}}}`}
                  className={`mt-1 ${inputCls}`}
                />
              </div>
            ))}
          </div>
          {fieldError && (
            <p className="mt-3 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
              {fieldError}
            </p>
          )}
          <button
            onClick={submitFields}
            disabled={
              savingFields ||
              !Object.values(fieldValues).some((v) => v.trim())
            }
            className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {savingFields ? "…" : label.saveFields}
          </button>
        </div>
      )}

      {/* clause blocks */}
      {data.blocks.map((b) => {
        const blockComments = data.comments.filter(
          (c) => c.block_key === b.key,
        );
        const isOpen = openBlock === b.key;
        return (
          <div
            key={b.key}
            className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-extrabold text-deep">{b.title}</h2>
              {b.core && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {label.coreBadge}
                </span>
              )}
            </div>
            <div className="mt-2">
              <BlockBody body={b.body} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => openThread(b.key)}
                className="inline-flex items-center gap-1.5 rounded-full border border-deep/20 px-3 py-1 text-xs font-bold text-deep transition-colors hover:border-primary"
              >
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                {isOpen ? label.closeThread : label.discuss}
              </button>
              {blockComments.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  {blockComments.length}
                </span>
              )}
            </div>

            {isOpen && (
              <div className="mt-4 space-y-3 border-t border-deep/10 pt-4">
                {blockComments.map((c) => {
                  const mine = c.author_id === data.myId;
                  const canResolve =
                    !mine &&
                    c.proposed_text &&
                    c.status === "open" &&
                    editable;
                  return (
                    <div key={c.id} className="rounded-xl bg-neutral/60 px-4 py-2.5">
                      <p className="text-xs font-bold text-deep/50">
                        {partyName(c.author_id)} ·{" "}
                        {new Date(c.created_at).toLocaleDateString(
                          lang === "en" ? "en-US" : "pt-BR",
                        )}
                      </p>
                      {c.body !== "—" && (
                        <p className="mt-1 text-sm text-deep/70">{c.body}</p>
                      )}
                      {c.proposed_text && (
                        <div className="mt-2 space-y-2">
                          {c.status === "open" && (
                            <div className="rounded-xl bg-white px-4 py-2.5">
                              <p className="text-xs font-bold text-deep/50">
                                {label.before}
                              </p>
                              <p className="mt-1 text-sm text-deep/50">
                                {b.body}
                              </p>
                            </div>
                          )}
                          <div className="rounded-xl bg-white px-4 py-2.5">
                            <p className="text-xs font-bold text-primary">
                              {label.after}
                            </p>
                            <p className="mt-1 text-sm text-deep/70">
                              {c.proposed_text}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                c.status === "accepted"
                                  ? "bg-primary text-white"
                                  : c.status === "rejected"
                                    ? "bg-deep/10 text-deep/50"
                                    : "bg-accent/20 text-deep"
                              }`}
                            >
                              {c.status === "accepted"
                                ? label.accepted
                                : c.status === "rejected"
                                  ? label.rejected
                                  : label.open}
                            </span>
                            {canResolve && (
                              <>
                                <button
                                  onClick={() => resolve(c.id, true)}
                                  disabled={resolvingId === c.id}
                                  className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                                >
                                  {label.acceptProposal}
                                </button>
                                <button
                                  onClick={() => resolve(c.id, false)}
                                  disabled={resolvingId === c.id}
                                  className="rounded-full border border-deep/20 px-3 py-1 text-xs font-bold text-deep"
                                >
                                  {label.rejectProposal}
                                </button>
                              </>
                            )}
                            {mine && c.status === "open" && editable && (
                              <span className="text-xs text-deep/50">
                                {label.waitOther}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {editable && (
                  <div className="space-y-2">
                    <textarea
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      placeholder={label.commentPh}
                      aria-label={label.commentPh}
                      rows={2}
                      className={inputCls}
                    />
                    <label className="flex items-center gap-2 text-sm font-semibold text-deep">
                      <input
                        type="checkbox"
                        checked={proposeMode}
                        onChange={(e) => {
                          setProposeMode(e.target.checked);
                          if (e.target.checked && !proposalDraft)
                            setProposalDraft(b.body);
                        }}
                        className="accent-primary"
                      />
                      {label.proposeToggle}
                    </label>
                    {proposeMode && (
                      <textarea
                        value={proposalDraft}
                        onChange={(e) => setProposalDraft(e.target.value)}
                        aria-label={label.after}
                        rows={5}
                        className={inputCls}
                      />
                    )}
                    <button
                      onClick={() => submitComment(b.key)}
                      disabled={
                        sending ||
                        (!commentDraft.trim() &&
                          !(proposeMode && proposalDraft.trim()))
                      }
                      className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark disabled:opacity-60"
                    >
                      {sending ? "…" : label.send}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* approvals footer */}
      <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-primary">
          {label.approveTitle}
        </h2>
        <div className="mt-3 space-y-2">
          {[
            { role: label.owner, name: data.ownerName, ok: ownerApproved },
            {
              role: label.producer,
              name: data.developerName,
              ok: developerApproved,
            },
          ].map((p) => (
            <div
              key={p.role}
              className="flex items-center justify-between gap-3 rounded-xl border border-deep/10 px-4 py-2.5"
            >
              <p className="min-w-0 truncate text-sm text-deep/70">
                <span className="font-bold text-deep">{p.role}:</span>{" "}
                {p.name ?? "—"}
              </p>
              {p.ok ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {label.approvedChip(data.current_version)}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-deep/10 px-2.5 py-1 text-xs font-bold text-deep/50">
                  {label.waitingChip}
                </span>
              )}
            </div>
          ))}
        </div>

        {data.status === "ready" ? (
          <p className="mt-4 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
            {label.frozen}
          </p>
        ) : editable ? (
          <>
            {myApproved ? (
              <p className="mt-4 text-sm font-semibold text-deep/60">
                {label.youApproved(data.current_version)}
              </p>
            ) : (
              <button
                onClick={approve}
                disabled={approving}
                className="mt-4 w-full rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {approving ? "…" : label.approveBtn(data.current_version)}
              </button>
            )}
            {anyApproved && (
              <p className="mt-3 text-xs text-deep/50">{label.reapproveNote}</p>
            )}
          </>
        ) : null}
        {actionError && (
          <p className="mt-3 text-sm font-semibold text-deep/60">
            {actionError}
          </p>
        )}
      </div>
    </div>
  );
}
