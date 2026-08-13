/**
 * GEOMETRIA DE POLÍGONO — o mínimo, puro e sem I/O.
 *
 * Este arquivo é PURO de propósito: nenhuma dependência externa, nenhum
 * `server-only`. É importado tanto pelo servidor (que calcula as áreas) quanto
 * pelo componente de mapa (que desenha), e nenhum dos dois pode arrastar o
 * outro para o bundle errado. A ÚNICA operação que exige biblioteca — a união
 * de polígonos — mora fora daqui, em `lib/geo-uniao.ts`, que é server-only.
 *
 * ── SISTEMA DE COORDENADAS ───────────────────────────────────────────────────
 * Tudo aqui fala GeoJSON em graus decimais [lon, lat], que é o que o SICAR
 * devolve: EPSG:4674 (SIRGAS 2000). Para efeito de área e de desenho, SIRGAS
 * 2000 e WGS 84 são indistinguíveis (as duas realizações diferem por menos de
 * um metro no Brasil), então não há reprojeção em lugar nenhum — o que ela
 * exigiria seria uma tabela de parâmetros que ninguém conferiu.
 */

/** [longitude, latitude] em graus decimais. */
export type Posicao = [number, number];
/** Anel fechado (primeira posição = última). */
export type Anel = Posicao[];
/** [anel externo, ...buracos]. */
export type Poligono = Anel[];
export type MultiPoligono = Poligono[];

export type GeometriaGeoJson =
  | { type: "Polygon"; coordinates: Poligono }
  | { type: "MultiPolygon"; coordinates: MultiPoligono };

/** [oeste, sul, leste, norte] em graus. */
export type Caixa = [number, number, number, number];

const GRAUS = Math.PI / 180;

/**
 * Raio AUTÁLICO do WGS 84 (esfera de mesma área que o elipsoide), em metros.
 * É o raio certo para cálculo de área: usar o raio equatorial superestimaria
 * toda área em ~0,45%.
 */
const RAIO_AUTALICO_M = 6371007.181;

/** Achatamento e primeira excentricidade do WGS 84 / SIRGAS 2000. */
const ACHATAMENTO = 1 / 298.257223563;
const E2 = ACHATAMENTO * (2 - ACHATAMENTO);
const E = Math.sqrt(E2);

/**
 * LATITUDE AUTÁLICA — a correção que faz o número bater com o CAR.
 *
 * A fórmula do excesso esférico mede área numa ESFERA. Jogar a latitude
 * geodésica nela direto (o que a implementação clássica do turf faz) embute um
 * viés sistemático, porque a mesma latitude vale ângulos diferentes na esfera e
 * no elipsoide. Medido em 13/08/2026 contra o atributo oficial de área do
 * SICAR:
 *
 *   imóvel                     oficial      sem correção        com correção
 *   TO-1702000-55760ACF...   598,3149 ha   600,6481 (+0,390%)   598,3558 (+0,007%)
 *   BA-2933257-84D47D4B...   772,0668 ha   775,1297 (+0,397%)   772,5693 (+0,065%)
 *
 * Meio por cento em 600 ha é quase 2,5 ha — área maior que muito sítio. Num
 * produto que promete não inventar número, isso não é detalhe de precisão: é a
 * diferença entre bater com a fonte e discordar dela em silêncio.
 *
 * Converte latitude geodésica (rad) na latitude autálica (rad) de mesma área.
 */
function latitudeAutalica(phi: number): number {
  const s = Math.sin(phi);
  const q = (1 - E2) * (s / (1 - E2 * s * s) - (1 / (2 * E)) * Math.log((1 - E * s) / (1 + E * s)));
  const qp = (1 - E2) * (1 / (1 - E2) - (1 / (2 * E)) * Math.log((1 - E) / (1 + E)));
  const razao = Math.min(1, Math.max(-1, q / qp));
  return Math.asin(razao);
}

/** Um hectare em metros quadrados. */
const M2_POR_HECTARE = 10000;

