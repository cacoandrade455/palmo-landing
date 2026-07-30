"use server";

import { getServerSupabase } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";

export type ConvMessage = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ConvOffer = {
  id: string;
  from_id: string;
  price_per_ha_year: number;
  term_years: number | null;
  message: string | null;
  status: string;
  created_at: string;
};

export type ConvData = {
  id: string;
  listing_id: string;
  listingTitle: string;
  deal_status: string;
  myId: string;
  iAmOwner: boolean;
  counterpartName: string | null;
  messages: ConvMessage[];
  offers: ConvOffer[];
  // contract for this conversation, if the draft has been generated
  contractId: string | null;
  // contact only present when deal_status === 'closed'
  contact: { full_name: string | null; phone: string | null; email: string | null } | null;
};

export async function getConversation(
  id: string,
): Promise<{ ok: true; data: ConvData } | { ok: false; error: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const { data: conv, error } = await supabase
    .from("conversations")
    .select("id, listing_id, developer_id, owner_id, deal_status")
    .eq("id", id)
    .single();
  if (error || !conv) return { ok: false, error: "not_found" };

  const iAmOwner = conv.owner_id === user.id;
  const otherId = iAmOwner ? conv.developer_id : conv.owner_id;

  const [
    { data: listing },
    { data: other },
    { data: msgs },
    { data: offs },
    contractRes,
  ] = await Promise.all([
    supabase.from("listings").select("title").eq("id", conv.listing_id).single(),
    supabase.from("public_profiles").select("display_name").eq("id", otherId).single(),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("offers")
      .select("id, from_id, price_per_ha_year, term_years, message, status, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
    // graceful when the Lote B migration hasn't been applied yet
    supabase.from("contracts").select("id").eq("conversation_id", id).maybeSingle(),
  ]);

  // Contact reveal — only when closed, via the security-definer gate function.
  let contact: ConvData["contact"] = null;
  if (conv.deal_status === "closed") {
    const { data: c } = await supabase.rpc("get_counterparty_contact", {
      conv_id: id,
    });
    if (c && c.length > 0) contact = c[0];
  }

  return {
    ok: true,
    data: {
      id: conv.id,
      listing_id: conv.listing_id,
      listingTitle: listing?.title ?? "—",
      deal_status: conv.deal_status,
      myId: user.id,
      iAmOwner,
      counterpartName: other?.display_name ?? null,
      messages: (msgs ?? []) as ConvMessage[],
      offers: (offs ?? []) as ConvOffer[],
      contractId: contractRes.error ? null : (contractRes.data?.id ?? null),
      contact,
    },
  };
}

export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "empty" };

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: trimmed,
  });
  if (error) return { ok: false, error: error.message };
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  return { ok: true };
}

