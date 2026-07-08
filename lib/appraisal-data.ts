/**
 * Reference lease-value benchmarks (R$/ha/year) by land use and state.
 *
 * SOURCES (compiled Jul/2026 — update periodically):
 * - Grãos: sindicatos rurais / IMEA / Scot Consultoria / Embrapa references.
 *   Typical ranges quoted in sacas de soja/ha/ano: MT 13–25, Sul 15–25,
 *   GO/MS 12–22, Matopiba 10–20; converted at ~R$120/saca.
 * - Pecuária: market guides; extensive pasture R$50–150/ha/ano low end,
 *   formed pasture in Centro-Oeste/SP/Sul commonly R$250–700/ha/ano.
 * - Cana: CNA Campo Futuro — contracts set in t de cana/ha × ATR; SP panels
 *   24,5–30 t/ha at top regions; converted ≈ R$2.000–4.500/ha/ano SP.
 * - Silvicultura: market guides, R$150–700/ha/ano depending on region.
 * - Solar: market guides, R$1.000–6.000/ha/ano depending on irradiance/grid.
 * - Legal ceiling note: Estatuto da Terra caps rent at 15% of land value
 *   (30% for intensive high-yield zones).
 *
 * These are wide REFERENCE ranges, not appraisals. The UI must always show
 * the disclaimer.
 */

export const SACA_SOJA_BRL = 120; // reference price used for conversions

type Range = { min: number; max: number; note?: "sacas" | "arroba" | "atr"; selective?: boolean };

// state groups
const SUL = ["PR", "SC", "RS"];
const CO = ["MT", "MS", "GO", "DF"];
const SUDESTE = ["SP", "MG", "RJ", "ES"];
const MATOPIBA = ["MA", "TO", "PI", "BA"];

function group(states: string[], range: Range): Record<string, Range> {
  return Object.fromEntries(states.map((s) => [s, range]));
}

/** purpose -> uf -> range; "default" is the national fallback (low confidence). */
const table: Record<string, Record<string, Range>> = {
  graos: {
    MT: { min: 1400, max: 3000, note: "sacas" },
    ...group(["GO", "MS", "DF"], { min: 1400, max: 2600, note: "sacas" }),
    ...group(SUL, { min: 1800, max: 3000, note: "sacas" }),
    ...group(["SP", "MG"], { min: 1400, max: 2600, note: "sacas" }),
    ...group(MATOPIBA, { min: 1200, max: 2400, note: "sacas" }),
    default: { min: 800, max: 2000, note: "sacas" },
  },
  pecuaria_corte: {
    ...group([...CO, "SP", "MG"], { min: 300, max: 800, note: "arroba" }),
    ...group(SUL, { min: 300, max: 700, note: "arroba" }),
    default: { min: 80, max: 400, note: "arroba" },
  },
  pecuaria_leite: {
    ...group([...SUL, "MG", "SP", "GO"], { min: 300, max: 800 }),
    default: { min: 150, max: 500 },
  },
  cana: {
    SP: { min: 2000, max: 4500, note: "atr" },
    ...group(["GO", "MS", "MG", "PR"], { min: 1500, max: 3500, note: "atr" }),
    ...group(["AL", "PE", "PB"], { min: 1000, max: 2500, note: "atr" }),
  },
  silvicultura: {
    ...group(["SP", "MG", "PR", "SC", "RS", "BA", "ES", "MS"], {
      min: 200,
      max: 700,
    }),
    default: { min: 150, max: 500 },
  },
  reflorestamento_carbono: {
    // Crédito de carbono: ~140 créditos/ha/ano × ~R$25/crédito ≈ R$3.500/ha/ano
    // (Jusbrasil/Notícias Agrícolas/Aegro 2025); faixa ampla por bioma e metodologia.
    // Requer certificação (Verra/Gold Standard) e projeto de anos — não é renda passiva.
    default: { min: 1500, max: 5250 },
  },
  energia_solar: {
    ...group([...SUDESTE, ...CO, ...SUL, "BA", "CE", "RN", "PB", "PE", "PI"], {
      min: 1500,
      max: 6000,
      selective: true,
    }),
    default: { min: 1000, max: 5000, selective: true },
  },
};

/**
 * Crop-level overrides where a specific crop has its own lease market,
 * distinct from its category benchmark.
 * - arroz irrigado (RS/SC): quoted in sacas de arroz; ~18–25 sc/ha for
 *   land + water (IRGA / market guides), converted at ~R$85–110/sc.
 */
