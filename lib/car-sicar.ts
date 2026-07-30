/**
 * CONSULTA AO SICAR — o adapter.
 *
 * ── POR QUE ESTE ARQUIVO EXISTE COM ESTA FORMA ───────────────────────────────
 * A porta que respondeu em jul/2026 é o GeoServer WFS do portal LEGADO. Ela é
 * ótima hoje e pode sair do ar amanhã, quando o portal novo consolidar. Então o
 * resto do app NÃO conhece o WFS: conhece `consultarCar()`, cuja assinatura é
 * estável. Trocar de fonte é trocar `fonteAtiva()` — um lugar, uma linha.
 *
 * A segunda implementação (base ingerida localmente) está DESENHADA no fim
 * deste arquivo e NÃO construída, de propósito.
 *
 * ── REGRAS DE CIVILIDADE, e elas não são decorativas ─────────────────────────
 * • Uma consulta por CRIAÇÃO ou EDIÇÃO de anúncio. NUNCA por pageview.
 *   Quem chama isto são as server actions de anunciar/editar, e mais nada.
 * • User-Agent identifica a Palmo com e-mail de contato. Se o serviço quiser
 *   falar com a gente ou nos barrar, tem por onde.
 * • Timeout curto e explícito: a submissão do anúncio nunca fica pendurada em
 *   I/O externo. Falha do SICAR NÃO derruba o anúncio.
 * • `propertyName` é explícito e mínimo. Isso não é otimização: o endpoint REST
 *   alternativo do portal novo devolve latitude/longitude exatas do imóvel, e
 *   nós não queremos esse dado. Com `propertyName` o WFS nunca manda coordenada
 *   de ponto — só o polígono, que pedimos deliberadamente e guardamos privado.
 *
 * ── TERMO DE USO: ausência de captcha NÃO é autorização ──────────────────────
 * Procurado em 29/07/2026 e NÃO ENCONTRADO termo de uso publicado para este
 * endpoint: `car.gov.br/termos-de-uso` devolve 404, a página de geoserviços do
 * portal legado redireciona (302) e `geoserver.car.gov.br/robots.txt` devolve
 * 404. O documento de capabilities do serviço declara `<Fees>NONE</Fees>` e
 * `<AccessConstraints>NONE</AccessConstraints>`, o que é uma declaração OGC de
 * que não há taxa nem restrição — mas não é um termo de uso jurídico.
 * Consequência prática: usamos com parcimônia (uma consulta por evento de
 * anúncio), identificados, e o Carlos decide se busca autorização formal.
 */

import "server-only";

import type { CarSicarLookup } from "./car-checks";

/** Identificação da Palmo em toda chamada externa. */
const USER_AGENT =
  "Palmo/1.0 (marketplace de terras; validacao de CAR; contato: cacoandrade45@gmail.com)";

/**
 * Timeout curto e EXPLÍCITO. Nada de default de runtime.
 *
 * ── DE ONDE VEM O NÚMERO ─────────────────────────────────────────────────────
 * A consulta filtrada por `cod_imovel` foi medida em 29/07/2026: 0,330 s /
 * 0,329 s / 0,330 s em três chamadas consecutivas, e 0,324 s no caso de imóvel
 * não encontrado. 8 s é ~24× a mediana observada: folga suficiente para um dia
 * ruim do geoserver sem nunca virar espera de verdade.
 *
 * ── E O QUE ACONTECE QUANDO ESTOURA ──────────────────────────────────────────
 * O `AbortError` cai no `catch` e devolve `consulted: false`, o que faz
 * `decideCar` parar em `formato_ok` — NUNCA em `divergente_sicar`. É a mesma
 * regra de três saídas do resto do lote: "não deu para conferir" não é "não
 * confere", e um geoserver lento não pode marcar um proprietário como suspeito.
 *
 * ── E POR QUE 8 s NÃO PENDURA NINGUÉM ────────────────────────────────────────
 * Na CRIAÇÃO do anúncio nada disto está no caminho crítico: `ListingForm` chama
 * `verificarCarDoAnuncio` com `void`, depois de o anúncio já estar salvo — o
 * mesmo idioma que o arquivo já usa para `acceptListingTerms`. O usuário nunca
 * espera.
 *
 * Na EDIÇÃO a chamada é aguardada, de propósito: o anúncio já foi gravado antes,
 * então o dado do usuário está seguro, e ele precisa ver o selo NOVO na resposta
 * (o antigo acabou de deixar de valer). A alternativa — disparar sem aguardar —
 * corre o risco de a function ser congelada pelo runtime serverless antes de a
 * verificação terminar, e aí o selo simplesmente nunca seria recalculado. Entre
 * esperar 0,33 s no caso normal e perder a verificação em silêncio, esperar é o
 * certo.
 */
