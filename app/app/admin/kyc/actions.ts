"use server";

import { revalidatePath } from "next/cache";

import { getKycAdmin } from "@/lib/kyc-admin";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { registrarAuditoria } from "@/lib/kyc-triage";
import { sendMail } from "@/lib/mailer";
import { emailAprovado, emailRejeitado } from "@/lib/kyc-emails";
import {
  formatCnpjForDisplay,
  maskCpfForDisplay,
  type KycChecks,
} from "@/lib/kyc-checks";

/**
 * Server actions do painel de triagem.
 *
 * TODA função aqui começa por `getKycAdmin()`. Server action é endpoint HTTP
 * público: quem descobrir o id da action consegue chamá-la direto, sem nunca
 * abrir a página. A checagem da página não protege a action — só a checagem
 * da própria action protege.
 *
 * A recusa é sempre o mesmo `{ ok: false, error: "forbidden" }`, sem dizer se
 * o problema foi não estar logado, não ser admin ou a rota não existir.
 */

const BUCKET = "kyc-docs";
const VALIDADE_LINK_S = 300; // 5 minutos

export type ItemFilaAdmin = {
  user_id: string;
  tier: string;
  status: string;
  nome: string;
  responsavel: string | null;
  documento: string;
  documento_tipo: "CPF" | "CNPJ";
  nascimento: string | null;
  email: string | null;
  submitted_at: string | null;
  created_at: string | null;
  doc_paths: string[];
  checks: KycChecks | null;
};

export type FilaResult =
  | { ok: true; itens: ItemFilaAdmin[] }
  | { ok: false; error: string };

function montarItem(linha: Record<string, unknown>): ItemFilaAdmin {
  const d = (linha.data ?? {}) as Record<string, unknown>;
  const cnpj = typeof d.cnpj === "string" ? d.cnpj : null;
  const cpf = typeof d.cpf === "string" ? d.cpf : null;
  const checks = linha.checks as KycChecks | null | undefined;

  return {
    user_id: String(linha.user_id ?? ""),
    tier: String(linha.tier ?? ""),
    status: String(linha.status ?? "pending"),
    nome:
      (typeof d.razao_social === "string" && d.razao_social) ||
      (typeof d.full_name === "string" && d.full_name) ||
      "(sem nome)",
    responsavel:
      typeof d.responsavel_nome === "string" ? d.responsavel_nome : null,
    // O admin precisa do documento INTEIRO para conferir contra a foto — é a
    // razão de ser da tela. Fora daqui (e-mails, logs, auditoria) o CPF só
    // circula mascarado.
    documento: cnpj
      ? formatCnpjForDisplay(cnpj)
      : cpf
        ? cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
        : "(sem documento)",
    documento_tipo: cnpj ? "CNPJ" : "CPF",
    nascimento: typeof d.birth_date === "string" ? d.birth_date : null,
    email: typeof linha.notify_email === "string" ? linha.notify_email : null,
    submitted_at:
      typeof linha.submitted_at === "string" ? linha.submitted_at : null,
    created_at: typeof linha.created_at === "string" ? linha.created_at : null,
    doc_paths: Array.isArray(linha.doc_paths)
      ? linha.doc_paths.filter((p): p is string => typeof p === "string")
      : [],
    checks:
      checks && typeof checks === "object" && Object.keys(checks).length
        ? checks
        : null,
  };
}

/** Casos esperando decisão humana, do mais antigo para o mais novo. */
export async function listarFila(): Promise<FilaResult> {
  const admin = await getKycAdmin();
  if (!admin) return { ok: false, error: "forbidden" };

  const db = getAdminSupabase();
  if (!db) return { ok: false, error: "service_role_missing" };

  const { data, error } = await db
    .from("kyc_profiles")
    .select("*")
    .in("status", ["pending", "in_review"])
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    itens: (data ?? []).map((linha) => montarItem(linha as Record<string, unknown>)),
  };
}

