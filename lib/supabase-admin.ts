import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a SERVICE ROLE — ignora RLS por completo.
 *
 * REGRAS DE USO (não relaxar):
 *  • Só em código "use server". O `import "server-only"` acima faz o build
 *    QUEBRAR se algum componente client importar este arquivo, mesmo que
 *    por engano, numa cadeia de imports longa.
 *  • A chave vem de SUPABASE_SERVICE_ROLE_KEY — sem prefixo NEXT_PUBLIC_,
 *    portanto nunca é embarcada no bundle do browser.
 *  • Nunca antes de uma checagem de autorização. Nas rotas de admin, a ordem
 *    é sempre: conferir a sessão → conferir a allowlist → só então isto.
 *
 * Retorna null quando a chave não está configurada. Todo chamador precisa
 * tratar o null degradando com segurança (sem auto-aprovar, sem abrir fila),
 * nunca ignorando — é o que mantém o app inerte antes da configuração.
 */
export function getAdminSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
