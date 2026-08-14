import "server-only";

import { USER_AGENT_SICAR } from "./car-sicar";
import { paraMultiPoligono, type MultiPoligono } from "./geo-poligonos";

/**
 * CAMADAS AMBIENTAIS DECLARADAS NO CAR — o segundo adapter do SICAR.
 *
 * ── POR QUE UM SEGUNDO ENDEREÇO ──────────────────────────────────────────────
 * O WFS que sustenta o selo (`geoserver.car.gov.br/geoserver/sicar`) tem UMA
 * coisa e só uma: o perímetro dos imóveis, em 27 camadas por UF. Sondado em
 * 13/08/2026, o GetCapabilities daquele workspace lista `sicar_imoveis_ac` até
 * `sicar_imoveis_to` e MAIS NADA — nem APP, nem Reserva Legal, nem vegetação.
 * Nenhum outro workspace responde ali (`car`, `temas`, `sicar_temas`, `app`,
 * `publico`, `geral`, `base`, `cartografia`, `camadas`: todos 404).
 *
 * As camadas ambientais moram no GeoServer da consulta pública NOVA:
 * `consulta.car.gov.br/geoserver/consulta_publica/wfs`, workspace
 * `consulta_publica`, 130 camadas vetoriais, todas com `cod_imovel` e todas
 * filtráveis por ele. É o mesmo serviço que desenha o mapa do portal público
 * (descoberto pelo `api/map/getLayers` do próprio portal), então não estamos
 * usando porta de fundos: é a porta da frente, sem o front-end na frente.
 *
 * ── CIVILIDADE, e ela é o motivo do desenho todo ─────────────────────────────
 * • UMA requisição HTTP por EVENTO de anúncio. O WFS aceita múltiplos
 *   `typeName` num GetFeature só, com um `cql_filter` por camada separado por
 *   ponto e vírgula — então as 20 camadas cabem numa chamada. Medido em
 *   13/08/2026: 0,52 s e 59 KB para um imóvel de 209 ha em Araguaçu/TO.
 *   O prefixo do `id` de cada feição ("arl_proposta.abc-123") é o que diz de
 *   qual camada ela veio.
 * • `propertyName` mínimo: `cod_imovel`, `geom` e `nu_area_imovel`. Nada de
 *   atributo que não vamos usar, e em nenhuma hipótese coordenada de ponto.
 *
 * ── `nu_area_imovel` É A ÁREA DA FEIÇÃO, NÃO A DO IMÓVEL ─────────────────────
 * O nome do atributo engana. Nas camadas temáticas ele traz a área DAQUELA
 * feição, e é o número oficial que o brief manda priorizar. Conferido em
 * 13/08/2026 em duas amostras independentes: na RL de
 * TO-1702000-55760ACF... o atributo diz 209,4212 ha e a nossa medida sobre a
 * geometria dá 209,42 ha, enquanto o IMÓVEL inteiro tem 598,3149 ha; na RL de
 * BA-2933257-84D47D4B... o atributo diz 154,5009 ha contra 772,0668 ha de
 * imóvel. Não é a área do imóvel, é a da camada. A camada de perímetro
 * (`iru`) NÃO tem esse atributo — mais uma confirmação.
 * • User-Agent identifica a Palmo, o mesmo do adapter do selo.
 * • Timeout curto e explícito; falha volta como `{ ok: false }` e NUNCA
 *   derruba nem bloqueia o anúncio. Camada ambiental é enriquecimento.
 * • NUNCA por pageview. Quem chama é a verificação de CAR (criação/edição de
 *   anúncio) e a ação administrativa de reprocessamento.
 *
 * ── TERMO DE USO ─────────────────────────────────────────────────────────────
 * Mesmo estado do outro endpoint, conferido em 13/08/2026: o documento de
 * capabilities declara `<Fees>NONE</Fees>` e `<AccessConstraints>NONE</...>`,
 * que é declaração OGC de ausência de taxa e restrição — não é termo jurídico.
 * Vale a mesma regra: ausência de captcha não é autorização, então usamos com
 * parcimônia e identificados.
 */

const WFS_BASE = "https://consulta.car.gov.br/geoserver/consulta_publica/wfs";

/** Identificador da fonte, gravado em `listing_car_layers.source`. */
export const FONTE_CAMADAS = "wfs-sicar-consulta-publica";

/**
 * Timeout maior que o do selo (8 s) porque a resposta é maior: são até 20
 * camadas com polígono. Continua curto o suficiente para nunca virar espera.
 */
const TIMEOUT_MS = 12000;

/**
 * Teto de payload. Imóvel gigante com hidrografia detalhada pode devolver
 * muita coisa, e nada nesta rota justifica carregar dezenas de megabytes na
 * memória de uma function.
 */
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * RESERVA LEGAL — as três situações que o CAR distingue. Todas são Reserva
 * Legal DECLARADA; a diferença entre proposta, averbada e aprovada é o estágio
 * do trâmite, e este lote não emite juízo sobre trâmite nenhum.
 */
const CAMADAS_RL = [
  "arl_proposta",
  "arl_averbada",
  "arl_aprovada_nao_averbada",
] as const;

