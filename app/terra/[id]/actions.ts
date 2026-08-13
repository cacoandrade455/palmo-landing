"use server";

// Import só de TIPO: some na compilação, então o componente client não é
// arrastado para dentro do módulo de server actions.
import type { CamadasAmbientaisData } from "@/components/CamadasAmbientais";
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
  ownerName: string | null; // display name público — nunca contato
};

type PublicRow = Omit<
  ListingDetailData,
  "verified" | "car_declarado" | "car_checked_at" | "edited_at" | "photos" | "ownerName"
> & {
  photos: string[] | null;
  // Só existem na view depois de 20260729-car-sicar-e-fotos.sql.
  verified?: boolean | null;
  car_declarado?: boolean | null;
  car_checked_at?: string | null;
  edited_at?: string | null;
};

const BASE_COLS =
  "id, owner_id, title, state, municipality, hectares, purpose, crop, price_per_ha_year, description, has_water, photos, created_at";

/** Contrato novo: selo honesto + estado declarado + datas. */
const TRUSTED_COLS = `${BASE_COLS}, verified, car_declarado, car_checked_at, edited_at`;

export async function getListing(
  id: string,
): Promise<{ ok: true; listing: ListingDetailData } | { ok: false; error: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };

  let row: PublicRow | null = null;
  // "A fonte sabe dizer quem foi conferido no SICAR?" Se não, ninguém recebe
  // selo — o selo antigo era só "car_number não vazio", e não reproduzimos
  // essa mentira em código, muito menos com a copy "CAR ativo no SICAR".
  let trusted = false;

  // Caminho principal: view pública com o contrato novo.
  const viewRes = await supabase
    .from("public_listings")
    .select(TRUSTED_COLS)
    .eq("id", id)
    .single();

  if (!viewRes.error && viewRes.data) {
    row = viewRes.data as unknown as PublicRow;
    trusted = true;
  } else {
    // A migration do SICAR ainda não foi aplicada: a view antiga não tem as
    // colunas novas. Lemos o conjunto mínimo (que existe na view antiga e na
    // tabela base) e não exibimos selo nenhum.
    const legacyView = await supabase
      .from("public_listings")
      .select(BASE_COLS)
      .eq("id", id)
      .single();

    if (!legacyView.error && legacyView.data) {
      row = legacyView.data as unknown as PublicRow;
    } else {
      // Último recurso: tabela base (a policy atual já limita a ativos +
      // anúncios do próprio dono).
      const tableRes = await supabase
        .from("listings")
        .select(BASE_COLS)
        .eq("id", id)
        .single();
      if (tableRes.error || !tableRes.data)
        return { ok: false, error: tableRes.error?.message ?? "not_found" };
      row = tableRes.data as unknown as PublicRow;
    }
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
      verified: trusted && row.verified === true,
      car_declarado: trusted && row.car_declarado === true,
      car_checked_at: trusted ? row.car_checked_at ?? null : null,
      edited_at: trusted ? row.edited_at ?? null : null,
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

/**
 * CAMADAS AMBIENTAIS DO CAR — leitura pública do anúncio.
 *
 * Dois caminhos, na ordem:
 *   1. `public_listing_car_layers`, a view que só mostra anúncio ATIVO. É por
 *      onde anon lê, e o `security_invoker = off` é o que permite isso sem dar
 *      grant de leitura na tabela base.
 *   2. `listing_car_layers` direto, que a policy `lcl_select_own` limita ao
 *      DONO. É o que faz o dono conseguir conferir as camadas de um anúncio
 *      ainda não publicado (ou já arquivado) na própria página do imóvel.
 *
 * Falha de qualquer natureza — inclusive a migration ainda não aplicada —
 * devolve `null`, e a seção simplesmente não aparece. Camada ambiental é
 * enriquecimento: ela nunca pode derrubar a página do anúncio.
 */
export async function getCamadasAmbientais(
  listingId: string,
): Promise<CamadasAmbientaisData | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const COLS =
    "fetched_at, geom_perimetro, geom_rl, geom_app, area_total_ha, area_rl_ha, area_app_ha, area_rl_app_uniao_ha, area_util_estimada_ha";

  const daView = await supabase
    .from("public_listing_car_layers")
    .select(COLS)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (!daView.error && daView.data) return daView.data as unknown as CamadasAmbientaisData;

  const daTabela = await supabase
    .from("listing_car_layers")
    .select(COLS)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (!daTabela.error && daTabela.data) return daTabela.data as unknown as CamadasAmbientaisData;

  return null;
}
