"use server";

import { revalidatePath } from "next/cache";

import { getKycAdmin } from "@/lib/kyc-admin";
import { atualizarCamadasAmbientais, type ResumoCamadas } from "@/lib/listing-car-layers";
import { parseCar } from "@/lib/car-checks";
import { getAdminSupabase } from "@/lib/supabase-admin";

/**
 * Reprocessamento das camadas ambientais — ação de admin.
 *
 * Existe porque anúncio criado ANTES deste lote nunca disparou a busca: a
 * verificação de CAR dele já rodou, e só volta a rodar se o dono editar o
 * anúncio. Sem isto, o backfill dependeria de pedir a cada proprietário que
 * salvasse o anúncio de novo.
 *
 * Reusa o mesmo gate de `/app/admin/kyc` (`getKycAdmin`): a allowlist mora em
 * `PALMO_KYC_ADMIN_IDS`, e sem a variável ninguém é admin. Server action é
 * endpoint HTTP público — a checagem da página não protege a action, então a
 * action confere por conta própria, e a recusa é sempre a mesma frase, sem
 * dizer se o problema foi login, permissão ou rota.
 *
 * UMA consulta à fonte por acionamento. `forcar: true` pula a guarda de "já
 * buscamos hoje" de propósito: se o admin está reprocessando, é porque quer o
 * dado de agora — mas cada clique continua sendo exatamente uma requisição.
 */
export async function reprocessarCamadas(
  listingId: string,
): Promise<
  | { ok: true; resumo: ResumoCamadas; gravado: boolean }
  | { ok: false; error: string }
> {
  const admin = await getKycAdmin();
  if (!admin) return { ok: false, error: "forbidden" };

  const id = listingId.trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "id de anúncio inválido" };

  const db = getAdminSupabase();
  if (!db) return { ok: false, error: "sem service role" };

  // O CAR vem da tabela base, não do que o admin digitou: o que se reprocessa
  // é o anúncio, e o número é o que o dono declarou.
  const { data: anuncio } = await db
    .from("listings")
    .select("car_number")
    .eq("id", id)
    .maybeSingle();

  if (!anuncio) return { ok: false, error: "anúncio não encontrado" };

  const parsed = parseCar(anuncio.car_number);
  if (!parsed) return { ok: false, error: "anúncio sem CAR em formato reconhecível" };

  const res = await atualizarCamadasAmbientais({
    listingId: id,
    codImovel: parsed.normalizado,
    forcar: true,
  });

  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath(`/terra/${id}`);
  return { ok: true, resumo: res.resumo, gravado: res.gravado };
}
