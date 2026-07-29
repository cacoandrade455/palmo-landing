import "server-only";

import { getServerSupabase } from "@/lib/supabase-server";

/**
 * Quem pode abrir a fila de KYC.
 *
 * A allowlist mora em PALMO_KYC_ADMIN_IDS (server-only, sem NEXT_PUBLIC_):
 * uma lista de user_ids do Supabase separada por vírgula, espaço ou quebra
 * de linha. Fora dela, ninguém é admin — inclusive quando a variável não
 * existe, e é assim que a rota fica inerte em produção até o Carlos decidir.
 *
 * Por que variável de ambiente e não uma tabela: um INSERT indevido no banco
 * (ou uma policy escrita errado) não deve ser capaz de criar um admin. Mudar
 * a allowlist exige acesso ao painel da Vercel e um redeploy.
 */
function allowlist(): string[] {
  return (process.env.PALMO_KYC_ADMIN_IDS ?? "")
    .split(/[\s,]+/)
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminId(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return allowlist().includes(userId.toLowerCase());
}

export type AdminIdentity = { id: string; email: string | null };

/**
 * Identidade do admin logado, ou null. Null cobre TODOS os casos de recusa —
 * Supabase não configurado, ninguém logado, logado mas fora da allowlist —
 * de propósito: quem chama não deve conseguir distinguir "você não é admin"
 * de "esta rota não existe". Toda página e toda server action de /app/admin
 * começa por aqui.
 */
export async function getKycAdmin(): Promise<AdminIdentity | null> {
  if (allowlist().length === 0) return null;

  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminId(user.id)) return null;

  return { id: user.id, email: user.email ?? null };
}