/** Últimas decisões, para o admin conferir o que já passou (e a auditoria). */
export async function listarDecididos(): Promise<FilaResult> {
  const admin = await getKycAdmin();
  if (!admin) return { ok: false, error: "forbidden" };

  const db = getAdminSupabase();
  if (!db) return { ok: false, error: "service_role_missing" };

  const { data, error } = await db
    .from("kyc_profiles")
    .select("*")
    .in("status", ["approved", "rejected"])
    .order("reviewed_at", { ascending: false, nullsFirst: false })
    .limit(20);

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    itens: (data ?? []).map((linha) => montarItem(linha as Record<string, unknown>)),
  };
}

export type LinkResult =
  | { ok: true; url: string; expiraEm: number }
  | { ok: false; error: string };

/**
 * URL assinada e temporária para o documento. O bucket é privado: sem esta
 * assinatura o objeto não é alcançável por ninguém além do próprio dono.
 * Cada geração vira uma linha 'view_doc' na auditoria — acesso a documento
 * de identidade também é acesso a dado sensível, e fica registrado.
 */
export async function linkDoDocumento(
  userId: string,
  path: string,
): Promise<LinkResult> {
  const admin = await getKycAdmin();
  if (!admin) return { ok: false, error: "forbidden" };

  const db = getAdminSupabase();
  if (!db) return { ok: false, error: "service_role_missing" };

  // O caminho precisa pertencer ao usuário do caso: sem isto, um admin (ou
  // quem roubasse a sessão dele) poderia pedir assinatura de qualquer objeto
  // do bucket passando um path arbitrário.
  if (!path.startsWith(`${userId}/`)) return { ok: false, error: "invalid_path" };

  const { data, error } = await db.storage
    .from(BUCKET)
    .createSignedUrl(path, VALIDADE_LINK_S);
  if (error || !data?.signedUrl)
    return { ok: false, error: error?.message ?? "sign_failed" };

  await registrarAuditoria(db, {
    subject_id: userId,
    admin_id: admin.id,
    action: "view_doc",
    reason: path,
    checks: {},
  });

  return { ok: true, url: data.signedUrl, expiraEm: VALIDADE_LINK_S };
}

export type DecisaoResult = { ok: boolean; error?: string };

async function decidir(
  userId: string,
  status: "approved" | "rejected",
  motivo: string,
): Promise<DecisaoResult> {
  const admin = await getKycAdmin();
  if (!admin) return { ok: false, error: "forbidden" };

  const db = getAdminSupabase();
  if (!db) return { ok: false, error: "service_role_missing" };

  const razao = motivo.trim().slice(0, 1000);
  if (status === "rejected" && razao.length < 10)
    return { ok: false, error: "reason_required" };

  const { data: antes, error: erroLeitura } = await db
    .from("kyc_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (erroLeitura) return { ok: false, error: erroLeitura.message };
  if (!antes) return { ok: false, error: "not_found" };

  const agora = new Date().toISOString();
  const { error } = await db
    .from("kyc_profiles")
    .update({
      status,
      decided_by: "admin",
      decided_by_user_id: admin.id,
      decision_reason: razao || null,
      reviewed_at: agora,
      updated_at: agora,
    })
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };

  const linha = antes as Record<string, unknown>;
  await registrarAuditoria(db, {
    subject_id: userId,
    admin_id: admin.id,
    action: status === "approved" ? "approve" : "reject",
    reason: razao || null,
    checks: linha.checks ?? {},
  });

  // Notificação: nunca derruba a decisão. Já está gravada no banco.
  const destino =
    (typeof linha.notify_email === "string" && linha.notify_email) || null;
  if (destino) {
    await sendMail(
      status === "approved"
        ? emailAprovado(destino, false)
        : emailRejeitado(destino, razao),
    );
  } else {
    console.info(
      "[kyc] decisao gravada sem e-mail de contato para",
      maskCpfForDisplay(String((linha.data as Record<string, unknown>)?.cpf ?? "")),
    );
  }

  revalidatePath("/app/admin/kyc");
  return { ok: true };
}

export async function aprovar(
  userId: string,
  motivo: string,
): Promise<DecisaoResult> {
  return decidir(
    userId,
    "approved",
    motivo.trim() || "Aprovado manualmente na revisao do painel.",
  );
}

export async function rejeitar(
  userId: string,
  motivo: string,
): Promise<DecisaoResult> {
  return decidir(userId, "rejected", motivo);
}
