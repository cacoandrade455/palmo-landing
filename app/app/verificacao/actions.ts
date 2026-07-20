"use server";

import { getServerSupabase } from "@/lib/supabase-server";
import { isValidCnpj, isValidCpf, onlyDigits } from "./br-docs";

export type KycSummary = { tier: string; status: string };

export type KycStatusResult =
  | { ok: true; kyc: KycSummary | null }
  | { ok: false; error: string };

/**
 * Situação de KYC do usuário logado (qualquer tier). RLS garante que cada
 * um só enxerga a própria linha. Usado aqui e no card da página de conta.
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
    .select("tier, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  return { ok: true, kyc: (data as KycSummary | null) ?? null };
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

const clean = (v: string) => v.trim().slice(0, 300);

/**
 * Grava a verificação brasileira como 'pending'. O documento já foi enviado
 * pelo cliente para a pasta privada kyc-docs/{user.id}/ (RLS do storage
 * restringe cada usuário à própria pasta); aqui só persistimos os caminhos.
 * Revisão manual do fundador via Supabase (v1) — sem painel de aprovação.
 */
export async function submitBrKyc(
  input: BrKycInput,
): Promise<{ ok: boolean; error?: string }> {
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

  const { error } = await supabase.from("kyc_profiles").upsert(
    {
      user_id: user.id,
      tier: input.tier,
      status: "pending",
      country: "BR",
      data,
      doc_paths: input.docPaths.slice(0, 5),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return error ? { ok: false, error: error.message } : { ok: true };
}
