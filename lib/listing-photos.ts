/**
 * FOTOS DO ANÚNCIO — o caminho do arquivo, do navegador até a vitrine.
 *
 * Compartilhado entre criar e editar anúncio, pelo mesmo motivo de
 * `lib/listing-car.ts`: duas cópias viram duas verdades.
 *
 * ── O CAMINHO, e por que ele tem três pernas ─────────────────────────────────
 *   1. servidor emite URL de upload ASSINADA para o bucket PRIVADO de staging
 *   2. navegador manda os bytes crus direto para lá (não passa pela function)
 *   3. servidor lê de staging, valida magic bytes, remove EXIF, redimensiona,
 *      converte para WebP, grava no bucket PÚBLICO e apaga o original
 *
 * A perna 2 existe porque o teto de payload da Vercel é 4,5 MB e foto de
 * celular passa disso; e porque `proxy.ts` neste repo bufferiza o corpo da
 * requisição em memória e TRUNCA EM SILÊNCIO acima do limite. Ver o comentário
 * de cabeçalho de `lib/photo-pipeline.ts` para os números e as fontes.
 *
 * A perna 3 existe porque o arquivo cru carrega coordenada GPS no EXIF, e terra
 * com localização exata pública é risco de invasão e grilagem. O cliente NUNCA
 * escreve no bucket público — ele não tem policy para isso.
 */

import "server-only";

import { randomUUID } from "node:crypto";

import { getAdminSupabase } from "./supabase-admin";
import {
  MAX_FOTOS_POR_ANUNCIO,
  caminhoDoObjeto,
  caminhoFoto,
  caminhoStaging,
  processarFoto,
  type ResultadoFoto,
} from "./photo-pipeline";

const BUCKET_PUBLICO = "listing-photos";
const BUCKET_STAGING = "listing-photos-staging";

export type UploadAssinado = {
  uuid: string;
  /** Caminho no bucket de staging. */
  path: string;
  signedUrl: string;
  token: string;
};

/**
 * Confere no SERVIDOR que o anúncio é de quem diz ser. Nunca confiamos no
 * cliente para dizer de quem é o anúncio, e a resposta não revela se o id
 * existe quando o dono é outro.
 */
async function donoConfere(
  db: NonNullable<ReturnType<typeof getAdminSupabase>>,
  listingId: string,
  ownerId: string,
): Promise<{ ok: boolean; photos: string[] }> {
  const { data } = await db
    .from("listings")
    .select("owner_id, photos")
    .eq("id", listingId)
    .maybeSingle();
  if (!data || data.owner_id !== ownerId) return { ok: false, photos: [] };
  return { ok: true, photos: (data.photos as string[] | null) ?? [] };
}

/**
 * Emite URLs de upload assinadas para o staging. Uma por arquivo, porque a
 * falha de um arquivo não pode derrubar os outros.
 *
 * O token vale 2 horas (limite do Supabase Storage) e o caminho é escolhido
 * pelo SERVIDOR — o cliente não decide onde grava.
 */
export async function emitirUploadsAssinados(
  listingId: string,
  ownerId: string,
  quantidade: number,
): Promise<{ ok: true; uploads: UploadAssinado[] } | { ok: false; error: string }> {
  const db = getAdminSupabase();
  if (!db) return { ok: false, error: "service_role_missing" };

  const dono = await donoConfere(db, listingId, ownerId);
  if (!dono.ok) return { ok: false, error: "not_found" };

  const vagas = MAX_FOTOS_POR_ANUNCIO - dono.photos.length;
  if (vagas <= 0) return { ok: false, error: "limite_de_fotos" };

  const n = Math.max(0, Math.min(quantidade, vagas));
  const uploads: UploadAssinado[] = [];

  for (let i = 0; i < n; i++) {
    const uuid = randomUUID();
    const path = caminhoStaging(ownerId, listingId, uuid);
    const { data, error } = await db.storage.from(BUCKET_STAGING).createSignedUploadUrl(path);
    if (error || !data) continue; // falha de um não derruba os outros
    uploads.push({ uuid, path, signedUrl: data.signedUrl, token: data.token });
  }

  if (uploads.length === 0) return { ok: false, error: "falha_ao_assinar" };
  return { ok: true, uploads };
}

/** Chave estável do motivo da rejeição; a copy em PT/EN vive no componente. */
export type MotivoRejeicao = Extract<ResultadoFoto, { ok: false }>["motivo"];

export type PublicarFotoResultado =
  | { ok: true; url: string; photos: string[] }
  | { ok: false; error: string; motivo?: MotivoRejeicao };

/**
 * Lê o arquivo cru do staging, trata e publica. Devolve a lista de fotos já
 * atualizada, para a interface não precisar adivinhar.
 *
 * Idempotência: se o staging não tem o arquivo (já processado, ou upload que
 * falhou), devolve erro claro em vez de gravar foto vazia.
 */
