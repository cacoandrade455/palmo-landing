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
  /** CAR confirmado ATIVO na base do SICAR. Só isso vira selo. */
  verified: boolean;
  /** Formato do CAR válido, mas NINGUÉM conferiu na fonte. Não é selo. */
  car_declarado: boolean;
  /** Data da conferência no SICAR — o lastro do selo. */
  car_checked_at: string | null;
  /** Última edição de campo sensível ao contrato. */
  edited_at: string | null;
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
  photos: string[] | null;
  created_at: string;
  // Só existem na view depois de 20260729-car-sicar-e-fotos.sql.
  verified?: boolean | null;
  car_declarado?: boolean | null;
  car_checked_at?: string | null;
  edited_at?: string | null;
};

/**
 * Colunas do contrato novo: `verified` só é true com `confirmado_sicar`, e vêm
 * junto `car_declarado`, `car_checked_at` e `edited_at`.
 */
const TRUSTED_COLS =
  "id, title, state, municipality, hectares, purpose, crop, price_per_ha_year, has_water, verified, photos, created_at, car_declarado, car_checked_at, edited_at";

/**
 * Conjunto mínimo, presente na view antiga E na tabela base. `verified` NÃO é
 * lido aqui de propósito — ver `toBrowseListing`.
 */
const LEGACY_COLS =
  "id, title, state, municipality, hectares, purpose, crop, price_per_ha_year, has_water, photos, created_at";

/**
 * Ordem de tentativa. `trusted: false` significa "esta fonte não sabe dizer
 * quem foi conferido no SICAR", e nesse caso ninguém recebe selo.
 */
const SOURCES = [
  { source: "public_listings", cols: TRUSTED_COLS, trusted: true },
  { source: "public_listings", cols: LEGACY_COLS, trusted: false },
  { source: "listings", cols: LEGACY_COLS, trusted: false },
] as const;

function toBrowseListing(row: PublicRow, trusted: boolean): BrowseListing {
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
    // Fonte não confiável → sem selo. O selo antigo era só "car_number não
    // vazio" (digitar "123" ganhava selo); não reproduzimos essa mentira em
    // código, e muito menos com a copy nova "CAR ativo no SICAR".
    verified: trusted && row.verified === true,
    car_declarado: trusted && row.car_declarado === true,
    car_checked_at: trusted ? row.car_checked_at ?? null : null,
    edited_at: trusted ? row.edited_at ?? null : null,
    photos: row.photos ?? [],
    created_at: row.created_at,
  };
}

/**
 * Lê listagens ativas pela VIEW pública `public_listings` (colunas seguras,
 * legível por anon — ver supabase/migrations/). Se a migration do SICAR ainda
 * não foi aplicada, a view não tem as colunas novas e caímos para o conjunto
 * mínimo — e aí NINGUÉM aparece como verificado. Último recurso é a tabela
 * `listings` (a policy atual já a limita a status ativo).
 */
async function selectListings(
  filters: BrowseFilters,
  limit: number,
): Promise<{ ok: true; listings: BrowseListing[] } | { ok: false; error: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };

  let lastError = "unreachable";

  for (const { source, cols, trusted } of SOURCES) {
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
        listings: ((data ?? []) as unknown as PublicRow[]).map((r) =>
          toBrowseListing(r, trusted),
        ),
      };
    }
    lastError = error.message;
  }

  return { ok: false, error: lastError };
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
