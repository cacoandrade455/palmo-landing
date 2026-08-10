"use server";

import { getServerSupabase } from "@/lib/supabase-server";
import { UFS } from "@/lib/appraisal-data";

/**
 * Registra o interesse de um usuário logado por terras em uma região
 * (UF obrigatória; município e finalidade opcionais). É acionada pelo
 * estado vazio do /explorar: "avisar quando aparecer terra assim".
 *
 * A tabela `region_interests` nasce na migration
 * `supabase/20260811-divida-tecnica.sql`. Até o Carlos aplicá-la, o insert
 * falha (42P01, relação inexistente) e a action degrada com elegância
 * devolvendo { ok: false, error: "unavailable" } — nunca lança.
 */
export async function registerRegionInterest(input: {
  state: string;
  municipality?: string | null;
  purpose?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await getServerSupabase();
    if (!supabase) return { ok: false, error: "unavailable" };

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "not_signed_in" };

    const state = (input.state ?? "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(state) || !UFS.includes(state))
      return { ok: false, error: "invalid_state" };

    const municipality = input.municipality?.trim() || null;
    const purpose = input.purpose?.trim() || null;

    const { error } = await supabase.from("region_interests").insert({
      user_id: user.id,
      state,
      municipality,
      purpose,
    });
    // 23505 = já existe interesse idêntico deste usuário (índice de
    // unicidade da migration): para quem clicou, isso é sucesso, não erro.
    if (error && error.code === "23505") return { ok: true };
    if (error) return { ok: false, error: "unavailable" };

    return { ok: true };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}
