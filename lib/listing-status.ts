/**
 * MUDANÇA DE SITUAÇÃO DO ANÚNCIO — e o registro que sustenta a Cláusula 3.
 *
 * Módulo compartilhado porque DUAS telas mudam status (o painel da conta e a
 * tela de edição). Duas cópias seriam duas verdades sobre quando a prova é
 * gravada, e a que some é sempre a que importava.
 *
 * ── POR QUE PAUSAR/ARQUIVAR COM PROPOSTA ACEITA É REGISTRADO ─────────────────
 * Fechar negócio por fora tem assinatura no banco: proposta ACEITA, conversa que
 * nunca chega a `closed`, e depois o anúncio sai do ar. Cada passo é
 * individualmente legítimo — proposta aceita e depois o dono desistiu de
 * anunciar é uma sequência inocente e comum. O que interessa é que a SEQUÊNCIA
 * fique registrada, para que, se a Cláusula 3.4 precisar ser invocada, o
 * registro exista e esteja íntegro.
 *
 * Isto NÃO bloqueia a ação, NÃO acusa ninguém e NÃO aparece em página pública.
 * É prova, não acusação.
 */

import "server-only";

import { getAdminSupabase } from "./supabase-admin";

/** Transições permitidas ao proprietário. `closed` pertence ao contrato. */
export type StatusDoDono = "draft" | "active" | "paused" | "archived";

/**
 * `field` gravado em `listing_changes` quando o anúncio sai do ar EXISTINDO
 * proposta aceita. Valor estável: é por ele que a consulta de auditoria filtra.
 *
 * Usa o domínio de `categoria` que já existe (`livre|car|contrato`) em vez de
 * pedir um valor novo no check constraint. Motivo prático: se a migration que
 * ampliasse o domínio não estivesse aplicada, o INSERT falharia e o evento de
 * prova seria perdido em silêncio — exatamente o que não pode acontecer com a
 * linha cuja razão de existir é ser prova.
 */
export const CAMPO_SAIDA_COM_PROPOSTA_ACEITA = "status_com_proposta_aceita";

export type MudarStatusResultado = { ok: true } | { ok: false; error: string };

/**
 * Muda a situação do anúncio, conferindo o dono NO SERVIDOR, e registra a
 * mudança em `listing_changes`.
 *
 * Nunca lança. Falha de registro não desfaz a mudança de status: o dono pediu
 * para pausar, e pausar é direito dele.
 */
export async function mudarStatus(
  listingId: string,
  userId: string,
  novo: StatusDoDono,
): Promise<MudarStatusResultado> {
  const db = getAdminSupabase();
  if (!db) return { ok: false, error: "service_role_missing" };

  const { data: atual } = await db
    .from("listings")
    .select("owner_id, status")
    .eq("id", listingId)
    .maybeSingle();
  // Anúncio de outro dono responde igual a anúncio inexistente.
  if (!atual || atual.owner_id !== userId) return { ok: false, error: "not_found" };

  // De `closed` o proprietário não sai: aquele estado é do fluxo do contrato, e
  // mexer nele daqui seria contornar o gate de contato.
  if (atual.status === "closed") return { ok: false, error: "estado_do_contrato" };
  if (atual.status === novo) return { ok: true };

  // Existe proposta aceita neste anúncio? Consultado ANTES de mudar o status,
  // para o registro descrever o estado no instante da ação.
  let temPropostaAceita = false;
  if (novo === "paused" || novo === "archived") {
    const { data: aceita } = await db
      .from("offers")
      .select("id")
      .eq("listing_id", listingId)
      .eq("status", "accepted")
      .limit(1)
      .maybeSingle();
    temPropostaAceita = !!aceita;
  }

  const { error } = await db
    .from("listings")
    .update({ status: novo })
    .eq("id", listingId)
    .eq("owner_id", userId);
  if (error) return { ok: false, error: error.message };

  // Service role: `listing_changes` não tem policy de INSERT para ninguém —
  // registro que o próprio autor pode escrever à mão não é registro.
  await db.from("listing_changes").insert({
    listing_id: listingId,
    actor_id: userId,
    field: temPropostaAceita ? CAMPO_SAIDA_COM_PROPOSTA_ACEITA : "status",
    old_value: atual.status,
    new_value: novo,
    // 'contrato' no caso de proposta aceita: a saída do ar passa a ter peso
    // contratual. Nos outros casos é mudança livre de vitrine.
    categoria: temPropostaAceita ? "contrato" : "livre",
  });

  return { ok: true };
}
