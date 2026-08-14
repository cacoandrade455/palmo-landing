import "server-only";

import { consultarCamadasCar } from "./car-camadas";
import {
  areaHectares,
  contarPontos,
  paraGeoJson,
  paraMultiPoligono,
  simplificar,
  type MultiPoligono,
} from "./geo-poligonos";
import { uniao } from "./geo-uniao";
import { getAdminSupabase } from "./supabase-admin";

/**
 * CAMADAS AMBIENTAIS DE UM ANÚNCIO — buscar, medir, gravar.
 *
 * A ponte entre o adapter (`lib/car-camadas.ts`), a aritmética
 * (`lib/geo-poligonos.ts` + `lib/geo-uniao.ts`) e a tabela
 * `listing_car_layers`, do mesmo jeito que `lib/listing-car.ts` é a ponte do
 * selo. Escrita EXCLUSIVA da service role: `listing_car_layers` não tem policy
 * de INSERT/UPDATE/DELETE para ninguém, e os privilégios estão revogados na
 * raiz.
 *
 * ── O QUE ISTO NÃO FAZ, E NÃO PODE PASSAR A FAZER ────────────────────────────
 * Nenhum cálculo de APP ou Reserva Legal pelo Código Florestal. Nenhum juízo
 * de conformidade. Nenhuma palavra do tipo "regular" ou "irregular". Só
 * exibimos o que o SICAR declara, com fonte e data. O dia em que alguém quiser
 * transformar isto num parecer ambiental, o lugar é outro produto, com um
 * engenheiro florestal assinando.
 *
 * ── E NUNCA BLOQUEIA NADA ────────────────────────────────────────────────────
 * Camada ambiental é ENRIQUECIMENTO. Falha de rede, imóvel sem tema declarado,
 * união que não fecha: tudo devolve `{ ok: false }` e a vida segue. Nada aqui
 * pode impedir uma publicação, e nada aqui vira veredito sobre ninguém.
 */

/**
 * Tolerância da simplificação de EXIBIÇÃO, em metros.
 *
 * ── DE ONDE VEM O NÚMERO ─────────────────────────────────────────────────────
 * Medido em 13/08/2026 nas duas amostras do lote. No imóvel de 598 ha em
 * Araguaçu/TO (perímetro + RL + 4 tipos de APP, 2.034 posições no total):
 *
 *   tolerância    posições    JSON      erro de área do desenho
 *      1 m       977/2034    26,8 KB          0,003%
 *      3 m       796/2034    21,9 KB          0,008%
 *     10 m       574/2034    15,8 KB          0,065%
 *     20 m       378/2034    10,5 KB          0,323%
 *
 * 3 m corta 60% das posições com erro de desenho de 0,008%, e 3 m é menos de
 * um pixel no mapa que a página mostra (a 390 px de largura, um imóvel de 600
 * ha dá uns 6 m por pixel). Não adianta guardar mais detalhe do que a tela
 * consegue exibir.
 *
 * ⚠️  A tolerância NÃO afeta número nenhum: toda área deste lote é medida sobre
 *     a geometria ORIGINAL, antes de simplificar. A simplificação é do desenho.
 */
export const TOLERANCIA_SIMPLIFICACAO_M = 3;

export type ResumoCamadas = {
  camadas_presentes: string[];
  area_total_ha: number | null;
  area_rl_ha: number | null;
  area_app_ha: number | null;
  area_rl_app_uniao_ha: number | null;
  area_util_estimada_ha: number | null;
  pontos: number;
};

export type ResultadoCamadas =
  | { ok: true; gravado: boolean; resumo: ResumoCamadas }
  | { ok: false; error: string };

/** Arredonda para 4 casas: o SICAR publica área com 4 decimais. */
function ha(n: number | null): number | null {
  return n == null || !Number.isFinite(n) ? null : Math.round(n * 10000) / 10000;
}