const TIMEOUT_MS = 8000;

/**
 * Geometria do imóvel, como o SICAR devolve.
 *
 * Guardada em coluna PRIVADA (`listing_car_verifications.geometria`), jsonb,
 * fora da view pública. NÃO é exibida em lugar nenhum neste lote: é insumo da
 * camada de satélite, e é caro de conseguir depois. CRS observado: EPSG:4674
 * (SIRGAS 2000), o sistema geodésico oficial brasileiro.
 */
export type CarGeometria = {
  type: string;
  coordinates: unknown;
} | null;

export type CarSicarResposta = {
  lookup: CarSicarLookup;
  geometria: CarGeometria;
  /** CRS declarado pela fonte, para não perder a referência do polígono. */
  crs: string | null;
};

/**
 * O contrato que qualquer fonte de CAR precisa cumprir. É isto que mantém o
 * resto do app ignorante sobre qual porta está aberta.
 */
export type CarSicarFonte = {
  /** Vai gravado em `car_fonte`, para o selo poder dizer de onde veio. */
  readonly id: string;
  readonly descricao: string;
  consultar(codImovel: string): Promise<CarSicarResposta>;
};

function lookupVazio(source: string | null): CarSicarLookup {
  return {
    consulted: false,
    source,
    checked_at: null,
    found: null,
    status_imovel: null,
    area_ha: null,
    uf: null,
    municipio: null,
    municipio_ibge: null,
    condicao: null,
    tipo_imovel: null,
    dat_criacao: null,
    data_atualizacao: null,
    error: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTAÇÃO 1 (ativa) — WFS do portal legado
// ─────────────────────────────────────────────────────────────────────────────

const WFS_BASE = "https://geoserver.car.gov.br/geoserver/sicar/wfs";

/**
 * As camadas são POR UF (`sicar:sicar_imoveis_ba`), então a UF dentro do
 * cod_imovel escolhe a camada. Isso é seguro: em 800/800 amostras o prefixo de
 * UF bateu com o atributo `uf` da própria base.
 */
function camadaDaUf(uf: string): string {
  return `sicar:sicar_imoveis_${uf.toLowerCase()}`;
}

/** Campos pedidos explicitamente. Nada de coordenada de ponto. */
const PROPERTY_NAMES = [
  "cod_imovel",
  "status_imovel",
  "area",
  "condicao",
  "uf",
  "municipio",
  "cod_municipio_ibge",
  "tipo_imovel",
  "dat_criacao",
  "data_atualizacao",
  "geo_area_imovel",
].join(",");

export const fonteWfsLegado: CarSicarFonte = {
  id: "wfs-sicar-legado",
  descricao:
    "GeoServer WFS 1.1.0 do portal legado do SICAR (geoserver.car.gov.br/geoserver/sicar), consulta ao vivo por cod_imovel",

  async consultar(codImovel: string): Promise<CarSicarResposta> {
    const vazio = lookupVazio(this.id);
    const uf = codImovel.slice(0, 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(uf)) {
      return {
        lookup: { ...vazio, error: "cod_imovel sem UF reconhecivel" },
        geometria: null,
        crs: null,
      };
    }

    // CQL com aspas simples; o código já foi normalizado por `parseCar` e só
    // contém [A-Z0-9-], então não há como injetar aspas aqui.
    const params = new URLSearchParams({
      service: "WFS",
      version: "1.1.0",
      request: "GetFeature",
      typeName: camadaDaUf(uf),
      outputFormat: "application/json",
      maxFeatures: "1",
      propertyName: PROPERTY_NAMES,
      cql_filter: `cod_imovel='${codImovel}'`,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const checked_at = new Date().toISOString();

    try {
      const res = await fetch(`${WFS_BASE}?${params.toString()}`, {
        method: "GET",
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: controller.signal,
        // Consulta pontual e auditada: nunca queremos resposta de cache do
        // runtime aqui, o rastro tem que refletir o que a fonte disse agora.
        cache: "no-store",
      });

      if (!res.ok) {
        return {
          lookup: { ...vazio, checked_at, error: `HTTP ${res.status}` },
          geometria: null,
          crs: null,
        };
      }

      const body = (await res.json()) as {
        features?: Array<{
          geometry?: { type?: string; coordinates?: unknown } | null;
          properties?: Record<string, unknown> | null;
        }>;
        crs?: { properties?: { name?: string } } | null;
      };

      const feats = Array.isArray(body.features) ? body.features : [];

      // Resposta vazia é o SICAR dizendo "não tenho esse imóvel". É informação
      // boa, não erro: `consulted: true` + `found: false`.
      if (feats.length === 0) {
        return {
          lookup: { ...vazio, consulted: true, checked_at, found: false },
          geometria: null,
          crs: null,
        };
      }

      const p = feats[0].properties ?? {};
      const num = (v: unknown): number | null => {
        const n = typeof v === "number" ? v : v == null ? NaN : Number(v);
        return Number.isFinite(n) ? n : null;
      };
      const str = (v: unknown): string | null =>
        typeof v === "string" && v.trim() ? v.trim() : v == null ? null : String(v);

      const g = feats[0].geometry;
      const geometria: CarGeometria =
        g && typeof g.type === "string" && g.coordinates != null
          ? { type: g.type, coordinates: g.coordinates }
          : null;

      return {
        lookup: {
          consulted: true,
          source: this.id,
          checked_at,
          found: true,
          status_imovel: str(p.status_imovel),
          area_ha: num(p.area),
          uf: str(p.uf),
          municipio: str(p.municipio),
          municipio_ibge: num(p.cod_municipio_ibge),
          condicao: str(p.condicao),
          tipo_imovel: str(p.tipo_imovel),
          dat_criacao: str(p.dat_criacao),
          data_atualizacao: str(p.data_atualizacao),
          error: null,
        },
        geometria,
        crs: body.crs?.properties?.name ?? null,
      };
    } catch (e) {
      // Timeout, DNS, TLS, JSON quebrado: tudo cai aqui, e nada disso pode
      // derrubar o anúncio. `consulted: false` faz o `decideCar` parar em
      // `formato_ok` e deixa a porta aberta para tentar de novo depois.
      const error =
        e instanceof Error
          ? e.name === "AbortError"
            ? `timeout apos ${TIMEOUT_MS}ms`
            : e.message
          : "falha desconhecida";
      return { lookup: { ...vazio, checked_at, error }, geometria: null, crs: null };
    } finally {
      clearTimeout(timer);
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTAÇÃO 2 (desenhada, NÃO construída) — base ingerida localmente
// ─────────────────────────────────────────────────────────────────────────────
/*
 * Plano B, para o dia em que o endpoint legado sair do ar. É a MESMA função,
 * com outra implementação — nenhum chamador muda.
 *
 *   1. `scripts/ingest-car.mjs` baixa o GeoPackage por UF do portal novo. O
 *      endpoint `consulta.car.gov.br/api/downloadBase/get-url-file-s3` devolve
 *      URL S3 pré-assinada sem captcha (verificado em 29/07/2026) — o captcha
 *      do portal novo é gate de FRONT-END, o backend responde direto. O portal
 *      LEGADO, ao contrário, exige captcha de imagem: não é caminho.
 *   2. Tabela `car_imoveis (cod_imovel pk, ind_status, area_ha, uf,
 *      municipio_ibge, fonte, data_base)`, índice em `cod_imovel`.
 *   3. `fonteBaseLocal` implementa `CarSicarFonte` lendo essa tabela e
 *      devolvendo o MESMO `CarSicarResposta`, com `data_base` em `checked_at`.
 *
 * Custo honesto: a base envelhece entre ingestões, e isso TEM que aparecer na
 * interface — o selo diria "conferido em [data da base]", não "agora". Por isso
 * `checked_at` já existe no contrato: a troca de fonte não muda a copy.
 */

// ─────────────────────────────────────────────────────────────────────────────
// A porta de entrada única
// ─────────────────────────────────────────────────────────────────────────────

/** Trocar de fonte é trocar esta linha. */
export function fonteAtiva(): CarSicarFonte {
  return fonteWfsLegado;
}

/**
 * Consulta o CAR na fonte ativa. Nunca lança: falha externa volta como
 * `lookup.consulted === false` com `error` preenchido.
 *
 * @param codImovel já normalizado por `parseCar` (forma UF-IBGE-SUFIXO).
 */
export async function consultarCar(codImovel: string): Promise<CarSicarResposta> {
  const fonte = fonteAtiva();
  try {
    return await fonte.consultar(codImovel);
  } catch (e) {
    // Cinto e suspensório: a implementação já trata os próprios erros, mas o
    // contrato desta função é "nunca lança", e ele vale mesmo se a
    // implementação for trocada por uma que esqueça disso.
    return {
      lookup: {
        ...lookupVazio(fonte.id),
        error: e instanceof Error ? e.message : "falha desconhecida",
      },
      geometria: null,
      crs: null,
    };
  }
}