export async function makeOffer(
  conversationId: string,
  listingId: string,
  pricePerHaYear: number,
  termYears: number | null,
  message: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (!pricePerHaYear || pricePerHaYear <= 0) return { ok: false, error: "invalid" };

  const { error } = await supabase.from("offers").insert({
    conversation_id: conversationId,
    listing_id: listingId,
    from_id: user.id,
    price_per_ha_year: pricePerHaYear,
    term_years: termYears,
    message,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function respondToOffer(
  offerId: string,
  status: "accepted" | "declined",
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const { error } = await supabase.from("offers").update({ status }).eq("id", offerId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * ESTADO DO NEGÓCIO — decidido no SERVIDOR, nunca pelo cliente.
 *
 * ── O QUE ERA E POR QUE MUDOU ────────────────────────────────────────────────
 * Esta função fazia `update({ deal_status: status })` com a SESSÃO DO USUÁRIO.
 * `deal_status` é coluna de `conversations`, `authenticated` tinha UPDATE em
 * todas as colunas, e `get_counterparty_contact` (security definer) gateia
 * SOMENTE em `deal_status = 'closed'`. Resultado: qualquer participante fazia um
 * PATCH marcando `closed` e recebia telefone e e-mail da contraparte — sem
 * fechar negócio e sem pagar a Taxa. O gate de contato é o modelo de negócio
 * inteiro, e ele estava aberto.
 *
 * O privilégio foi fechado direto no banco (`revoke update on conversations
 * from authenticated`, com `grant update (updated_at)`), o que quebrou este
 * caminho DE PROPÓSITO. Este é o substituto correto: o cliente PEDE, o servidor
 * DECIDE, e a escrita é da service role.
 *
 * ── A PRÉ-CONDIÇÃO DE NEGÓCIO ────────────────────────────────────────────────
 * Só fecha se existir proposta com `status = 'accepted'` naquela conversa. Não
 * existe caminho em que uma parte sozinha feche sem proposta aceita registrada.
 * Isso também alinha a ordem que `legal-actions.ts` já espera: a aceitação do
 * termo da Taxa lê a proposta aceita para calcular valores reais, então a
 * sequência correta é proposta aceita → fecha → proprietário aceita a Taxa com
 * números de verdade.
 *
 * ── IRREVERSIBILIDADE ────────────────────────────────────────────────────────
 * De `closed` não se volta. O contato já foi revelado e não se desrevela.
 * Reversão administrativa NÃO está implementada de propósito — está descrita no
 * PR para o Carlos decidir.
 */
export type DealStatusErro =
  | "unconfigured"
  | "service_role_missing"
  | "not_signed_in"
  | "not_found"
  | "not_participant"
  | "sem_proposta_aceita"
  | "fechamento_irreversivel";

export type DealStatusResult = { ok: true } | { ok: false; error: DealStatusErro };

export async function setDealStatus(
  conversationId: string,
  status: "negotiating" | "closed" | "cancelled",
): Promise<DealStatusResult> {
  // 1) Quem está pedindo. Sessão do usuário, só para IDENTIFICAR.
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  // 2) Quem vai ESCREVER. Sem a chave, degradamos com segurança: não fecha
  //    nada. Nunca cair de volta para a sessão do usuário — era esse o furo.
  const db = getAdminSupabase();
  if (!db) return { ok: false, error: "service_role_missing" };

  const { data: conv } = await db
    .from("conversations")
    .select("id, owner_id, developer_id, deal_status")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv) return { ok: false, error: "not_found" };

  // 3) Autorização no servidor, além do RLS: só participante age. Note que
  //    lemos com a service role (que ignora RLS), então esta checagem NÃO é
  //    redundante — aqui ela é a única.
  const participa = conv.owner_id === user.id || conv.developer_id === user.id;
  if (!participa) return { ok: false, error: "not_participant" };

  // 4) Já fechado: repetir o mesmo pedido não é erro (dois cliques, duas abas),
  //    mesmo critério que `legal-actions.ts` usa no aceite duplicado. Mas sair
  //    de `closed` é recusado.
  if (conv.deal_status === "closed") {
    return status === "closed" ? { ok: true } : { ok: false, error: "fechamento_irreversivel" };
  }

  // 5) A pré-condição de negócio.
  if (status === "closed") {
    const { data: aceita } = await db
      .from("offers")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("status", "accepted")
      .limit(1)
      .maybeSingle();
    if (!aceita) return { ok: false, error: "sem_proposta_aceita" };
  }

  // 6) Escrita. `closed_at`/`closed_by` só no fechamento — é o evento que gera
  //    a cobrança, e antes disso ninguém sabia quem fechou nem quando.
  const patch: Record<string, unknown> = { deal_status: status, updated_at: new Date().toISOString() };
  if (status === "closed") {
    patch.closed_at = new Date().toISOString();
    patch.closed_by = user.id;
  }

  const { error } = await db.from("conversations").update(patch).eq("id", conversationId);
  if (error) {
    // Colunas de rastro podem não existir se a migration deste lote ainda não
    // foi aplicada. Degradamos para o essencial em vez de travar o fechamento
    // de um negócio real — mesmo espírito do "graceful when the Lote B
    // migration hasn't been applied yet" que este arquivo já usa.
    const { error: e2 } = await db
      .from("conversations")
      .update({ deal_status: status })
      .eq("id", conversationId);
    if (e2) return { ok: false, error: "not_found" };
  }
  return { ok: true };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const supabase = await getServerSupabase();
  if (!supabase) return;
  await supabase.rpc("mark_conversation_read", { conv_id: conversationId });
}
