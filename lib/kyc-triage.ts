import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { sendMail } from "@/lib/mailer";
import { emailAprovado, emailFilaAdmin, type ItemFila } from "@/lib/kyc-emails";
import {
  checarArquivo,
  decide,
  consultarReceita,
  formatCnpjForDisplay,
  maskCpfForDisplay,
  motivoAutoAprovacao,
  type DuplicateCheck,
  type FileCheck,
  type KycChecks,
} from "@/lib/kyc-checks";

/**
 * A TRIAGEM propriamente dita — a parte que precisa do banco e do storage.
 * A regra de decisão pura mora em lib/kyc-checks.ts; aqui só se levantam os
 * fatos que ela pede e se grava o resultado.
 *
 * Toda função deste arquivo é BEST-EFFORT: se o banco engasgar, se a Receita
 * cair, se o SMTP recusar, a submissão do usuário continua valendo e o caso
 * cai na fila humana. Falha de infraestrutura nunca vira reprovação nem
 * aprovação — vira revisão manual.
 */

const BUCKET = "kyc-docs";

// ──────────────────────── 1.4 sanidade do arquivo ───────────────────────────

type ObjetoStorage = { name: string; metadata?: unknown };

function lerMetadados(meta: unknown): { size: number | null; mime: string | null } {
  if (!meta || typeof meta !== "object") return { size: null, mime: null };
  const m = meta as Record<string, unknown>;
  return {
    size: typeof m.size === "number" ? m.size : null,
    mime: typeof m.mimetype === "string" ? m.mimetype : null,
  };
}

/**
 * Lê tamanho e tipo do objeto no bucket, SEM baixar o arquivo. Roda com a
 * sessão do próprio usuário (a policy do storage já o restringe à pasta
 * dele), então funciona mesmo sem service role.
 */
export async function checarArquivoNoBucket(
  client: SupabaseClient,
  path: string,
): Promise<FileCheck> {
  const partes = path.split("/");
  const nome = partes.pop() ?? "";
  const pasta = partes.join("/");
  try {
    const { data, error } = await client.storage
      .from(BUCKET)
      .list(pasta, { limit: 100, search: nome });
    if (error) return checarArquivo(null);
    const alvo = (data as ObjetoStorage[] | null)?.find((o) => o.name === nome);
    if (!alvo) return checarArquivo(null);
    return checarArquivo(lerMetadados(alvo.metadata));
  } catch {
    return checarArquivo(null);
  }
}

// ───────────────────────────── 1.3 duplicidade ──────────────────────────────

export type DocsParaChecar = {
  cpf?: string;
  cnpj?: string;
  responsavel_cpf?: string;
};

/**
 * "Este documento já foi aprovado em OUTRA conta?"
 *
 * Precisa da service role: com a anon key, a RLS de kyc_profiles esconde as
 * linhas alheias — que é exatamente o comportamento certo, e o motivo de a
 * checagem não poder rodar do lado do cliente. Sem service role a resposta é
 * `checked: false`, e "não sei" manda o caso para a fila humana.
 *
 * O CPF do responsável de uma PJ entra na checagem de propósito: a mesma
 * pessoa abrindo uma segunda conta em nome de outra empresa é um caso
 * legítimo, mas é exatamente o caso que um humano precisa olhar. Duplicidade
 * nunca reprova ninguém — só tira do automático.
 */
export async function checarDuplicidade(
  admin: SupabaseClient | null,
  userId: string,
  docs: DocsParaChecar,
): Promise<DuplicateCheck> {
  if (!admin) return { checked: false, found: false, documents: [] };

  const alvos: { coluna: string; valor: string; rotulo: string }[] = [];
  if (docs.cpf)
    alvos.push({
      coluna: "data->>cpf",
      valor: docs.cpf,
      rotulo: `CPF ${maskCpfForDisplay(docs.cpf)}`,
    });
  if (docs.cnpj)
    alvos.push({
      coluna: "data->>cnpj",
      valor: docs.cnpj,
      rotulo: `CNPJ ${formatCnpjForDisplay(docs.cnpj)}`,
    });
  if (docs.responsavel_cpf) {
    // O CPF do responsável pode ter sido cadastrado como titular de uma PF
    // ou como responsável de outra PJ: as duas colunas contam.
    alvos.push({
      coluna: "data->>cpf",
      valor: docs.responsavel_cpf,
      rotulo: `CPF do responsavel ${maskCpfForDisplay(docs.responsavel_cpf)}`,
    });
    alvos.push({
      coluna: "data->>responsavel_cpf",
      valor: docs.responsavel_cpf,
      rotulo: `CPF do responsavel ${maskCpfForDisplay(docs.responsavel_cpf)}`,
    });
  }

  const encontrados = new Set<string>();
  for (const alvo of alvos) {
    const { data, error } = await admin
      .from("kyc_profiles")
      .select("user_id")
      .eq("status", "approved")
      .eq(alvo.coluna, alvo.valor)
      .neq("user_id", userId)
      .limit(1);
    // Erro de consulta = "não sei". Melhor mandar para a fila do que decidir
    // com informação que não temos.
    if (error) return { checked: false, found: false, documents: [] };
    if (data && data.length) encontrados.add(alvo.rotulo);
  }

  return {
    checked: true,
    found: encontrados.size > 0,
    documents: [...encontrados],
  };
}

