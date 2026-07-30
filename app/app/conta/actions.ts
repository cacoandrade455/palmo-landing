"use server";

import { getServerSupabase } from "@/lib/supabase-server";

/**
 * Estado corrente do CAR de um anúncio — a linha mais recente de
 * `listing_car_verifications`. `null` significa "não sabemos": a migration
 * do CAR/SICAR pode não ter sido aplicada ainda, e nesse caso a interface
 * não afirma nada sobre o CAR.
 */
export type CarStatus =
  | "nao_informado"
  | "formato_invalido"
  | "formato_ok"
  | "confirmado_sicar"
  | "divergente_sicar";

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
  /** Última edição de campo sensível ao contrato. null quando a coluna não existe. */
  edited_at: string | null;
  /** Veredito mais recente do CAR. null quando não há verificação (ou tabela). */
  car_status: CarStatus | null;
  /** Data da conferência na fonte. Só faz sentido com car_status preenchido. */
  car_checked_at: string | null;
};

export type MyListingsResult =
  | { ok: true; listings: MyListing[] }
  | { ok: false; error: string };

type BaseListingRow = Omit<MyListing, "edited_at" | "car_status" | "car_checked_at">;
type EditedRow = { id: string; edited_at: string | null };
type CarRow = {
  listing_id: string;
  status: CarStatus;
  checked_at: string | null;
};

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

  const base = (data ?? []) as BaseListingRow[];
  if (base.length === 0) return { ok: true, listings: [] };

  const ids = base.map((l) => l.id);

  // Duas consultas SEPARADAS de propósito, e as duas podem falhar sem
  // derrubar o painel: `listings.edited_at` e a tabela
  // `listing_car_verifications` só existem depois da migration do CAR/SICAR.
  // Mesma postura da busca de `contracts` em app/app/mensagens/[id]/actions.ts
  // ("graceful when the Lote B migration hasn't been applied yet"): se der
  // erro, o painel funciona como funcionava antes.
  //
  // `geometria` NUNCA é selecionada: é o polígono do imóvel, é privada, e
  // contorno exato de terra em tela é risco de grilagem.
  const [editedRes, carRes] = await Promise.all([
    supabase.from("listings").select("id, edited_at").in("id", ids),
    supabase
      .from("listing_car_verifications")
      .select("listing_id, status, checked_at")
      .in("listing_id", ids)
      .order("created_at", { ascending: false }),
  ]);

  const editedById = new Map<string, string | null>();
  if (!editedRes.error) {
    for (const row of (editedRes.data ?? []) as EditedRow[]) {
      editedById.set(row.id, row.edited_at ?? null);
    }
  }

  // Ordenado por created_at desc: a PRIMEIRA linha de cada anúncio é a atual.
  const carById = new Map<string, CarRow>();
  if (!carRes.error) {
    for (const row of (carRes.data ?? []) as CarRow[]) {
      if (!carById.has(row.listing_id)) carById.set(row.listing_id, row);
    }
  }

  const listings: MyListing[] = base.map((l) => {
    const car = carById.get(l.id) ?? null;
    return {
      ...l,
      edited_at: editedById.get(l.id) ?? null,
      car_status: car?.status ?? null,
      car_checked_at: car?.checked_at ?? null,
    };
  });

  return { ok: true, listings };
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
