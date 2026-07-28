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
  verified: boolean;
  photos: string[];
  created_at: string;
};

export type BrowseFilters = {
  state?: string;
  municipality?: string;
  purpose?: string;
  minHectares?: number;
  maxHectares?: number;
};

/** Linha crua vinda da view pública (ou do fallback na tabela base). */
type PublicRow = {
  id: string;
  title: string;
  state: string;
  municipality: string;
  hectares: number;
  purpose: string;
  crop: string | null;
  price_per_ha_year: number | null;
  has_water: boolean | null;
  verified?: boolean | null;
  car_number?: string | null;
  photos: string[] | null;
  created_at: string;
};

function toBrowseListing(row: PublicRow): BrowseListing {
  return {
    id: row.id,
    title: row.title,
    state: row.state,
    municipality: row.municipality,
    hectares: row.hectares,
    purpose: row.purpose,
    crop: row.crop,
    price_per_ha_year: row.price_per_ha_year,
    has_water: row.has_water,
    verified: row.verified ?? !!row.car_number,
    photos: row.photos ?? [],
    created_at: row.created_at,
  };
}

/**
 * Lê listagens ativas pela VIEW pública `public_listings` (colunas seguras,
 * legível por anon — ver supabase/migrations/). Enquanto a migration não for
 * aplicada, cai para a tabela `listings` (que a policy atual já limita a
 * status ativo), calculando `verified` a partir do CAR.
 */
async function selectListings(
  filters: BrowseFilters,
  limit: number,
): Promise<{ ok: true; listings: BrowseListing[] } | { ok: false; error: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };

  for (const source of ["public_listings", "listings"] as const) {
    const cols =
      source === "public_listings"
        ? "id, title, state, municipality, hectares, purpose, crop, price_per_ha_year, has_water, verified, photos, created_at"
        : "id, title, state, municipality, hectares, purpose, crop, price_per_ha_year, has_water, car_number, photos, created_at";

    let q = supabase.from(source).select(cols);
    // A view já embute status = 'active'; na tabela base o filtro é explícito.
    if (source === "listings") q = q.eq("status", "active");
    if (filters.state) q = q.eq("state", filters.state);
    if (filters.municipality) q = q.eq("municipality", filters.municipality);
    if (filters.purpose) q = q.eq("purpose", filters.purpose);
    if (filters.minHectares && filters.minHectares > 0)
      q = q.gte("hectares", filters.minHectares);
    if (filters.maxHectares && filters.maxHectares > 0)
      q = q.lte("hectares", filters.maxHectares);

    const { data, error } = await q
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error) {
      return {
        ok: true,
        listings: ((data ?? []) as unknown as PublicRow[]).map(toBrowseListing),
      };
    }
    // View ainda não existe (migration pendente) → tenta a tabela base.
    if (source === "listings") return { ok: false, error: error.message };
  }
  return { ok: false, error: "unreachable" };
}

export async function browseListings(
  filters: BrowseFilters,
): Promise<{ ok: true; listings: BrowseListing[] } | { ok: false; error: string }> {
  return selectListings(filters, 60);
}

/** As N listagens ativas mais recentes — grid "Terras disponíveis" da home. */
export async function recentListings(limit = 6): Promise<BrowseListing[]> {
  const res = await selectListings({}, limit);
  return res.ok ? res.listings : [];
}