/**
 * ÁREA DE PRESERVAÇÃO PERMANENTE — os 17 tipos de APP declarada.
 *
 * ── O QUE FICOU DE FORA, E POR QUE ───────────────────────────────────────────
 * As camadas `app_escadinha_*` ("APP a recompor", a escadinha do art. 61-A)
 * NÃO entram. Medido em 13/08/2026 no imóvel
 * TO-1705102-1ED3EAE275E34E19AF4ACECBDF0D8A7C: a escadinha tem 0,6560 ha e a
 * APP correspondente 6,7377 ha, e a diferença `escadinha menos APP` deu
 * 0,000001 ha — ou seja, a escadinha está CONTIDA na APP. Como tudo aqui é
 * unido antes de medir, incluí-la não mudaria número nenhum, e deixá-la de
 * fora evita afirmar que obrigação de recomposição é APP declarada a mais.
 *
 * Também ficam de fora as camadas de FEIÇÃO (rio, nascente, lago, vereda): são
 * o objeto que gera a APP, não a APP. Desenhá-las junto sugeriria que o corpo
 * d'água é área protegida além da faixa, o que não é o que o CAR declara.
 */
const CAMADAS_APP = [
  "app_rio_ate_10",
  "app_rio_10_a_50",
  "app_rio_50_a_200",
  "app_rio_200_a_600",
  "app_rio_acima_600",
  "app_nascente_olho_dagua",
  "app_lago_natural",
  "app_reservatorio_artificial_decorrente_barramento",
  "app_reservatorio_geracao_energia_ate_24_08_2001",
  "app_vereda",
  "app_manguezal",
  "app_banhado",
  "app_restinga",
  "app_area_topo_morro",
  "app_area_altitude_superior_1800",
  "app_borda_chapada",
  "app_area_declividade_maior_45",
] as const;

/** Perímetro declarado. Só é pedido quando não temos o do selo para reusar. */
const CAMADA_PERIMETRO = "iru";

export type CamadasCarResposta = {
  /** `true` quando a fonte respondeu — mesmo que sem nenhuma feição. */
  consultado: boolean;
  fonte: string;
  /** ISO. Vira `fetched_at`, e é o que a interface mostra como data da consulta. */
  consultado_em: string;
  /** CRS declarado pela fonte. Observado: `urn:ogc:def:crs:EPSG::4674`. */
  crs: string | null;
  rl: MultiPoligono | null;
  app: MultiPoligono | null;
  /** Só vem preenchido quando `incluirPerimetro` foi pedido. */
  perimetro: MultiPoligono | null;
  /**
   * Área oficial (`nu_area_imovel`) do grupo, em hectares — e SÓ quando o
   * grupo tem UMA feição.
   *
   * ── POR QUE NÃO SOMAR ────────────────────────────────────────────────────
   * Porque as APPs de tipos diferentes se sobrepõem entre si. Medido em
   * 13/08/2026 no imóvel TO-1702000-55760ACF...: as quatro camadas de APP
   * declaram 62,3355 ha somados, mas a UNIÃO delas mede 60,0848 ha — 2,25 ha
   * contados duas vezes (a APP da nascente cai dentro da APP do rio, o que é
   * o esperado, não erro de cadastro). Somar atributo oficial de grupo com
   * mais de uma feição produziria um número maior que a área que existe no
   * chão.
   *
   * Com uma feição só, o atributo é a área daquele polígono e bate com a
   * nossa medida dentro de 0,07% — aí ele vale, e é o número que o
   * proprietário vê no próprio cadastro.
   *
   * `null` também quando nenhuma feição trouxe o atributo. Nos dois casos
   * quem chama mede sobre a geometria e DIZ que mediu.
   */
  area_rl_oficial_ha: number | null;
  area_app_oficial_ha: number | null;
  /** Quais camadas devolveram feição. Rastro para o relatório e a auditoria. */
  camadas_presentes: string[];
  error: string | null;
};

function vazio(consultado_em: string, error: string | null): CamadasCarResposta {
  return {
    consultado: false,
    fonte: FONTE_CAMADAS,
    consultado_em,
    crs: null,
    rl: null,
    app: null,
    perimetro: null,
    area_rl_oficial_ha: null,
    area_app_oficial_ha: null,
    camadas_presentes: [],
    error,
  };
}

/**
 * Junta as feições de várias camadas num multipolígono só. NÃO faz união
 * booleana: isso é `lib/geo-uniao.ts`, e acontece na hora de medir. Aqui é
 * concatenação pura, porque o desenho quer todos os pedaços.
 */
function juntar(partes: MultiPoligono[]): MultiPoligono | null {
  const todas = partes.flat();
  return todas.length > 0 ? todas : null;
}

/**
 * Consulta as camadas ambientais de UM imóvel. Nunca lança: falha externa volta
 * como `consultado: false` com `error` preenchido.
 *
 * @param codImovel já normalizado por `parseCar` (forma UF-IBGE-SUFIXO).
 * @param incluirPerimetro só quando não há perímetro gravado para reusar.
 */