const cropOverrides: Record<string, Record<string, Range>> = {
  arroz: {
    RS: { min: 1500, max: 2700 },
    SC: { min: 1500, max: 2700 },
  },
};

/**
 * Crop-specific LAND VALUE references (R$/ha) from market/sector sources,
 * converted to lease equivalents at 2.5%–6%/year — used when a specific
 * crop is selected and no direct lease benchmark exists.
 *
 * SOURCES per entry (add new crops WITH a source, never from memory):
 * - cacau/BA: formed cocoa farms in southern Bahia listed at
 *   R$10.000–60.000/ha (sector portals e.g. tudosobrecacau.com.br and
 *   MF Rural listings, 2026).
 */
export type CropLandRef = {
  landMin: number;
  landMax: number;
  sourceNote: string;
};

const cropLandRefs: Record<string, Record<string, CropLandRef>> = {
  cacau: {
    BA: {
      landMin: 10000,
      landMax: 60000,
      sourceNote: "terras de cacau no sul da Bahia (anúncios e portais do setor)",
    },
  },
};

const REF_LOW = 0.025;
const REF_HIGH = 0.06;

/**
 * FORMED-CROP revenue references: gross revenue (faturamento) per hectare
 * for a producing plantation, leased at the regional convention of ~15% of
 * revenue. This is a DIFFERENT market from bare land: it assumes the crop
 * is planted, mature and producing.
 *
 * SOURCES (field-sourced — add new entries WITH a source):
 * - banana/BA: ~R$44k/ha/ano gross on producing farms (grower reference,
 *   southern Bahia, jul/2026); range widened for productivity variation.
 * - cacau/BA: 60–150 arrobas/ha on productive farms × ~R$380/@ (spot,
 *   jul/2026) = R$22.8k–57k/ha gross (grower reference, southern Bahia).
 */
const REVENUE_SHARE = 0.15;

type FormedCropRef = {
  revMin: number;
  revMax: number;
  sourceNote: string;
};

const formedCropRefs: Record<string, Record<string, FormedCropRef>> = {
  banana: {
    BA: {
      revMin: 35000,
      revMax: 45000,
      sourceNote: "produtores do sul da Bahia (2026)",
    },
    default: {
      revMin: 25000,
      revMax: 45000,
      sourceNote: "referência de fruticultura irrigada (varia muito por região)",
    },
  },
  cacau: {
    BA: {
      revMin: 22800,
      revMax: 57000,
      sourceNote: "produtores do sul da Bahia (2026): 60–150 @/ha × ~R$380/@",
    },
    default: {
      revMin: 22800,
      revMax: 57000,
      sourceNote: "referência sul da Bahia: 60–150 @/ha × ~R$380/@",
    },
  },
  cafe: {
    // 25–45 sc/ha em lavouras formadas × ~R$1.400–1.700/saca (CEPEA/mercado 2024–26)
    MG: {
      revMin: 35000,
      revMax: 75000,
      sourceNote: "cafeicultura formada (CEPEA/mercado 2026): 25–45 sc/ha × ~R$1.400–1.700/sc",
    },
    SP: {
      revMin: 35000,
      revMax: 75000,
      sourceNote: "cafeicultura formada (CEPEA/mercado 2026): 25–45 sc/ha × ~R$1.400–1.700/sc",
    },
    ES: {
      revMin: 30000,
      revMax: 65000,
      sourceNote: "cafeicultura formada ES (conilon/arábica, mercado 2026)",
    },
    default: {
      revMin: 30000,
      revMax: 70000,
      sourceNote: "cafeicultura formada (CEPEA/mercado 2026): 25–45 sc/ha",
    },
  },
  citros: {
    // 650–950 cx/ha em pomares formados × R$30–55/cx (Fundecitrus/CEPEA, mercado volátil 2024–26)
    SP: {
      revMin: 20000,
      revMax: 50000,
      sourceNote: "citricultura formada SP (Fundecitrus/CEPEA 2026): 650–950 cx/ha × R$30–55/cx",
    },
    MG: {
      revMin: 18000,
      revMax: 45000,
      sourceNote: "citricultura formada (Fundecitrus/CEPEA 2026)",
    },
    default: {
      revMin: 18000,
      revMax: 45000,
      sourceNote: "citricultura formada (Fundecitrus/CEPEA 2026)",
    },
  },
  manga: {
    // ~25 t/ha em plena produção; preço muito volátil (R$0,50–0,70/kg médio,
    // mas caixas de exportação oscilam forte) — Embrapa Semiárido / Vale do São Francisco
    BA: {
      revMin: 12500,
      revMax: 40000,
      sourceNote: "manga formada Vale do São Francisco (Embrapa): ~25 t/ha, preço muito volátil",
    },
    PE: {
      revMin: 12500,
      revMax: 40000,
      sourceNote: "manga formada Vale do São Francisco (Embrapa): ~25 t/ha, preço muito volátil",
    },
    default: {
      revMin: 12500,
      revMax: 35000,
      sourceNote: "manga formada (Embrapa Semiárido): ~25 t/ha, preço volátil",
    },
  },
  uva: {
    // uva de mesa irrigada (Vale do São Francisco / Nordeste): alta receita, alto custo
    BA: {
      revMin: 40000,
      revMax: 90000,
      sourceNote: "viticultura de mesa irrigada (Vale do São Francisco, mercado 2026)",
    },
    PE: {
      revMin: 40000,
      revMax: 90000,
      sourceNote: "viticultura de mesa irrigada (Vale do São Francisco, mercado 2026)",
    },
    default: {
      revMin: 30000,
      revMax: 80000,
      sourceNote: "viticultura de mesa irrigada (varia muito por região e cultivar)",
    },
  },
};

