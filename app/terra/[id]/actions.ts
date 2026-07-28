"use server";

import { getServerSupabase } from "@/lib/supabase-server";

/**
 * Dados PÚBLICOS de uma listagem — o que a view `public_listings` expõe.
 * Nunca inclui contato do dono, CAR cru nem matrícula; o selo de verificado
 * é um booleano derivado no banco.
 */
export type ListingDetailData = {
  id: string;
  owner_id: string;
  title: string;
  state: string;
  municipality: string;
  hectares: number;
  purpose: string;
  crop: string | null;
  price_per_ha_year: number | null;
  description: string | null;
  has_water: boolean | null;
  verified: boolean;
  photos: string[];
  created_at: string;
  ownerName: string | null; // display name público — nunca contato
};

type PublicRow = Omit<ListingDetailData, "verified" | "photos" | "ownerName"> & {
  verified?: boolean | null;
  car_number?: string | null;
  photos: string[] | null;
};

export async function getListing(
  id: string,
): Promise<{ ok: true; listing: ListingDetailData } | { ok: false; error: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };

  let row: PublicRow | null = null;

  // Caminho principal: view pública (colunas seguras, legível por anon).
  const viewRes = await supabase
    .from("public_listings")
    .select(
      "id, owner_id, title, state, municipality, hectares, purpose, crop, price_per_ha_year, description, has_water, verified, photos, created_at",
    )
    .eq("id", id)
    .single();

  if (!viewRes.error && viewRes.data) {
    row = viewRes.data as unknown as PublicRow;
  } else {
    // Fallback pré-migration: tabela base (policy atual já limita a ativos +
    // anúncios do próprio dono); `verified` derivado do CAR.
    const tableRes = await supabase
      .from("listings")
      .select(
        "id, owner_id, title, state, municipality, hectares, purpose, crop, price_per_ha_year, description, has_water, car_number, photos, created_at",
      )
      .eq("id", id)
      .single();
    if (tableRes.error || !tableRes.data)
      return { ok: false, error: tableRes.error?.message ?? "not_found" };
    row = tableRes.data as unknown as PublicRow;
  }

  // Display name público do dono (view contact-free). Pode falhar para anon
  // dependendo dos grants — aí simplesmente não mostramos o nome.
  let ownerName: string | null = null;
  const { data: prof } = await supabase
    .from("public_profiles")
    .select("display_name")
    .eq("id", row.owner_id)
    .maybeSingle();
  ownerName = prof?.display_name ?? null;

  return {
    ok: true,
    listing: {
      id: row.id,
      owner_id: row.owner_id,
      title: row.title,
      state: row.state,
      municipality: row.municipality,
      hectares: row.hectares,
      purpose: row.purpose,
      crop: row.crop,
      price_per_ha_year: row.price_per_ha_year,
      description: row.description,
      has_water: row.has_water,
      verified: row.verified ?? !!row.car_number,
      photos: row.photos ?? [],
      created_at: row.created_at,
      ownerName,
    },
  };
}

/**
 * Starts (or reuses) a conversation between the current user (a developer)
 * and the listing's owner. Returns the conversation id to navigate to.
 */
export async function startConversation(
  listingId: string,
): Promise<{ ok: true; conversationId: string } | { ok: false; error: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const { data: listing } = await supabase
    .from("listings")
    .select("owner_id, status")
    .eq("id", listingId)
    .single();
  if (!listing) return { ok: false, error: "listing_not_found" };
  if (listing.owner_id === user.id) return { ok: false, error: "own_listing" };

  // reuse existing conversation if present
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("developer_id", user.id)
    .maybeSingle();
  if (existing) return { ok: true, conversationId: existing.id };

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      listing_id: listingId,
      developer_id: user.id,
      owner_id: listing.owner_id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, conversationId: created.id };
}