// ─────────────────────── orquestração da submissão ──────────────────────────

export type EntradaTriagem =
  | {
      tier: "pf_br";
      userId: string;
      email: string | null;
      docPath: string;
      dados: { full_name: string; cpf: string };
    }
  | {
      tier: "pj_br";
      userId: string;
      email: string | null;
      docPath: string;
      dados: { razao_social: string; cnpj: string; responsavel_cpf: string };
    };

export type ResultadoTriagem = {
  checks: KycChecks;
  status: "in_review" | "approved";
  decision_reason: string | null;
};

/** Levanta os fatos e aplica a regra. Não escreve nada. */
export async function rodarChecagens(
  userClient: SupabaseClient,
  admin: SupabaseClient | null,
  entrada: EntradaTriagem,
): Promise<ResultadoTriagem> {
  const file = await checarArquivoNoBucket(userClient, entrada.docPath);

  if (entrada.tier === "pf_br") {
    const duplicate = await checarDuplicidade(admin, entrada.userId, {
      cpf: entrada.dados.cpf,
    });
    const checks = decide({
      tier: "pf_br",
      cpf: entrada.dados.cpf,
      full_name: entrada.dados.full_name,
      duplicate,
      file,
    });
    return { checks, status: "in_review", decision_reason: null };
  }

  // As duas chamadas de rede são independentes: rodam juntas para não somar
  // os timeouts dentro da espera do usuário.
  const [receita, duplicate] = await Promise.all([
    consultarReceita(entrada.dados.cnpj),
    checarDuplicidade(admin, entrada.userId, {
      cnpj: entrada.dados.cnpj,
      responsavel_cpf: entrada.dados.responsavel_cpf,
    }),
  ]);

  const checks = decide({
    tier: "pj_br",
    cnpj: entrada.dados.cnpj,
    razao_social: entrada.dados.razao_social,
    responsavel_cpf: entrada.dados.responsavel_cpf,
    receita,
    duplicate,
    file,
  });

  // Auto-aprovar exige service role: a policy de UPDATE do cliente trava o
  // status em 'pending'/'in_review', e é essa trava que impede alguém de se
  // auto-aprovar batendo direto no Supabase com a anon key.
  if (checks.auto_approved && admin) {
    return {
      checks,
      status: "approved",
      decision_reason: motivoAutoAprovacao(checks),
    };
  }
  if (checks.auto_approved && !admin) {
    return {
      checks: {
        ...checks,
        auto_approved: false,
        reasons: [
          ...checks.reasons,
          "Checagens automaticas passaram, mas a aprovacao automatica esta desligada (SUPABASE_SERVICE_ROLE_KEY ausente).",
        ],
      },
      status: "in_review",
      decision_reason: null,
    };
  }
  return { checks, status: "in_review", decision_reason: null };
}

/**
 * Grava o resultado na linha de KYC.
 *
 * Escreve com a service role quando ela existe (é o que permite gravar
 * 'approved'); sem ela, cai para a sessão do próprio usuário e o status fica
 * no máximo 'in_review'. Se as colunas novas ainda não existirem — migration
 * não aplicada — o UPDATE falha e a função devolve false SEM quebrar nada: a
 * linha continua 'pending' na fila manual, que é o comportamento de hoje.
 */
