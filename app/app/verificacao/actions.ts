"use server";

import { getServerSupabase } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { gravarResultado, rodarChecagens } from "@/lib/kyc-triage";
import { isValidCnpj, isValidCpf, onlyDigits } from "./br-docs";

export type KycSummary = {
  tier: string;
  status: string;
  /** Texto que o admin (ou a regra automática) deixou. Nulo antes da migration. */
  decision_reason?: string | null;
};

export type KycStatusResult =
  | { ok: true; kyc: KycSummary | null }
  | { ok: false; error: string };

/**
 * Situação de KYC do usuário logado (qualquer tier). RLS garante que cada
 * um só enxerga a própria linha. Usado aqui e no card da página de conta.
 *
 * `select("*")` de propósito: a linha é do próprio usuário (nada de terceiro
 * passa por aqui) e assim a leitura não quebra nem antes nem depois da
 * migration da triagem, que acrescenta colunas.
 */
export async function getMyKyc(): Promise<KycStatusResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const { data, error } = await supabase
    .from("kyc_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: true, kyc: null };

  const linha = data as Record<string, unknown>;
  return {
    ok: true,
    kyc: {
      tier: String(linha.tier ?? ""),
      status: String(linha.status ?? "pending"),
      decision_reason:
        typeof linha.decision_reason === "string" ? linha.decision_reason : null,
    },
  };
}

export type BrKycInput =
  | {
      tier: "pf_br";
      data: { full_name: string; cpf: string; birth_date: string };
      docPaths: string[];
    }
  | {
      tier: "pj_br";
      data: {
        razao_social: string;
        cnpj: string;
        responsavel_nome: string;
        responsavel_cpf: string;
      };
      docPaths: string[];
    };

export type BrKycResult = {
  ok: boolean;
  error?: string;
  /** Situação final logo após a triagem — a tela mostra o cartão certo na hora. */
  status?: "pending" | "in_review" | "approved";
};

const clean = (v: string) => v.trim().slice(0, 300);

/**
 * Recebe a verificação brasileira e roda a TRIAGEM.
 *
 * O documento já foi enviado pelo cliente para a pasta privada
 * kyc-docs/{user.id}/ (a RLS do storage restringe cada usuário à própria
 * pasta); aqui só persistimos os caminhos.
 *
 * Ordem, e o porquê dela:
 *   1. grava a linha como 'pending' com o formato ANTIGO. É o único passo que
 *      não pode falhar: funciona com ou sem a migration da triagem aplicada,
 *      e garante que nenhuma submissão se perde se a etapa 2 explodir.
 *   2. roda as checagens (dígito, Receita, duplicidade, arquivo) e grava o
 *      resultado. Best-effort: qualquer erro aqui deixa o caso em 'pending',
 *      que é a fila humana — o comportamento anterior a este lote.
 *
 * Só a PJ limpa sai daqui aprovada. Nada sai rejeitado: rejeitar é humano.
 */
export async function submitBrKyc(input: BrKycInput): Promise<BrKycResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  if (!input.docPaths.length) return { ok: false, error: "missing_docs" };
  if (input.docPaths.some((p) => !p.startsWith(`${user.id}/`)))
    return { ok: false, error: "invalid_doc_path" };

  let data: Record<string, unknown>;
  if (input.tier === "pf_br") {
    const { full_name, cpf, birth_date } = input.data;
    if (!full_name.trim() || !birth_date) return { ok: false, error: "missing_fields" };
    if (!isValidCpf(cpf)) return { ok: false, error: "invalid_cpf" };
    data = {
      full_name: clean(full_name),
      cpf: onlyDigits(cpf),
      birth_date,
    };
  } else if (input.tier === "pj_br") {
    const { razao_social, cnpj, responsavel_nome, responsavel_cpf } = input.data;
    if (!razao_social.trim() || !responsavel_nome.trim())
      return { ok: false, error: "missing_fields" };
    if (!isValidCnpj(cnpj)) return { ok: false, error: "invalid_cnpj" };
    if (!isValidCpf(responsavel_cpf)) return { ok: false, error: "invalid_cpf" };
    data = {
      razao_social: clean(razao_social),
      cnpj: onlyDigits(cnpj),
      responsavel_nome: clean(responsavel_nome),
      responsavel_cpf: onlyDigits(responsavel_cpf),
    };
  } else {
    return { ok: false, error: "invalid_tier" };
  }

  const docPaths = input.docPaths.slice(0, 5);

  // ── 1) a submissão em si (formato compatível com o schema pré-triagem) ──
  const { error } = await supabase.from("kyc_profiles").upsert(
    {
      user_id: user.id,
      tier: input.tier,
      status: "pending",
      country: "BR",
      data,
      doc_paths: docPaths,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, error: error.message };

  // ── 2) a triagem (best-effort; nunca derruba a submissão) ──
  try {
    const admin = getAdminSupabase();
    const resultado = await rodarChecagens(
      supabase,
      admin,
      input.tier === "pf_br"
        ? {
            tier: "pf_br",
            userId: user.id,
            email: user.email ?? null,
            docPath: docPaths[0],
            dados: {
              full_name: String(data.full_name),
              cpf: String(data.cpf),
            },
          }
        : {
            tier: "pj_br",
            userId: user.id,
            email: user.email ?? null,
            docPath: docPaths[0],
            dados: {
              razao_social: String(data.razao_social),
              cnpj: String(data.cnpj),
              responsavel_cpf: String(data.responsavel_cpf),
            },
          },
    );

    const gravou = await gravarResultado(
      supabase,
      admin,
      user.id,
      user.email ?? null,
      resultado,
    );
    if (!gravou) return { ok: true, status: "pending" };
    return { ok: true, status: admin ? resultado.status : "in_review" };
  } catch (e) {
    console.error("[kyc] triagem falhou; caso segue na fila manual:", e);
    return { ok: true, status: "pending" };
  }
}
