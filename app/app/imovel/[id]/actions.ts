"use server";

import { getServerSupabase } from "@/lib/supabase-server";

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
  car_number: string | null;
  created_at: string;
  ownerName: string | null; // public display name only — never contact
};

export async function getListing(
  id: string,
): Promise<{ ok: true; listing: ListingDetailData } | { ok: false; error: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };

  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, owner_id, title, state, municipality, hectares, purpose, crop, price_per_ha_year, description, has_water, car_number, created_at",
    )
    .eq("id", id)
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "not_found" };

  // Public display name only (no phone/email — those come from the gate function
  // after a deal closes). Read from the contact-free public_profiles view.
  let ownerName: string | null = null;
  const { data: prof } = await supabase
    .from("public_profiles")
    .select("display_name")
    .eq("id", data.owner_id)
    .single();
  ownerName = prof?.display_name ?? null;

  return { ok: true, listing: { ...data, ownerName } as ListingDetailData };
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
