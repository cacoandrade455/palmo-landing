"use server";

import { getServerSupabase } from "@/lib/supabase-server";

export type MyListing = {
  id: string;
  title: string;
  status: string;
  state: string;
  municipality: string;
  hectares: number;
  purpose: string;
  crop: string | null;
  price_per_ha_year: number | null;
  created_at: string;
};

export type MyListingsResult =
  | { ok: true; listings: MyListing[] }
  | { ok: false; error: string };

export async function getMyListings(): Promise<MyListingsResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, title, status, state, municipality, hectares, purpose, crop, price_per_ha_year, created_at",
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, listings: (data ?? []) as MyListing[] };
}

export async function updateListingStatus(
  id: string,
  status: "active" | "paused" | "archived",
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", id)
    .eq("owner_id", user.id); // RLS also enforces this
  return error ? { ok: false, error: error.message } : { ok: true };
}
