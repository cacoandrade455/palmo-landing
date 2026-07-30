"use server";

import { getServerSupabase } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { verificarEGravarCar } from "@/lib/listing-car";
import {
  definirOrdemDeFotos,
  emitirUploadsAssinados,
  publicarFotoDoStaging,
  type PublicarFotoResultado,
  type UploadAssinado,
} from "@/lib/listing-photos";

export type CreateListingResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createListing(
  formData: FormData,
): Promise<CreateListingResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const title = String(formData.get("title") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const municipality = String(formData.get("municipality") ?? "").trim();
  // Código IBGE do município, capturado do dropdown do IBGE. Pode faltar: quando
  // a API do IBGE cai, o formulário degrada para texto livre e não existe código
  // nenhum para capturar. Nulo é um estado legítimo, não um erro.
  const ibgeRaw = String(formData.get("municipality_ibge") ?? "").trim();
  const municipality_ibge = /^\d{7}$/.test(ibgeRaw) ? Number(ibgeRaw) : null;
  const hectares = Number(formData.get("hectares") ?? 0);
  const purpose = String(formData.get("purpose") ?? "").trim();
  const crop = String(formData.get("crop") ?? "").trim() || null;
  const priceRaw = String(formData.get("price_per_ha_year") ?? "").trim();
  const price_per_ha_year = priceRaw ? Number(priceRaw) : null;
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  // Variety has no dedicated column yet (schema is untouchable for agents),
  // so it is persisted non-destructively as a prefix inside the description.
  const variant = String(formData.get("variant") ?? "").trim();
  const description = variant
    ? `Variedade: ${variant}.${descriptionRaw ? ` ${descriptionRaw}` : ""}`
    : descriptionRaw || null;
  const has_water = formData.get("has_water") === "on";
  const car_number = String(formData.get("car_number") ?? "").trim() || null;
  const matricula = String(formData.get("matricula") ?? "").trim() || null;
  const publish = formData.get("publish") === "true";

  if (!title || !state || !municipality || !purpose || !hectares || hectares <= 0) {
    return { ok: false, error: "missing_fields" };
  }

  // O anúncio é gravado PRIMEIRO e sem depender de nada externo. Um CAR de
  // formato não reconhecido NÃO bloqueia: o campo é opcional, e bloquear não
  // produz CAR correto, produz CAR vazio — o dono com pressa apaga o campo e
  // passa pelo portão. Vazio é pior que torto: torto é sinal acionável.
  // A arquitetura do selo já contém o problema, porque selo só nasce de
  // `confirmado_sicar`.
  const { data, error } = await supabase
    .from("listings")
    .insert({
      owner_id: user.id,
      title,
      status: publish ? "active" : "draft",
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
    })
    .select("id")
    .single();

  if (error) {
    // `municipality_ibge` só existe depois da migration deste lote. Sem ela, o
    // anúncio continua sendo criado como antes — o app não fica inerte
    // esperando deploy de banco.
    const semColuna = /municipality_ibge/i.test(error.message);
    if (!semColuna) return { ok: false, error: error.message };

    const retry = await supabase
      .from("listings")
      .insert({
        owner_id: user.id,
        title,
        status: publish ? "active" : "draft",
        state,
        municipality,
        hectares,
        purpose,
        crop,
        price_per_ha_year,
        description,
        has_water,
        car_number,
        matricula,
      })
      .select("id")
      .single();
    if (retry.error) return { ok: false, error: retry.error.message };
    return { ok: true, id: retry.data.id };
  }

  return { ok: true, id: data.id };
}

/**
 * Verifica o CAR do anúncio e grava a linha de auditoria.
 *
 * SEPARADA de `createListing` de propósito: a submissão do anúncio NUNCA fica
 * pendurada em I/O externo. O cliente chama isto com `void` depois de salvar,
 * exatamente como já faz com `acceptListingTerms` — é o idioma que este fluxo
 * já usa.
 *
 * Chamada só na criação e na edição. NUNCA por pageview.
 */
export async function verificarCarDoAnuncio(
  listingId: string,
): Promise<{ ok: boolean; status?: string; error?: string }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const db = getAdminSupabase();
  if (!db) return { ok: false, error: "service_role_missing" };

  // Autorização no servidor. Lemos com a service role (que ignora RLS), então
  // esta checagem não é redundante: aqui ela é a única.
  const { data: l } = await db
    .from("listings")
    .select("id, owner_id, car_number, state, municipality_ibge, hectares")
    .eq("id", listingId)
    .maybeSingle();
  // Anúncio de outro dono responde igual a anúncio inexistente: não revelamos
  // se o id existe.
  if (!l || l.owner_id !== user.id) return { ok: false, error: "not_found" };

  const { checks, gravado } = await verificarEGravarCar({
    listingId,
    car: l.car_number,
    state: l.state,
    municipalityIbge: l.municipality_ibge as number | null,
    hectares: Number(l.hectares),
  });

  return gravado
    ? { ok: true, status: checks.status }
    : { ok: false, error: "nao_gravado", status: checks.status };
}

// ─────────────────────────────────────────────────────────────────────────────
// FOTOS
// ─────────────────────────────────────────────────────────────────────────────
// O cliente pede URLs assinadas, sobe os bytes DIRETO para o bucket privado de
// staging, e depois pede o processamento. Os bytes da foto nunca atravessam um
// request body do Next: é assim que escapamos do teto de 4,5 MB da Vercel e do
// truncamento silencioso do `proxy.ts`.

async function donoAutenticado(): Promise<{ id: string } | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id } : null;
}

export async function pedirUploadsDeFoto(
  listingId: string,
  quantidade: number,
): Promise<{ ok: true; uploads: UploadAssinado[] } | { ok: false; error: string }> {
  const user = await donoAutenticado();
  if (!user) return { ok: false, error: "not_signed_in" };
  return emitirUploadsAssinados(listingId, user.id, quantidade);
}

export async function publicarFoto(
  listingId: string,
  uuid: string,
): Promise<PublicarFotoResultado> {
  const user = await donoAutenticado();
  if (!user) return { ok: false, error: "not_signed_in" };
  return publicarFotoDoStaging(listingId, user.id, uuid);
}

/** Reordenar, definir capa e excluir são a mesma operação: a lista nova. */
export async function salvarOrdemDeFotos(
  listingId: string,
  novaOrdem: string[],
): Promise<{ ok: true; photos: string[] } | { ok: false; error: string }> {
  const user = await donoAutenticado();
  if (!user) return { ok: false, error: "not_signed_in" };
  return definirOrdemDeFotos(listingId, user.id, novaOrdem);
}
