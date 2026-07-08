/**
 * Volatile price layer. All commodity prices that move month-to-month live in
 * lib/prices.json (updated by scripts/update-prices.mjs or by hand). The
 * models in appraisal-data.ts read from here so the math never has hardcoded
 * prices — only the price file changes on the monthly refresh.
 */
import pricesJson from "./prices.json";

type PriceEntry = {
  value: number;
  unit: string;
  source: string;
  updatedAt: string;
};

type PricesFile = {
  updatedAt: string;
  note: string;
  prices: Record<string, PriceEntry>;
};

const DATA = pricesJson as PricesFile;

/** Month the price set was last refreshed, e.g. "2026-07". */
export const PRICES_UPDATED_AT = DATA.updatedAt;

/** Human month label, e.g. "jul/2026". */
export function pricesUpdatedLabel(lang: "pt" | "en"): string {
  const [y, m] = DATA.updatedAt.split("-");
  const monthsPt = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  const monthsEn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const idx = Math.max(0, Math.min(11, Number(m) - 1));
  return `${(lang === "en" ? monthsEn : monthsPt)[idx]}/${y}`;
}

export function price(key: string): number {
  return DATA.prices[key]?.value ?? 0;
}