// ─────────────────────────────────────────────────────────────────────────────
// Leitura defensiva: o que vem do banco é `jsonb`, e jsonb não tem tipo
// ─────────────────────────────────────────────────────────────────────────────

function ehPosicao(v: unknown): v is Posicao {
  return (
    Array.isArray(v) &&
    v.length >= 2 &&
    typeof v[0] === "number" &&
    typeof v[1] === "number" &&
    Number.isFinite(v[0]) &&
    Number.isFinite(v[1])
  );
}

function lerAnel(v: unknown): Anel | null {
  if (!Array.isArray(v)) return null;
  const anel: Anel = [];
  for (const p of v) {
    if (!ehPosicao(p)) return null;
    anel.push([p[0], p[1]]);
  }
  // Menos de 4 posições não fecha um anel (3 vértices + repetição da primeira).
  return anel.length >= 4 ? anel : null;
}

function lerPoligono(v: unknown): Poligono | null {
  if (!Array.isArray(v)) return null;
  const pol: Poligono = [];
  for (const anel of v) {
    const a = lerAnel(anel);
    // Buraco malformado é descartado; anel externo malformado invalida tudo.
    if (!a) {
      if (pol.length === 0) return null;
      continue;
    }
    pol.push(a);
  }
  return pol.length > 0 ? pol : null;
}

/**
 * Normaliza qualquer geometria GeoJSON de área para multipolígono. Devolve
 * `null` para tudo que não for polígono reconhecível — inclusive `null`,
 * `undefined`, ponto e linha. Nunca lança: a entrada vem de `jsonb`.
 */
export function paraMultiPoligono(g: unknown): MultiPoligono | null {
  if (!g || typeof g !== "object") return null;
  const obj = g as { type?: unknown; coordinates?: unknown };
  if (obj.type === "Polygon") {
    const p = lerPoligono(obj.coordinates);
    return p ? [p] : null;
  }
  if (obj.type === "MultiPolygon") {
    if (!Array.isArray(obj.coordinates)) return null;
    const mp: MultiPoligono = [];
    for (const pol of obj.coordinates) {
      const p = lerPoligono(pol);
      if (p) mp.push(p);
    }
    return mp.length > 0 ? mp : null;
  }
  return null;
}

/** Volta ao formato GeoJSON, para gravar em jsonb. */
export function paraGeoJson(mp: MultiPoligono): GeometriaGeoJson {
  return { type: "MultiPolygon", coordinates: mp };
}

// ─────────────────────────────────────────────────────────────────────────────
// Área geodésica
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Área de um anel pelo excesso esférico (Chamberlain e Duquette, JPL 2007),
 * sobre a esfera autálica e com a latitude convertida — ver
 * `latitudeAutalica`. Devolve metros quadrados.
 *
 * Escrita aqui, e não importada, para não arrastar uma dependência por trinta
 * linhas de trigonometria; e corrigida, porque a versão sem correção discorda
 * do CAR em quase meio por cento.
 */
function areaAnelM2(anel: Anel): number {
  if (anel.length < 4) return 0;
  let total = 0;
  let seno1 = Math.sin(latitudeAutalica(anel[0][1] * GRAUS));
  for (let i = 0; i < anel.length - 1; i++) {
    const seno2 = Math.sin(latitudeAutalica(anel[i + 1][1] * GRAUS));
    total += (anel[i + 1][0] - anel[i][0]) * GRAUS * (2 + seno1 + seno2);
    seno1 = seno2;
  }
  return Math.abs((total * RAIO_AUTALICO_M * RAIO_AUTALICO_M) / 2);
}

/**
 * Área de um multipolígono em HECTARES: anéis externos menos buracos. Não faz
 * união — polígonos sobrepostos contam duas vezes, e é por isso que quem soma
 * camadas diferentes precisa unir antes (ver `lib/geo-uniao.ts`).
 */
export function areaHectares(mp: MultiPoligono): number {
  let m2 = 0;
  for (const pol of mp) {
    for (let i = 0; i < pol.length; i++) {
      const a = areaAnelM2(pol[i]);
      m2 += i === 0 ? a : -a;
    }
  }
  return Math.max(0, m2) / M2_POR_HECTARE;
}