export async function consultarCamadasCar(
  codImovel: string,
  incluirPerimetro = false,
): Promise<CamadasCarResposta> {
  const consultado_em = new Date().toISOString();

  const camadas: string[] = [
    ...CAMADAS_RL,
    ...CAMADAS_APP,
    ...(incluirPerimetro ? [CAMADA_PERIMETRO] : []),
  ];

  // O `cod_imovel` já passou por `parseCar` e só contém [A-Z0-9-]; não há como
  // injetar aspas no CQL. Ainda assim conferimos, porque esta função é
  // exportada e um chamador futuro pode não saber disso.
  if (!/^[A-Z]{2}-\d{7}-[0-9A-F]{32}$/.test(codImovel)) {
    return vazio(consultado_em, "cod_imovel fora da forma canonica");
  }

  const params = new URLSearchParams({
    service: "WFS",
    version: "1.1.0",
    request: "GetFeature",
    outputFormat: "application/json",
    typeName: camadas.map((c) => `consulta_publica:${c}`).join(","),
    // Um grupo de propriedades por camada, na MESMA ORDEM dos typeName. O
    // perímetro é o único sem `nu_area_imovel`, e pedir atributo inexistente
    // faz o GeoServer recusar a requisição inteira com InvalidParameterValue.
    propertyName: camadas
      .map((c) => (c === CAMADA_PERIMETRO ? "(cod_imovel,geom)" : "(cod_imovel,nu_area_imovel,geom)"))
      .join(""),
    cql_filter: camadas.map(() => `cod_imovel='${codImovel}'`).join(";"),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${WFS_BASE}?${params.toString()}`, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT_SICAR, Accept: "application/json" },
      signal: controller.signal,
      // Consulta pontual e auditada: o rastro tem que refletir o que a fonte
      // disse agora, não o que um cache de runtime guardou.
      cache: "no-store",
    });

    if (!res.ok) return vazio(consultado_em, `HTTP ${res.status}`);

    const tamanho = Number(res.headers.get("content-length") ?? 0);
    if (tamanho > MAX_BYTES) {
      return vazio(consultado_em, `resposta grande demais (${tamanho} bytes)`);
    }

    const body = (await res.json()) as {
      features?: Array<{
        id?: unknown;
        geometry?: unknown;
        properties?: Record<string, unknown> | null;
      }>;
      crs?: { properties?: { name?: string } } | null;
    };

    const feats = Array.isArray(body.features) ? body.features : [];

    const porCamada = new Map<string, MultiPoligono[]>();
    /** Área oficial por FEIÇÃO, na forma [camada, area_ha]. */
    const areasPorFeicao: Array<[string, number]> = [];

    for (const f of feats) {
      // "arl_proposta.9f1e..." → "arl_proposta". Sem o prefixo não dá para
      // saber de qual camada a feição veio, e feição sem camada é descartada:
      // melhor perder um polígono que atribuí-lo à camada errada.
      const id = typeof f.id === "string" ? f.id : "";
      const camada = id.includes(".") ? id.slice(0, id.indexOf(".")) : "";
      if (!camada || !camadas.includes(camada)) continue;
      const mp = paraMultiPoligono(f.geometry);
      if (!mp) continue;
      porCamada.set(camada, [...(porCamada.get(camada) ?? []), mp]);

      const bruto = f.properties?.nu_area_imovel;
      const n = typeof bruto === "number" ? bruto : Number(bruto);
      if (Number.isFinite(n) && n > 0) areasPorFeicao.push([camada, n]);
    }

    const pegar = (nomes: readonly string[]): MultiPoligono | null =>
      juntar(nomes.flatMap((n) => porCamada.get(n) ?? []));

    /**
     * O atributo oficial do grupo — só quando o grupo tem UMA feição. Com
     * duas ou mais, somar contaria a sobreposição entre elas duas vezes, e o
     * número oficial deixa de ser a área do grupo (ver o comentário do tipo).
     */
    const oficialDoGrupo = (nomes: readonly string[]): number | null => {
      const doGrupo = areasPorFeicao.filter(([camada]) => nomes.includes(camada));
      const feicoes = nomes.reduce((n, nome) => n + (porCamada.get(nome)?.length ?? 0), 0);
      return feicoes === 1 && doGrupo.length === 1 ? doGrupo[0][1] : null;
    };

    return {
      consultado: true,
      fonte: FONTE_CAMADAS,
      consultado_em,
      crs: body.crs?.properties?.name ?? null,
      rl: pegar(CAMADAS_RL),
      app: pegar(CAMADAS_APP),
      perimetro: incluirPerimetro ? pegar([CAMADA_PERIMETRO]) : null,
      area_rl_oficial_ha: oficialDoGrupo(CAMADAS_RL),
      area_app_oficial_ha: oficialDoGrupo(CAMADAS_APP),
      camadas_presentes: [...porCamada.keys()].sort(),
      error: null,
    };
  } catch (e) {
    const error =
      e instanceof Error
        ? e.name === "AbortError"
          ? `timeout apos ${TIMEOUT_MS}ms`
          : e.message
        : "falha desconhecida";
    return vazio(consultado_em, error);
  } finally {
    clearTimeout(timer);
  }
}
