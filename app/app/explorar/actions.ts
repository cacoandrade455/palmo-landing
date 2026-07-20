"use server";

import { getServerSupabase } from "@/lib/supabase-server";

export type BrowseListing = {
  id: string;
  title: string;
  state: string;
  municipality: string;
  hectares: number;
  purpose: string;
  crop: string | null;
  price_per_ha_year: number | null;
  has_water: boolean | null;
  car_number: string | null;
  created_at: string;
};

export type BrowseFilters = {
  state?: string;
  municipality?: string;
  purpose?: string;
  minHectares?: number;
  maxHectares?: number;
};

export async function browseListings(
  filters: BrowseFilters,
): Promise<{ ok: true; listings: BrowseListing[] } | { ok: false; error: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };

  let q = supabase
    .from("listings")
    .select(
      "id, title, state, municipality, hectares, purpose, crop, price_per_ha_year, has_water, car_number, created_at",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(60);

  if (filters.state) q = q.eq("state", filters.state);
  if (filters.municipality) q = q.eq("municipality", filters.municipality);
  if (filters.purpose) q = q.eq("purpose", filters.purpose);
  if (filters.minHectares && filters.minHectares > 0)
    q = q.gte("hectares", filters.minHectares);
  if (filters.maxHectares && filters.maxHectares > 0)
    q = q.lte("hectares", filters.maxHectares);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, listings: (data ?? []) as BrowseListing[] };
}