export async function publicarFotoDoStaging(
  listingId: string,
  ownerId: string,
  uuid: string,
): Promise<PublicarFotoResultado> {
  const db = getAdminSupabase();
  if (!db) return { ok: false, error: "service_role_missing" };

  const dono = await donoConfere(db, listingId, ownerId);
  if (!dono.ok) return { ok: false, error: "not_found" };
  if (dono.photos.length >= MAX_FOTOS_POR_ANUNCIO) {
    return { ok: false, error: "limite_de_fotos" };
  }

  const origem = caminhoStaging(ownerId, listingId, uuid);
  const baixado = await db.storage.from(BUCKET_STAGING).download(origem);
  if (baixado.error || !baixado.data) return { ok: false, error: "staging_vazio" };

  const bytes = new Uint8Array(await baixado.data.arrayBuffer());
  const tratada = await processarFoto(bytes);

  // Arquivo ruim: o original sai do staging de qualquer jeito. Não deixamos
  // resto de arquivo com GPS acumulando num bucket, mesmo privado.
  if (!tratada.ok) {
    await db.storage.from(BUCKET_STAGING).remove([origem]);
    return { ok: false, error: "foto_rejeitada", motivo: tratada.motivo };
  }

  const destino = caminhoFoto(ownerId, listingId, uuid);
  const enviado = await db.storage
    .from(BUCKET_PUBLICO)
    .upload(destino, tratada.bytes, { contentType: "image/webp", upsert: true });
  if (enviado.error) {
    await db.storage.from(BUCKET_STAGING).remove([origem]);
    return { ok: false, error: "falha_ao_publicar" };
  }

  // O original com EXIF morre aqui. É o ponto inteiro do bucket de staging.
  await db.storage.from(BUCKET_STAGING).remove([origem]);

  const { data: pub } = db.storage.from(BUCKET_PUBLICO).getPublicUrl(destino);
  const url = pub.publicUrl;

  // Anexa no fim: a ordem importa (photos[0] é a capa) e quem reordena é o dono.
  const photos = [...dono.photos, url].slice(0, MAX_FOTOS_POR_ANUNCIO);
  const { error } = await db.from("listings").update({ photos }).eq("id", listingId);
  if (error) return { ok: false, error: error.message };

  return { ok: true, url, photos };
}

/**
 * Reordena / define capa / remove. Uma função só, porque as três operações são
 * a mesma coisa: o dono manda a lista nova e nós validamos que ela é um
 * subconjunto da atual.
 *
 * Validar como subconjunto é o que impede o cliente de injetar URL arbitrária
 * em `photos` — que é uma coluna que ele PODE atualizar, então a checagem tem
 * de estar aqui.
 */
export async function definirOrdemDeFotos(
  listingId: string,
  ownerId: string,
  novaOrdem: string[],
): Promise<{ ok: true; photos: string[] } | { ok: false; error: string }> {
  const db = getAdminSupabase();
  if (!db) return { ok: false, error: "service_role_missing" };

  const dono = await donoConfere(db, listingId, ownerId);
  if (!dono.ok) return { ok: false, error: "not_found" };

  const atuais = new Set(dono.photos);
  const limpa = novaOrdem
    .filter((u) => atuais.has(u)) // nada que não estava lá já
    .filter((u, i, arr) => arr.indexOf(u) === i) // sem repetido
    .slice(0, MAX_FOTOS_POR_ANUNCIO);

  const removidas = dono.photos.filter((u) => !limpa.includes(u));

  const { error } = await db.from("listings").update({ photos: limpa }).eq("id", listingId);
  if (error) return { ok: false, error: error.message };

  // Apaga do bucket o que saiu da lista.
  //
  // ORDEM DELIBERADA: a linha do banco primeiro, o storage depois. Se o storage
  // falhar, sobra arquivo órfão — invisível e barato. Se fosse ao contrário,
  // sobraria URL no array apontando para arquivo que não existe, ou seja foto
  // quebrada na vitrine. Órfão é problema de custo; foto que reaparece (ou
  // some) na tela é problema de confiança.
  //
  // E a falha NUNCA derruba a operação do usuário: ele pediu para excluir a
  // foto, a foto saiu do anúncio, e é isso que ele precisa ver acontecer.
  if (removidas.length > 0) {
    const paths = removidas
      .map((u) => caminhoDoObjeto(u, BUCKET_PUBLICO, ownerId, listingId))
      .filter((p): p is string => !!p);

    // O que NÃO virou caminho válido fica registrado: ou é URL de fora (que a
    // gente se recusa a apagar, de propósito), ou é sinal de que o formato da
    // URL pública mudou e o descarte parou de funcionar em silêncio.
    const naoResolvidas = removidas.length - paths.length;
    if (naoResolvidas > 0) {
      console.warn(
        `[listing-photos] ${naoResolvidas} de ${removidas.length} URL(s) removidas do anuncio ${listingId} nao resolveram para objeto deste dono; objeto NAO apagado.`,
      );
    }

    if (paths.length > 0) {
      const { error: errStorage } = await db.storage.from(BUCKET_PUBLICO).remove(paths);
      if (errStorage) {
        // Órfão consciente, não silencioso.
        console.error(
          `[listing-photos] falha ao apagar ${paths.length} objeto(s) do bucket ${BUCKET_PUBLICO} (anuncio ${listingId}): ${errStorage.message}`,
        );
      }

      // Cinto e suspensório: se por algum motivo o original cru ainda estiver no
      // staging (upload abandonado com o mesmo uuid), ele morre junto. O arquivo
      // ali carrega EXIF com GPS, então não deixamos acumular nem em bucket
      // privado. Falhar aqui é irrelevante e não é reportado.
      const staging = paths.map((p) => p.replace(/\.webp$/, ""));
      await db.storage.from(BUCKET_STAGING).remove(staging).catch(() => {});
    }
  }

  return { ok: true, photos: limpa };
}
