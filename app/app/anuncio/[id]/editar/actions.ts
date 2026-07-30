"use server";

import { getServerSupabase } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { verificarEGravarCar } from "@/lib/listing-car";
import type { CarStatus } from "@/lib/car-checks";

/**
 * EDIÇÃO DE ANÚNCIO.
 *
 * ── OS TRÊS GRUPOS DE CAMPO, e por que a distinção importa ───────────────────
 *
 * LIVRES — título, descrição, água, cultura e variedade. Edita e pronto.
 *
 * SENSÍVEIS AO CAR — car_number, state, municipality, hectares. Editar QUALQUER
 *   um deles obriga a refazer a verificação, porque o selo depende dos quatro:
 *   sem isso, alguém consegue selo com um CAR e depois troca o número, ou
 *   confirma com 100 ha e depois anuncia 900. A verificação nova entra como
 *   linha nova em `listing_car_verifications`, e como a view lê a linha MAIS
 *   RECENTE, o selo antigo deixa de valer no mesmo instante.
 *
 * SENSÍVEIS AO CONTRATO — price_per_ha_year, hectares e purpose. Gravam
 *   `listing_changes` (campo, valor antigo, valor novo, autor, data) e marcam
 *   `edited_at`, que a outra parte vê como "anúncio editado em [data]".
 *
 *   Nota que dispensou trava: `offers` carrega `price_per_ha_year not null` e
 *   `term_years` próprios — a proposta CONGELA os termos dela, não aponta para
 *   o preço do anúncio. Então editar o anúncio não corrompe proposta nenhuma, e
 *   a "última proposta registrada" da Cláusula 3.4.1 continua lendo de `offers`.
 *   Bloquear a edição protegeria algo que já está protegido.
 *
 * NUNCA EDITÁVEL pelo dono — owner_id, created_at e qualquer campo de veredito.
 *   Os campos de veredito nem estão em `listings`: vivem em
 *   `listing_car_verifications`, que não tem policy de escrita para ninguém.
 *
 * ── O QUE NÃO EXISTE AQUI, DE PROPÓSITO ──────────────────────────────────────
 * EXCLUSÃO DEFINITIVA. Em lugar nenhum, nem escondida, nem com confirmação
 * dupla. Apagar um anúncio apaga em cascata toda conversa, toda mensagem, toda
 * proposta E o próprio registro de aceite (`legal_acceptances.listing_id` também
 * é `on delete cascade`) — ou seja, destrói exatamente o que os Termos definem
 * como prova. A ação do dono é ARQUIVAR, e a migration deste lote revoga o
 * privilégio de DELETE na raiz para o cliente não conseguir nem tentar.
 */

export type CarEstado = {
  status: CarStatus;
  checked_at: string | null;
  area_ha: number | null;
  fonte: string | null;
  /** Motivos legíveis, para a tela de edição poder orientar o dono. */
  reasons: string[];
};

export type ListingParaEditar = {
  id: string;
  title: string;
  status: string;
  state: string;
  municipality: string;
  municipality_ibge: number | null;
  hectares: number;
  purpose: string;
  crop: string | null;
  price_per_ha_year: number | null;
  description: string | null;
  has_water: boolean | null;
  car_number: string | null;
  matricula: string | null;
  photos: string[];
  edited_at: string | null;
  car: CarEstado | null;
  /** Tem conversa ou proposta viva? A interface avisa antes de editar preço. */
  temNegociacaoAberta: boolean;
};

export type GetListingResult =
  | { ok: true; listing: ListingParaEditar }
  | { ok: false; error: string };

/**
 * Carrega o anúncio para edição.
 *
 * Anúncio de OUTRO dono responde exatamente como anúncio inexistente
 * (`not_found`): não revelamos se o id existe.
 */
export async function getListingForEdit(id: string): Promise<GetListingResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  // Lê com a sessão do usuário: o RLS já restringe a linha, e a checagem
  // explícita de owner_id abaixo é a segunda tranca.
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "not_found" };
  if (data.owner_id !== user.id) return { ok: false, error: "not_found" };

  // Estado do CAR: linha mais recente. Degrada graciosamente se a migration
  // deste lote ainda não foi aplicada — o app não fica inerte esperando banco.
  let car: CarEstado | null = null;
  const v = await supabase
    .from("listing_car_verifications")
    .select("status, checked_at, area_ha, fonte, checks")
    .eq("listing_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!v.error && v.data) {
    const checks = v.data.checks as { reasons?: string[] } | null;
    car = {
      status: v.data.status as CarStatus,
      checked_at: v.data.checked_at as string | null,
      area_ha: v.data.area_ha as number | null,
      fonte: v.data.fonte as string | null,
      reasons: checks?.reasons ?? [],
    };
  }

  const [{ count: convs }, { count: offs }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", id),
    supabase.from("offers").select("id", { count: "exact", head: true }).eq("listing_id", id),
  ]);

  return {
    ok: true,
    listing: {
      id: data.id,
      title: data.title,
      status: data.status,
      state: data.state,
      municipality: data.municipality,
      municipality_ibge: (data.municipality_ibge as number | null) ?? null,
      hectares: Number(data.hectares),
      purpose: data.purpose,
      crop: data.crop ?? null,
      price_per_ha_year:
        data.price_per_ha_year == null ? null : Number(data.price_per_ha_year),
      description: data.description ?? null,
      has_water: data.has_water ?? null,
      car_number: data.car_number ?? null,
      matricula: data.matricula ?? null,
      photos: (data.photos as string[] | null) ?? [],
      edited_at: (data.edited_at as string | null) ?? null,
      car,
      temNegociacaoAberta: (convs ?? 0) > 0 || (offs ?? 0) > 0,
    },
  };
}

