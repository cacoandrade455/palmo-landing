"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import { useLanguage } from "@/lib/language-context";
import type { KycChecks } from "@/lib/kyc-checks";
import {
  aprovar,
  linkDoDocumento,
  rejeitar,
  type ItemFilaAdmin,
} from "./actions";

const inputCls =
  "mt-1.5 w-full rounded-xl border border-deep/15 bg-white px-4 py-3 text-deep placeholder:text-deep/35 focus:border-primary focus:outline-none";

export function KycQueue({
  adminEmail,
  fila,
  decididos,
  erro,
}: {
  adminEmail: string | null;
  fila: ItemFilaAdmin[];
  decididos: ItemFilaAdmin[];
  erro: string | null;
}) {
  const { lang } = useLanguage();

  const label =
    lang === "en"
      ? {
          kicker: "Internal",
          title: "Verification triage",
          intro:
            "Cases the automatic checks could not clear on their own. Approving or rejecting is always a human act.",
          signedInAs: "Signed in as",
          queue: "Waiting for a decision",
          recent: "Latest decisions",
          empty: "Nothing waiting. The automatic checks cleared everything.",
          emptyRecent: "No decisions yet.",
          reasons: "Why it came here",
          openDoc: "Open document",
          opening: "Signing link…",
          linkNote: "Temporary link, valid for 5 minutes.",
          approve: "Approve",
          reject: "Reject",
          reasonLabel: "Reason (goes in the e-mail to the person)",
          reasonPlaceholder: "What could not be confirmed and how to fix it.",
          reasonRequired: "Write at least a sentence: this is what the person reads.",
          cancel: "Cancel",
          confirmReject: "Confirm rejection",
          working: "Saving…",
          failed: "Could not save. Try again.",
          noTriage: "Triage did not run on this submission (legacy or offline).",
          receita: "Federal Revenue",
          situacao: "Registration status",
          opened: "Opened on",
          cnae: "Main CNAE",
          rural: "rural activity",
          notRural: "not a rural activity",
          nameMatch: "Name match",
          compatible: "compatible",
          divergent: "divergent",
          duplicate: "Duplicate",
          dupNone: "no other approved account with this document",
          dupFound: "already approved elsewhere",
          dupUnchecked: "could not be checked",
          file: "File",
          fileOk: "present, accepted type and size",
          digits: "Check digits",
          valid: "valid",
          invalid: "invalid",
          serviceMissing:
            "SUPABASE_SERVICE_ROLE_KEY is not set. The queue cannot be read.",
          auto: "Approved automatically",
          byAdmin: "Decided by a person",
        }
      : {
          kicker: "Interno",
          title: "Triagem de verificação",
          intro:
            "Casos que as checagens automáticas não liberaram sozinhas. Aprovar e rejeitar é sempre ato humano.",
          signedInAs: "Conectado como",
          queue: "Esperando decisão",
          recent: "Últimas decisões",
          empty: "Nada esperando. As checagens automáticas deram conta.",
          emptyRecent: "Nenhuma decisão ainda.",
          reasons: "Por que veio para cá",
          openDoc: "Abrir documento",
          opening: "Assinando link…",
          linkNote: "Link temporário, válido por 5 minutos.",
          approve: "Aprovar",
          reject: "Rejeitar",
          reasonLabel: "Motivo (vai no e-mail para a pessoa)",
          reasonPlaceholder: "O que não pôde ser confirmado e como corrigir.",
          reasonRequired:
            "Escreva ao menos uma frase: é o que a pessoa vai ler.",
          cancel: "Cancelar",
          confirmReject: "Confirmar rejeição",
          working: "Salvando…",
          failed: "Não foi possível salvar. Tente de novo.",
          noTriage:
            "A triagem não rodou nesta submissão (envio antigo ou fora do ar).",
          receita: "Receita Federal",
          situacao: "Situação cadastral",
          opened: "Aberta em",
          cnae: "CNAE principal",
          rural: "atividade rural",
          notRural: "não é atividade rural",
          nameMatch: "Comparação de nome",
          compatible: "compatível",
          divergent: "divergente",
          duplicate: "Duplicidade",
          dupNone: "nenhuma outra conta aprovada com este documento",
          dupFound: "já aprovado em outra conta",
          dupUnchecked: "não foi possível checar",
          file: "Arquivo",
          fileOk: "presente, tipo e tamanho aceitos",
          digits: "Dígito verificador",
          valid: "válido",
          invalid: "inválido",
          serviceMissing:
            "SUPABASE_SERVICE_ROLE_KEY não está configurada. A fila não pode ser lida.",
          auto: "Aprovado automaticamente",
          byAdmin: "Decidido por uma pessoa",
        };

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-wide text-primary">
        {label.kicker}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-deep">
        {label.title}
      </h1>
      <p className="mt-2 text-deep/70">{label.intro}</p>
      {adminEmail && (
        <p className="mt-1 text-sm text-deep/50">
          {label.signedInAs} {adminEmail}
        </p>
      )}

      {erro && (
        <p className="mt-6 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
          {erro === "service_role_missing" ? label.serviceMissing : erro}
        </p>
      )}

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-extrabold text-deep">{label.queue}</h2>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            {fila.length}
          </span>
        </div>
        {fila.length === 0 ? (
          <p className="rounded-2xl border border-deep/10 bg-white p-6 text-deep/60 shadow-sm">
            {label.empty}
          </p>
        ) : (
          <div className="grid gap-4">
            {fila.map((item) => (
              <CasoCard key={item.user_id} item={item} label={label} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-extrabold text-deep">{label.recent}</h2>
        </div>
        {decididos.length === 0 ? (
          <p className="rounded-2xl border border-deep/10 bg-white p-6 text-deep/60 shadow-sm">
            {label.emptyRecent}
          </p>
        ) : (
          <ul className="grid gap-3">
            {decididos.map((item) => (
              <li
                key={item.user_id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-deep/10 bg-white p-4 shadow-sm"
              >
                {item.status === "approved" ? (
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle
                    className="h-5 w-5 shrink-0 text-deep/50"
                    aria-hidden="true"
                  />
                )}
                <span className="font-bold text-deep">{item.nome}</span>
                <span className="text-sm text-deep/60">
                  {item.documento_tipo} {item.documento}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

type Label = Record<string, string>;

function Selo({
  ok,
  texto,
}: {
  ok: boolean | null;
  texto: string;
}) {
  const cor =
    ok === true
      ? "bg-primary/10 text-primary"
      : ok === false
        ? "bg-accent/20 text-deep"
        : "bg-deep/5 text-deep/60";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${cor}`}
    >
      {ok === true && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
      {ok === false && <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
      {texto}
    </span>
  );
}

function Checagens({ checks, label }: { checks: KycChecks; label: Label }) {
  const r = checks.receita;
  return (
    <div className="mt-4 grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-deep">{label.digits}</span>
        <Selo
          ok={checks.document.digits_valid}
          texto={checks.document.digits_valid ? label.valid : label.invalid}
        />
        {checks.document.responsavel_cpf_valid !== null && (
          <Selo
            ok={checks.document.responsavel_cpf_valid}
            texto={`CPF resp. ${checks.document.responsavel_cpf_valid ? label.valid : label.invalid}`}
          />
        )}
      </div>

      {r && (
        <div className="rounded-xl bg-neutral/60 px-4 py-2.5 text-sm text-deep/70">
          <p className="font-bold text-deep">
            {label.receita}
            {r.source ? ` · ${r.source}` : ""}
          </p>
          {r.consulted && r.razao_social ? (
            <>
              <p className="mt-1">{r.razao_social}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2">
                <Selo
                  ok={r.situacao_cadastral === "ATIVA"}
                  texto={`${label.situacao}: ${r.situacao_cadastral ?? "?"}`}
                />
                {r.data_abertura && (
                  <span className="text-xs text-deep/50">
                    {label.opened} {r.data_abertura}
                  </span>
                )}
              </p>
              {r.cnae_codigo && (
                <p className="mt-1 text-xs text-deep/50">
                  {label.cnae} {r.cnae_codigo} · {r.cnae_descricao} (
                  {r.cnae_rural ? label.rural : label.notRural})
                </p>
              )}
            </>
          ) : (
            <p className="mt-1">{r.error ?? "—"}</p>
          )}
        </div>
      )}

      {checks.name_match && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-deep">{label.nameMatch}</span>
          <Selo
            ok={checks.name_match.compatible}
            texto={`${checks.name_match.compatible ? label.compatible : label.divergent} · ${checks.name_match.score}`}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-deep">{label.duplicate}</span>
        <Selo
          ok={
            !checks.duplicate.checked
              ? null
              : checks.duplicate.found
                ? false
                : true
          }
          texto={
            !checks.duplicate.checked
              ? label.dupUnchecked
              : checks.duplicate.found
                ? `${label.dupFound}: ${checks.duplicate.documents.join(", ")}`
                : label.dupNone
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-deep">{label.file}</span>
        <Selo
          ok={checks.file.ok}
          texto={
            checks.file.ok
              ? label.fileOk
              : checks.file.problems.join(", ") || "?"
          }
        />
        {checks.file.size_bytes != null && (
          <span className="text-xs text-deep/50">
            {Math.round(checks.file.size_bytes / 1024)} KB · {checks.file.mime}
          </span>
        )}
      </div>

      {checks.reasons.length > 0 && (
        <div className="rounded-xl bg-accent/20 px-4 py-2.5 text-sm text-deep">
          <p className="font-bold">{label.reasons}</p>
          <ul className="mt-1 list-disc pl-5">
            {checks.reasons.map((motivo, i) => (
              <li key={i}>{motivo}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CasoCard({ item, label }: { item: ItemFilaAdmin; label: Label }) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [rejeitando, setRejeitando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [linkErro, setLinkErro] = useState<string | null>(null);
  const [abrindo, setAbrindo] = useState(false);

  const Icone = item.tier === "pj_br" ? Building2 : UserRound;

  async function abrirDocumento(path: string) {
    setAbrindo(true);
    setLinkErro(null);
    const res = await linkDoDocumento(item.user_id, path);
    setAbrindo(false);
    if (!res.ok) {
      setLinkErro(res.error);
      return;
    }
    window.open(res.url, "_blank", "noopener,noreferrer");
  }

  function confirmar(acao: "aprovar" | "rejeitar") {
    setErro(null);
    if (acao === "rejeitar" && motivo.trim().length < 10) {
      setErro(label.reasonRequired);
      return;
    }
    startTransition(async () => {
      const res =
        acao === "aprovar"
          ? await aprovar(item.user_id, motivo)
          : await rejeitar(item.user_id, motivo);
      if (!res.ok) {
        setErro(
          res.error === "reason_required" ? label.reasonRequired : label.failed,
        );
        return;
      }
      // A action já revalidou o cache; isto redesenha a fila sem o caso.
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-deep/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Icone className="h-5 w-5 text-primary" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-extrabold text-deep">{item.nome}</p>
            <p className="text-sm text-deep/70">
              {item.documento_tipo} {item.documento}
            </p>
            {item.responsavel && (
              <p className="text-sm text-deep/60">{item.responsavel}</p>
            )}
            {item.email && (
              <p className="truncate text-sm text-deep/50">{item.email}</p>
            )}
          </div>
        </div>
        {item.doc_paths.length > 0 && (
          <div className="shrink-0 text-right">
            <button
              type="button"
              onClick={() => abrirDocumento(item.doc_paths[0])}
              disabled={abrindo}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark disabled:opacity-40"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              {abrindo ? label.opening : label.openDoc}
            </button>
            <p className="mt-1 text-xs text-deep/50">{label.linkNote}</p>
            {linkErro && (
              <p className="mt-1 text-xs font-semibold text-deep/70">{linkErro}</p>
            )}
          </div>
        )}
      </div>

      {item.checks ? (
        <Checagens checks={item.checks} label={label} />
      ) : (
        <p className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm text-deep/70">
          {label.noTriage}
        </p>
      )}

      <div className="mt-5 border-t border-deep/5 pt-4">
        {rejeitando ? (
          <div>
            <label className="block text-sm font-bold text-deep">
              {label.reasonLabel}
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder={label.reasonPlaceholder}
                className={inputCls}
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => confirmar("rejeitar")}
                disabled={pendente}
                className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-40"
              >
                {pendente ? label.working : label.confirmReject}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejeitando(false);
                  setErro(null);
                }}
                className="rounded-full border border-deep/20 px-3 py-1 text-xs font-bold text-deep"
              >
                {label.cancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => confirmar("aprovar")}
              disabled={pendente}
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-40"
            >
              {pendente ? label.working : label.approve}
            </button>
            <button
              type="button"
              onClick={() => setRejeitando(true)}
              className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-deep shadow-sm transition-colors hover:bg-accent-dark"
            >
              {label.reject}
            </button>
          </div>
        )}
        {erro && (
          <p className="mt-3 rounded-xl bg-accent/20 px-4 py-2.5 text-sm font-semibold text-deep">
            {erro}
          </p>
        )}
      </div>
    </div>
  );
}