export async function gravarResultado(
  userClient: SupabaseClient,
  admin: SupabaseClient | null,
  userId: string,
  email: string | null,
  resultado: ResultadoTriagem,
): Promise<boolean> {
  const escritor = admin ?? userClient;
  const status = admin ? resultado.status : "in_review";
  const agora = new Date().toISOString();

  const { error } = await escritor
    .from("kyc_profiles")
    .update({
      status,
      checks: resultado.checks,
      notify_email: email,
      submitted_at: agora,
      updated_at: agora,
      decided_by: status === "approved" ? "automatico" : null,
      decision_reason: status === "approved" ? resultado.decision_reason : null,
      reviewed_at: status === "approved" ? agora : null,
    })
    .eq("user_id", userId);

  if (error) {
    console.error("[kyc] nao foi possivel gravar a triagem:", error.message);
    return false;
  }

  if (status === "approved") {
    await registrarAuditoria(admin, {
      subject_id: userId,
      admin_id: null,
      action: "auto_approve",
      reason: resultado.decision_reason,
      checks: resultado.checks,
    });
    if (email) await sendMail(emailAprovado(email, true));
  } else {
    await registrarAuditoria(admin, {
      subject_id: userId,
      admin_id: null,
      action: "triage",
      reason: resultado.checks.reasons.join(" "),
      checks: resultado.checks,
    });
    await avisarAdminDaFila(admin);
  }
  return true;
}

// ───────────────────────────── auditoria ────────────────────────────────────

export type EntradaAuditoria = {
  subject_id: string;
  admin_id: string | null;
  action: "triage" | "auto_approve" | "view_doc" | "approve" | "reject";
  reason: string | null;
  checks: unknown;
};

/** Insere a linha de auditoria. Só a service role escreve em kyc_reviews. */
export async function registrarAuditoria(
  admin: SupabaseClient | null,
  entrada: EntradaAuditoria,
): Promise<void> {
  if (!admin) return;
  const { error } = await admin.from("kyc_reviews").insert({
    subject_id: entrada.subject_id,
    admin_id: entrada.admin_id,
    action: entrada.action,
    reason: entrada.reason,
    checks: entrada.checks ?? {},
  });
  if (error) console.error("[kyc] auditoria nao gravada:", error.message);
}

// ──────────────────────── 4.1 aviso agrupado ao admin ───────────────────────

const JANELA_PADRAO_MIN = 15;

/**
 * Avisa o admin de que há caso humano na fila — no máximo um e-mail por
 * janela (PALMO_KYC_ADMIN_NOTIFY_WINDOW_MIN, padrão 15 minutos).
 *
 * O agrupamento não perde caso nenhum porque o e-mail resume a fila INTEIRA,
 * não o caso que acabou de chegar: se três chegam em cinco minutos, o
 * primeiro e-mail já lista os três (ou o próximo, depois da janela, lista o
 * que sobrou). O livro kyc_notifications é o que dá memória entre requisições.
 */
export async function avisarAdminDaFila(
  admin: SupabaseClient | null,
): Promise<void> {
  const destino = process.env.PALMO_ADMIN_EMAIL;
  if (!admin || !destino) return;

  const janela =
    Number(process.env.PALMO_KYC_ADMIN_NOTIFY_WINDOW_MIN ?? JANELA_PADRAO_MIN) ||
    JANELA_PADRAO_MIN;
  const desde = new Date(Date.now() - janela * 60_000).toISOString();

  const { data: recentes, error: erroLivro } = await admin
    .from("kyc_notifications")
    .select("id")
    .eq("kind", "admin_queue")
    .gte("sent_at", desde)
    .limit(1);
  // Livro inacessível (migration não aplicada) = não avisa. Preferimos o
  // silêncio a inundar a caixa do admin a cada submissão.
  if (erroLivro) return;
  if (recentes && recentes.length) return;

  const { data: fila, error } = await admin
    .from("kyc_profiles")
    .select("user_id, tier, data, checks, submitted_at")
    .in("status", ["pending", "in_review"])
    .order("submitted_at", { ascending: true, nullsFirst: true })
    .limit(50);
  if (error || !fila || !fila.length) return;

  const itens: ItemFila[] = fila.map((linha) => {
    const d = (linha.data ?? {}) as Record<string, unknown>;
    const checks = (linha.checks ?? {}) as { reasons?: unknown };
    const nome =
      (typeof d.razao_social === "string" && d.razao_social) ||
      (typeof d.full_name === "string" && d.full_name) ||
      "(sem nome)";
    const documento =
      typeof d.cnpj === "string"
        ? `CNPJ ${formatCnpjForDisplay(d.cnpj)}`
        : typeof d.cpf === "string"
          ? `CPF ${maskCpfForDisplay(d.cpf)}`
          : "(sem documento)";
    const motivos = Array.isArray(checks.reasons)
      ? checks.reasons.filter((r): r is string => typeof r === "string")
      : [];
    return { nome, documento, motivos };
  });

  const enviado = await sendMail(emailFilaAdmin(destino, itens));
  if (!enviado.ok) return;

  await admin.from("kyc_notifications").insert({
    kind: "admin_queue",
    payload: { total: itens.length },
  });
}