export type FormedLeaseRef = {
  minPerHa: number;
  maxPerHa: number;
  sourceNote: string;
};

export function formedCropLeaseRef(crop: string, uf: string): FormedLeaseRef | null {
  const r = formedCropRefs[crop]?.[uf] ?? formedCropRefs[crop]?.default;
  if (!r) return null;
  return {
    minPerHa: Math.round(r.revMin * REVENUE_SHARE),
    maxPerHa: Math.round(r.revMax * REVENUE_SHARE),
    sourceNote: r.sourceNote,
  };
}

export type CropLeaseRef = {
  minPerHa: number;
  maxPerHa: number;
  landMin: number;
  landMax: number;
  sourceNote: string;
};

export function cropLandLeaseRef(crop: string, uf: string): CropLeaseRef | null {
  const r = cropLandRefs[crop]?.[uf] ?? cropLandRefs[crop]?.default;
  if (!r) return null;
  return {
    minPerHa: Math.round(r.landMin * REF_LOW),
    maxPerHa: Math.round(r.landMax * REF_HIGH),
    landMin: r.landMin,
    landMax: r.landMax,
    sourceNote: r.sourceNote,
  };
}

export type Estimate =
  | { kind: "range"; minPerHa: number; maxPerHa: number; note?: Range["note"] }
  | { kind: "consult" };

export function estimateLease(
  purpose: string,
  uf: string,
  crop?: string,
): Estimate {
  if (crop) {
    const byUf = cropOverrides[crop];
    const r = byUf?.[uf] ?? byUf?.default;
    if (r) return { kind: "range", minPerHa: r.min, maxPerHa: r.max, note: r.note };
  }
  const byUf = table[purpose];
  if (!byUf) return { kind: "consult" };
  const r = byUf[uf] ?? byUf.default;
  if (!r) return { kind: "consult" };
  return { kind: "range", minPerHa: r.min, maxPerHa: r.max, note: r.note };
}

export type UseComparison = {
  purpose: string;
  minPerHa: number;
  maxPerHa: number;
  /** midpoint used for ranking */
  mid: number;
  /** opportunistic markets (e.g. solar): real prices, but site-dependent demand */
  selective: boolean;
};

/**
 * All benchmarked uses for a UF, ranked by midpoint value (highest first).
 * Only uses with actual regional/fallback data are included — uses without
 * defensible benchmarks never appear in comparisons. Selective markets are
 * flagged so the UI can annotate them and keep them out of headline
 * recommendations.
 */
export function compareUses(uf: string): UseComparison[] {
  const out: UseComparison[] = [];
  for (const [purpose, byUf] of Object.entries(table)) {
    const r = byUf[uf] ?? byUf.default;
    if (!r) continue;
    out.push({
      purpose,
      minPerHa: r.min,
      maxPerHa: r.max,
      mid: (r.min + r.max) / 2,
      selective: !!r.selective,
    });
  }
  return out.sort((a, b) => b.mid - a.mid);
}

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