/** Campos que disparam nova verificação do CAR. */
const CAMPOS_CAR = ["car_number", "state", "municipality", "hectares"] as const;
/** Campos com peso contratual. */
const CAMPOS_CONTRATO = ["price_per_ha_year", "hectares", "purpose"] as const;

function categoriaDoCampo(campo: string): "livre" | "car" | "contrato" {
  if ((CAMPOS_CONTRATO as readonly string[]).includes(campo)) return "contrato";
  if ((CAMPOS_CAR as readonly string[]).includes(campo)) return "car";
  return "livre";
}

export type UpdateListingResult =
  | { ok: true; carStatus?: CarStatus; reverificado: boolean }
  | { ok: false; error: string };

export async function updateListing(
  id: string,
  formData: FormData,
): Promise<UpdateListingResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const atual = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (atual.error || !atual.data) return { ok: false, error: "not_found" };
  // Autorização no servidor, sempre, além do RLS. Nunca confiar no cliente para
  // dizer de quem é o anúncio.
  if (atual.data.owner_id !== user.id) return { ok: false, error: "not_found" };

  const s = (k: string) => String(formData.get(k) ?? "").trim();
  const title = s("title");
  const state = s("state");
  const municipality = s("municipality");
  const ibgeRaw = s("municipality_ibge");
  const municipality_ibge = /^\d{7}$/.test(ibgeRaw) ? Number(ibgeRaw) : null;
  const hectares = Number(formData.get("hectares") ?? 0);
  const purpose = s("purpose");
  const crop = s("crop") || null;
  const priceRaw = s("price_per_ha_year");
  const price_per_ha_year = priceRaw ? Number(priceRaw) : null;
  const description = s("description") || null;
  const has_water = formData.get("has_water") === "on";
  const car_number = s("car_number") || null;
  const matricula = s("matricula") || null;

  if (!title || !state || !municipality || !purpose || !hectares || hectares <= 0) {
    return { ok: false, error: "missing_fields" };
  }

  const patch: Record<string, unknown> = {
    title,
    state,
    municipality,
    municipality_ibge,
    hectares,
    purpose,
    crop,
    price_per_ha_year,
    description,
    has_water,
    car_number,
    matricula,
  };

  // Diff antes de gravar: é o que alimenta `listing_changes` e o que decide se
  // a verificação do CAR precisa rodar de novo.
  const mudancas: { field: string; old_value: string | null; new_value: string | null }[] = [];
  for (const [campo, novo] of Object.entries(patch)) {
    const velho = (atual.data as Record<string, unknown>)[campo];
    const a = velho == null ? null : String(velho);
    const b = novo == null ? null : String(novo);
    // Números vêm como string do Postgres ("128.00" vs "128"), então comparamos
    // numericamente quando os dois lados são numéricos.
    const numerico = a != null && b != null && a !== "" && b !== "" &&
      Number.isFinite(Number(a)) && Number.isFinite(Number(b));
    const igual = numerico ? Number(a) === Number(b) : a === b;
    if (!igual) mudancas.push({ field: campo, old_value: a, new_value: b });
  }

  if (mudancas.length === 0) return { ok: true, reverificado: false };

  const mexeuNoCar = mudancas.some((m) => categoriaDoCampo(m.field) === "car");
  const mexeuNoContrato = mudancas.some((m) => categoriaDoCampo(m.field) === "contrato");

  if (mexeuNoContrato) patch.edited_at = new Date().toISOString();

  const { error } = await supabase.from("listings").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Histórico. Service role porque `listing_changes` não tem policy de INSERT
  // para ninguém — registro que o próprio autor pode reescrever não é registro.
  const db = getAdminSupabase();
  if (db) {
    await db.from("listing_changes").insert(
      mudancas.map((m) => ({
        listing_id: id,
        actor_id: user.id,
        field: m.field,
        old_value: m.old_value,
        new_value: m.new_value,
        categoria: categoriaDoCampo(m.field),
      })),
    );
  }

  // Nova verificação quando algo que sustenta o selo mudou. A linha nova passa a
  // ser a mais recente, então o selo antigo perde efeito no mesmo instante —
  // não existe janela em que um selo confirmado descreva outro imóvel.
  if (mexeuNoCar) {
    const { checks } = await verificarEGravarCar({
      listingId: id,
      car: car_number,
      state,
      municipalityIbge: municipality_ibge,
      hectares,
    });
    return { ok: true, carStatus: checks.status, reverificado: true };
  }

  return { ok: true, reverificado: false };
}

/**
 * Transições permitidas ao proprietário. `closed` NÃO está aqui: pertence ao
 * fluxo de negócio do contrato, e mexer nele daqui seria burlar o gate de
 * contato.
 */
export async function mudarStatusDoAnuncio(
  id: string,
  status: "draft" | "active" | "paused" | "archived",
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const { data: atual } = await supabase
    .from("listings")
    .select("owner_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!atual || atual.owner_id !== user.id) return { ok: false, error: "not_found" };

  // De `closed` o proprietário não sai: aquele estado é do fluxo do contrato.
  if (atual.status === "closed") return { ok: false, error: "estado_do_contrato" };

  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", id)
    .eq("owner_id", user.id); // RLS também garante
  if (error) return { ok: false, error: error.message };

  const db = getAdminSupabase();
  if (db) {
    await db.from("listing_changes").insert({
      listing_id: id,
      actor_id: user.id,
      field: "status",
      old_value: atual.status,
      new_value: status,
      categoria: "livre",
    });
  }
  return { ok: true };
}