/**
 * O perímetro que JÁ TEMOS. A validação de CAR grava a geometria do imóvel em
 * `listing_car_verifications.geometria` desde jul/2026, e reusá-la é o certo
 * por dois motivos: não pede à fonte o que ela já nos deu, e mantém o desenho
 * amarrado ao MESMO polígono que sustenta o selo.
 *
 * Busca pelo `cod_imovel` e não pelo anúncio porque o caminho de reaproveitamento
 * de consulta (mesma consulta no mesmo dia) grava a linha SEM geometria — a
 * linha mais recente pode ter `geometria` nula com o selo intacto.
 */
async function perimetroGravado(
  db: NonNullable<ReturnType<typeof getAdminSupabase>>,
  codImovel: string,
): Promise<{ mp: MultiPoligono | null; areaOficialHa: number | null }> {
  const { data } = await db
    .from("listing_car_verifications")
    .select("geometria, area_ha")
    .eq("car_number_consultado", codImovel)
    .not("geometria", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    mp: paraMultiPoligono(data?.geometria),
    areaOficialHa: typeof data?.area_ha === "number" ? data.area_ha : null,
  };
}

/** Já buscamos hoje para este anúncio e este CAR? */
async function buscadoHoje(
  db: NonNullable<ReturnType<typeof getAdminSupabase>>,
  listingId: string,
  codImovel: string,
): Promise<boolean> {
  const desde = new Date();
  desde.setUTCHours(0, 0, 0, 0);

  const { data } = await db
    .from("listing_car_layers")
    .select("fetched_at")
    .eq("listing_id", listingId)
    .eq("cod_imovel", codImovel)
    .gte("fetched_at", desde.toISOString())
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

/**
 * Busca as camadas ambientais do imóvel, mede as áreas e grava UMA linha por
 * anúncio (a chave única é `listing_id`, então reprocessar substitui).
 *
 * ⚠️  Chamado por EVENTO: verificação de CAR na criação/edição do anúncio, e a
 *     ação administrativa de reprocessamento. NUNCA por pageview.
 *
 * @param forcar ignora a guarda de "já buscamos hoje". Só o reprocessamento
 *               administrativo usa.
 */
export async function atualizarCamadasAmbientais(entrada: {
  listingId: string;
  codImovel: string;
  forcar?: boolean;
}): Promise<ResultadoCamadas> {
  const db = getAdminSupabase();
  if (!db) return { ok: false, error: "sem service role" };

  if (!entrada.forcar && (await buscadoHoje(db, entrada.listingId, entrada.codImovel))) {
    return { ok: false, error: "ja buscado hoje" };
  }

  const gravado = await perimetroGravado(db, entrada.codImovel);

  // Só pedimos o perímetro à fonte quando não temos nenhum guardado.
  const resposta = await consultarCamadasCar(entrada.codImovel, gravado.mp === null);
  if (!resposta.consultado) return { ok: false, error: resposta.error ?? "consulta falhou" };

  const perimetro = gravado.mp ?? resposta.perimetro;
  // Sem perímetro não há o que desenhar nem de onde subtrair. RL e APP soltas
  // no mapa, sem o contorno do imóvel, não dizem nada a ninguém.
  if (!perimetro) return { ok: false, error: "sem perimetro" };

  const rl = resposta.rl;
  const app = resposta.app;

  // ── ÁREAS ──────────────────────────────────────────────────────────────────
  // Área total: o atributo oficial do SICAR quando existe (é ele que o
  // proprietário vê no próprio cadastro); a medida sobre a geometria só quando
  // não existe. As duas concordam dentro de 0,07% nas amostras do lote.
  const areaPerimetroCalculada = areaHectares(perimetro);
  const areaTotal = gravado.areaOficialHa ?? areaPerimetroCalculada;
  const areaTotalFonte = gravado.areaOficialHa != null ? "sicar_atributo" : "calculada_geometria";

  // Área por camada: idem, atributo oficial (`nu_area_imovel`) na frente.
  const areaRl = rl ? resposta.area_rl_oficial_ha ?? areaHectares(uniao([rl]) ?? rl) : null;
  const areaApp = app ? resposta.area_app_oficial_ha ?? areaHectares(uniao([app]) ?? app) : null;

  // A UNIÃO não tem atributo oficial e nunca terá: ela é a interseção de duas
  // camadas que o CAR publica separadas. Medida sobre a geometria, sempre.
  const partes = [rl, app].filter((p): p is MultiPoligono => p !== null);
  const uniaoRlApp = partes.length > 0 ? uniao(partes) : null;
  const areaUniao = uniaoRlApp ? areaHectares(uniaoRlApp) : null;

  // Área útil só existe quando houve o que subtrair. Sem RL nem APP declaradas
  // não escrevemos "toda a área está livre": a fonte não disse isso — ela não
  // disse nada, e as duas coisas não são a mesma.
  //
  // E se a subtração der negativo (RL ou APP declaradas fora do perímetro, que
  // acontece), o resultado é `null`, não zero. Zero seria um veredito.
  let areaUtil: number | null = null;
  if (areaUniao != null) {
    const bruto = areaTotal - areaUniao;
    areaUtil = bruto >= 0 ? bruto : null;
  }

  // ── GEOMETRIA DE EXIBIÇÃO ──────────────────────────────────────────────────
  // Simplificada DEPOIS de medir. O contorno exato continua onde sempre esteve:
  // privado, em `listing_car_verifications.geometria`.
  const perimetroSimples = simplificar(perimetro, TOLERANCIA_SIMPLIFICACAO_M);
  const rlSimples = rl ? simplificar(uniao([rl]) ?? rl, TOLERANCIA_SIMPLIFICACAO_M) : null;
  const appSimples = app ? simplificar(uniao([app]) ?? app, TOLERANCIA_SIMPLIFICACAO_M) : null;

  const resumo: ResumoCamadas = {
    camadas_presentes: resposta.camadas_presentes,
    area_total_ha: ha(areaTotal),
    area_rl_ha: ha(areaRl),
    area_app_ha: ha(areaApp),
    area_rl_app_uniao_ha: ha(areaUniao),
    area_util_estimada_ha: ha(areaUtil),
    pontos:
      contarPontos(perimetroSimples) +
      (rlSimples ? contarPontos(rlSimples) : 0) +
      (appSimples ? contarPontos(appSimples) : 0),
  };

  const { error } = await db.from("listing_car_layers").upsert(
    {
      listing_id: entrada.listingId,
      cod_imovel: entrada.codImovel,
      source: resposta.fonte,
      fetched_at: resposta.consultado_em,
      crs: resposta.crs,
      simplificacao_m: TOLERANCIA_SIMPLIFICACAO_M,
      geom_perimetro: paraGeoJson(perimetroSimples),
      geom_rl: rlSimples ? paraGeoJson(rlSimples) : null,
      geom_app: appSimples ? paraGeoJson(appSimples) : null,
      area_total_ha: resumo.area_total_ha,
      area_total_fonte: areaTotalFonte,
      area_rl_ha: resumo.area_rl_ha,
      area_rl_fonte: rl ? (resposta.area_rl_oficial_ha != null ? "sicar_atributo" : "calculada_geometria") : null,
      area_app_ha: resumo.area_app_ha,
      area_app_fonte: app ? (resposta.area_app_oficial_ha != null ? "sicar_atributo" : "calculada_geometria") : null,
      area_rl_app_uniao_ha: resumo.area_rl_app_uniao_ha,
      area_util_estimada_ha: resumo.area_util_estimada_ha,
      camadas_presentes: resposta.camadas_presentes,
      // Escrito à mão porque `default now()` só vale no INSERT, e este upsert
      // vira UPDATE em todo reprocessamento. Coluna de data que para no tempo
      // é pior que coluna nenhuma.
      updated_at: new Date().toISOString(),
    },
    { onConflict: "listing_id" },
  );

  return { ok: true, gravado: !error, resumo };
}
