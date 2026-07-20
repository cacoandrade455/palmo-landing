"use server";

import { getServerSupabase } from "@/lib/supabase-server";

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

/** Advance the deal — e.g. owner+developer agree, mark closed to reveal contact. */
export async function setDealStatus(
  conversationId: string,
  status: "negotiating" | "closed" | "cancelled",
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const { error } = await supabase
    .from("conversations")
    .update({ deal_status: status })
    .eq("id", conversationId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const supabase = await getServerSupabase();
  if (!supabase) return;
  await supabase.rpc("mark_conversation_read", { conv_id: conversationId });
}