// ─────────────────────────────────────────────────────────────────────────────
// Caixa envolvente
// ─────────────────────────────────────────────────────────────────────────────

/** [oeste, sul, leste, norte]. `null` se não houver posição nenhuma. */
export function caixa(mps: MultiPoligono[]): Caixa | null {
  let oeste = Infinity;
  let sul = Infinity;
  let leste = -Infinity;
  let norte = -Infinity;
  for (const mp of mps) {
    for (const pol of mp) {
      for (const anel of pol) {
        for (const [lon, lat] of anel) {
          if (lon < oeste) oeste = lon;
          if (lon > leste) leste = lon;
          if (lat < sul) sul = lat;
          if (lat > norte) norte = lat;
        }
      }
    }
  }
  return Number.isFinite(oeste) ? [oeste, sul, leste, norte] : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Simplificação (Douglas-Peucker)
// ─────────────────────────────────────────────────────────────────────────────

/** Metros por grau de latitude. Constante suficiente para tolerância. */
const METROS_POR_GRAU = 111320;

/**
 * Distância perpendicular ponto-segmento, em graus, com a longitude corrigida
 * por cos(lat) para a tolerância significar a mesma coisa nos dois eixos.
 */
function distanciaPerpendicular(p: Posicao, a: Posicao, b: Posicao, kx: number): number {
  const px = (p[0] - a[0]) * kx;
  const py = p[1] - a[1];
  const bx = (b[0] - a[0]) * kx;
  const by = b[1] - a[1];
  const den = bx * bx + by * by;
  if (den === 0) return Math.hypot(px, py);
  let t = (px * bx + py * by) / den;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - t * bx, py - t * by);
}

function douglasPeucker(pontos: Posicao[], tol: number, kx: number): Posicao[] {
  if (pontos.length <= 2) return pontos.slice();
  let pior = 0;
  let indice = 0;
  const a = pontos[0];
  const b = pontos[pontos.length - 1];
  for (let i = 1; i < pontos.length - 1; i++) {
    const d = distanciaPerpendicular(pontos[i], a, b, kx);
    if (d > pior) {
      pior = d;
      indice = i;
    }
  }
  if (pior <= tol) return [a, b];
  const esq = douglasPeucker(pontos.slice(0, indice + 1), tol, kx);
  const dir = douglasPeucker(pontos.slice(indice), tol, kx);
  return esq.slice(0, -1).concat(dir);
}

/**
 * Simplifica para EXIBIÇÃO. Nunca para cálculo: toda área deste lote é medida
 * sobre a geometria ORIGINAL, e só depois a geometria é enxugada para caber na
 * trilha pública. Assim o número mostrado não depende de quanto o desenho foi
 * reduzido.
 *
 * O anel é sempre refechado, e anel que degenerar (menos de 4 posições depois
 * da simplificação) é DEVOLVIDO INTEIRO em vez de descartado: sumir com um
 * pedaço do imóvel seria pior que desenhar um vértice a mais.
 */
export function simplificar(mp: MultiPoligono, toleranciaMetros: number): MultiPoligono {
  const c = caixa([mp]);
  const latMedia = c ? (c[1] + c[3]) / 2 : 0;
  const kx = Math.max(0.1, Math.cos(latMedia * GRAUS));
  const tol = toleranciaMetros / METROS_POR_GRAU;

  const saida: MultiPoligono = [];
  for (const pol of mp) {
    const novo: Poligono = [];
    for (const anel of pol) {
      const aberto = anel.slice(0, -1);
      const simples = douglasPeucker(aberto, tol, kx);
      if (simples.length < 3) {
        novo.push(anel);
        continue;
      }
      simples.push(simples[0]);
      novo.push(simples);
    }
    if (novo.length > 0) saida.push(novo);
  }
  return saida;
}

/** Quantas posições um multipolígono tem. Serve para relatar o custo. */
export function contarPontos(mp: MultiPoligono): number {
  let n = 0;
  for (const pol of mp) for (const anel of pol) n += anel.length;
  return n;
}
