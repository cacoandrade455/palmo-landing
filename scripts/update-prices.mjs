/**
 * PALMO — Monthly price refresh (Tier 1 + Tier 2 hybrid)
 *
 * Updates lib/prices.json with current commodity prices. Some Brazilian ag
 * prices are openly fetchable; the gold-standard spot indicators (CEPEA/ESALQ)
 * are license-gated, so those are refreshed from a small manual input.
 *
 * ── HOW TO RUN (monthly) ─────────────────────────────────────────────────
 *   node scripts/update-prices.mjs                 # interactive: fetch + prompt
 *   node scripts/update-prices.mjs --auto          # fetch-only, keep old manual
 *
 * The script:
 *   1. Fetches openly-available series (CONAB / IBGE SIDRA / B3 delayed).
 *   2. For license-gated indicators, prints the source URL and reads the value
 *      you type from the CEPEA public "Indicadores" page (free to view).
 *   3. Writes lib/prices.json with fresh values + updatedAt = current month.
 *
 * TIER 2 UPGRADE: replace the promptManual() calls with real fetches as you
 * secure API access (CEPEA license, or a data vendor). The models never change.
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const OUT = path.join(process.cwd(), "lib", "prices.json");
const AUTO = process.argv.includes("--auto");

const now = new Date();
const MONTH = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

// Public source URLs for the monthly manual refresh (all free to view):
const SOURCES = {
  saca_soja: "https://www.cepea.esalq.usp.br/br/indicador/soja.aspx",
  saca_milho: "https://www.cepea.esalq.usp.br/br/indicador/milho.aspx",
  arroba_boi: "https://www.cepea.esalq.usp.br/br/indicador/boi-gordo.aspx",
  saca_cafe_arabica: "https://www.cepea.esalq.usp.br/br/indicador/cafe.aspx",
  caixa_laranja: "https://www.cepea.esalq.usp.br/br/indicador/citros.aspx",
  arroba_cacau: "Notícias Agrícolas / CEPLAC (cacau spot)",
  kg_manga: "CEPEA Hortifruti / Embrapa Semiárido",
  credito_carbono: "mercado voluntário (Aegro/ZS reports)",
};

// ─── Tier 2 hook: openly fetchable series go here ────────────────────────────
async function fetchOpenSeries() {
  const out = {};
  // Example scaffold — B3 delayed agro futures, CONAB, IBGE SIDRA.
  // These endpoints change; wrap each in try/catch so one failure isn't fatal.
  // Left as no-op stubs on purpose: wire real endpoints when you have them.
  //
  // try {
  //   const r = await fetch("https://<conab-or-sidra-endpoint>");
  //   const j = await r.json();
  //   out.saca_soja = parseSoja(j);
  // } catch (e) { console.warn("soja fetch failed:", e.message); }
  return out;
}

function loadCurrent() {
  try {
    return JSON.parse(fs.readFileSync(OUT, "utf8"));
  } catch {
    return { updatedAt: MONTH, note: "", prices: {} };
  }
}

async function promptManual(rl, current) {
  const updated = { ...current.prices };
  console.log("\n── Manual refresh (press Enter to keep the current value) ──\n");
  for (const [key, entry] of Object.entries(current.prices)) {
    const src = SOURCES[key] ? `  [${SOURCES[key]}]` : "";
    const ans = (
      await rl.question(
        `${key} = ${entry.value} ${entry.unit}${src}\n  new value> `,
      )
    ).trim();
    if (ans) {
      const v = Number(ans.replace(",", "."));
      if (Number.isFinite(v) && v > 0) {
        updated[key] = { ...entry, value: v, updatedAt: MONTH };
        console.log(`  ✓ ${key} → ${v}`);
      } else {
        console.log(`  ✗ ignored (not a number), kept ${entry.value}`);
      }
    }
  }
  return updated;
}

async function main() {
  const current = loadCurrent();

  console.log("Fetching openly-available series…");
  const fetched = await fetchOpenSeries();
  for (const [k, v] of Object.entries(fetched)) {
    if (current.prices[k]) {
      current.prices[k] = { ...current.prices[k], value: v, updatedAt: MONTH };
      console.log(`  ✓ fetched ${k} → ${v}`);
    }
  }

  let prices = current.prices;
  if (!AUTO) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    prices = await promptManual(rl, current);
    rl.close();
  }

  const outData = {
    updatedAt: MONTH,
    note: "Preços de referência atualizados mensalmente. Fontes públicas; ver 'source' de cada item.",
    prices,
  };
  fs.writeFileSync(OUT, JSON.stringify(outData, null, 2));
  console.log(`\n✅ Wrote ${OUT} (updatedAt ${MONTH}).`);
  console.log("Next: git add lib/prices.json && git commit -m 'monthly price refresh' && git push");
}

main().catch((e) => {
  console.error("Price update failed:", e);
  process.exit(1);
});
