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

type Range = { min: number; max: number; note?: "sacas" | "arroba" | "atr" };

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
    ...group([...CO, "SP", "MG"], { min: 250, max: 600, note: "arroba" }),
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
  energia_solar: {
    ...group([...SUDESTE, ...CO, ...SUL, "BA", "CE", "RN", "PB", "PE", "PI"], {
      min: 1500,
      max: 6000,
    }),
    default: { min: 1000, max: 5000 },
  },
};

export type Estimate =
  | { kind: "range"; minPerHa: number; maxPerHa: number; note?: Range["note"] }
  | { kind: "consult" };

export function estimateLease(purpose: string, uf: string): Estimate {
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
};

/**
 * All benchmarked uses for a UF, ranked by midpoint value (highest first).
 * Only uses with actual regional/fallback data are included — uses without
 * defensible benchmarks never appear in comparisons.
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
