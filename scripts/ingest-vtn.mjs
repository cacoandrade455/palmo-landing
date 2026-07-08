/**
 * Palmo — VTN ingestion script (v2: multi-year merge + state averages)
 *
 * Downloads ALL "Valores de Terra Nua" tables published by the Receita
 * Federal (2019–2025+), merges them preferring the most recent year per
 * municipality, computes official state averages for fallback, and writes
 * lib/vtn-data.json.
 *
 * HOW TO RUN (from the project root):
 *   1. npm install unpdf --save-dev   (already installed if you ran v1)
 *   2. node scripts/ingest-vtn.mjs
 *   3. Check the printed stats, then commit lib/vtn-data.json.
 *
 * Re-run once a year when RFB publishes the new table.
 */

import fs from "node:fs";
import path from "node:path";
import { extractText, getDocumentProxy } from "unpdf";

const LANDING =
  "https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/vtn";
// Fallback if landing-page scraping finds nothing:
const KNOWN_PDFS = [
  {
    year: 2025,
    url: "https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/vtn/planilha-vtn-2025-para-publicacao-6.pdf/@@download/file",
  },
];

const OUT = path.join(process.cwd(), "lib", "vtn-data.json");

const UFS = new Set([
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]);
const FIELDS = ["boa", "regular", "restrita", "pastagem", "silvicultura"];

function normalizeName(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseBRNumber(tok) {
  const t = tok.trim();
  if (!t || t === "-" || /^N\/?I$/i.test(t) || t === "0,00" || t === "0") return null;
  const n = Number(t.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function discoverPdfs() {
  try {
    const res = await fetch(LANDING, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const found = new Map(); // url -> year
    const re = /href="([^"]*\/vtn\/[^"]*?\.pdf)(?:\/view)?"/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      let url = m[1];
      if (!url.startsWith("http")) url = new URL(url, LANDING).href;
      const ym = url.match(/20(1[89]|2\d)/);
      if (!ym) continue;
      const year = Number(ym[0]);
      const dl = url.replace(/\/view$/, "") + "/@@download/file";
      if (!found.has(dl) || found.get(dl) < year) found.set(dl, year);
    }
    const list = [...found.entries()].map(([url, year]) => ({ url, year }));
    if (list.length === 0) throw new Error("no links found");
    // newest first
    return list.sort((a, b) => b.year - a.year);
  } catch (e) {
    console.warn(`Landing-page discovery failed (${e.message}); using known URLs.`);
    return KNOWN_PDFS;
  }
}

async function fetchIbgeMap() {
  // Official municipality -> UF map (used to resolve 2023-format rows that
  // have no UF column). Names duplicated across states are marked ambiguous.
  try {
    const res = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/municipios",
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = await res.json();
    const map = new Map(); // normName -> Set of UFs
    for (const m of list) {
      const uf =
        m?.microrregiao?.mesorregiao?.UF?.sigla ??
        m?.["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla;
      if (!uf) continue;
      const n = normalizeName(m.nome);
      if (!map.has(n)) map.set(n, new Set());
      map.get(n).add(uf);
    }
    console.log(`IBGE map loaded: ${map.size} unique municipality names.`);
    return map;
  } catch (e) {
    console.warn(`IBGE map unavailable (${e.message}) — 2023-format tables will be skipped.`);
    return null;
  }
}

const NUM = String.raw`(?:\d{1,3}(?:\.\d{3})*,\d{2}|-|NI)`;

function collectRows(text, ibgeMap) {
  const data = {};
  const add = (uf, rawName, numTokens) => {
    if (!UFS.has(uf)) return false;
    const name = normalizeName(rawName);
    if (!name || name.length < 2) return false;
    const nums = numTokens.map(parseBRNumber);
    while (nums.length < 6) nums.push(null);
    const [boa, regular, restrita, pastagem, silvicultura] = nums;
    if (![boa, regular, restrita, pastagem, silvicultura].some((v) => v)) return false;
    data[`${uf}|${name}`] = { boa, regular, restrita, pastagem, silvicultura };
    return true;
  };

  // Strategy A (2025 layout): UF NAME n n n n [n [n]]  (plain numbers)
  {
    const rowRe = new RegExp(
      String.raw`\b([A-Z]{2})\s+([A-ZÀ-ÚÇ][A-ZÀ-ÚÇ0-9'’.\- ]{1,60}?)\s+(${NUM}(?:\s+${NUM}){3,5})(?=\s|$)`,
      "g",
    );
    let m;
    while ((m = rowRe.exec(text)) !== null) {
      if (!UFS.has(m[1])) {
        rowRe.lastIndex = m.index + m[1].length;
        continue;
      }
      add(m[1], m[2], m[3].trim().split(/\s+/));
    }
    if (Object.keys(data).length >= 100) return { data, strategy: "A" };
  }

  // Strategy B (2024 layout): UF NAME R$ n R$ n ... [fonte digit]
  {
    const RSNUM = String.raw`R\$\s*${NUM}`;
    const rowRe = new RegExp(
      String.raw`\b([A-Z]{2})\s+([A-ZÀ-ÚÇ][A-ZÀ-ÚÇ0-9'’.\- ]{1,60}?)\s+(${RSNUM}(?:\s+${RSNUM}){4,5})(?:\s+\d{1,2})?(?=\s|$)`,
      "g",
    );
    let m;
    while ((m = rowRe.exec(text)) !== null) {
      if (!UFS.has(m[1])) {
        rowRe.lastIndex = m.index + m[1].length;
        continue;
      }
      add(m[1], m[2], m[3].split(/R\$\s*/).map((t) => t.trim()).filter(Boolean));
    }
    if (Object.keys(data).length >= 100) return { data, strategy: "B" };
  }

  // Strategy C (2023 layout): NAME R$ n R$ n ... fonte-digit  (no UF column;
  // resolve UF via the IBGE map, only when the name is nationally unique)
  if (ibgeMap) {
    let ambiguous = 0;
    const RSNUM = String.raw`R\$\s*${NUM}`;
    const rowRe = new RegExp(
      String.raw`([A-ZÀ-ÚÇ][A-ZÀ-ÚÇ0-9'’.\- ]{1,60}?)\s+(${RSNUM}(?:\s+${RSNUM}){4,5})\s+\d{1,2}(?=\s|$)`,
      "g",
    );
    let m;
    while ((m = rowRe.exec(text)) !== null) {
      const name = normalizeName(m[1]);
      const ufs = ibgeMap.get(name);
      if (!ufs) continue;
      if (ufs.size !== 1) {
        ambiguous++;
        continue;
      }
      add([...ufs][0], m[1], m[2].split(/R\$\s*/).map((t) => t.trim()).filter(Boolean));
    }
    if (ambiguous) console.log(`  (${ambiguous} ambiguous names skipped — duplicated across states)`);
    return { data, strategy: "C" };
  }

  return { data, strategy: "none" };
}

async function parsePdf(url, ibgeMap) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  const { data, strategy } = collectRows(text, ibgeMap);
  return { rows: data, strategy, textSample: text.slice(0, 3000) };
}

async function main() {
  const ibgeMap = await fetchIbgeMap();
  const pdfs = await discoverPdfs();
  console.log(
    `Found ${pdfs.length} VTN table(s):`,
    pdfs.map((p) => p.year).join(", "),
  );

  const data = {}; // key -> {boa..., y}
  const perYear = {};
  let lastSample = "";

  for (const { url, year } of pdfs) {
    console.log(`\nDownloading & parsing VTN ${year}…`);
    try {
      const { rows, strategy, textSample } = await parsePdf(url, ibgeMap);
      lastSample = textSample;
      const n = Object.keys(rows).length;
      perYear[year] = n;
      console.log(`  ${n} municipality rows (layout strategy ${strategy}).`);
      if (n < 100) {
        console.log(`  WARNING ${year} parsed poorly - its layout likely differs. Excerpt for diagnosis:`);
        console.log("  ---8<---");
        console.log("  " + textSample.slice(0, 1200).replace(/\s+/g, " "));
        console.log("  --->8---");
      }
      let added = 0;
      for (const [key, row] of Object.entries(rows)) {
        if (!data[key]) {
          data[key] = { ...row, y: year };
          added++;
        }
      }
      console.log(`  ${added} new municipalities added (newest year wins).`);
    } catch (e) {
      console.warn(`  Skipped ${year}: ${e.message}`);
    }
  }

  const count = Object.keys(data).length;
  console.log(`\nTotal unique municipalities: ${count}`);

  if (count < 1000) {
    console.error(
      "\n⚠️  Fewer than 1.000 rows total — DO NOT commit. Send this excerpt to adjust the parser:\n",
    );
    console.error(lastSample);
    process.exit(1);
  }

  // Official state averages (fallback for non-reporting municipalities)
  const ufAgg = {};
  for (const [key, row] of Object.entries(data)) {
    const uf = key.slice(0, 2);
    ufAgg[uf] ??= {};
    for (const f of FIELDS) {
      if (row[f]) {
        ufAgg[uf][f] ??= { sum: 0, n: 0 };
        ufAgg[uf][f].sum += row[f];
        ufAgg[uf][f].n++;
      }
    }
  }
  const ufAvg = {};
  for (const [uf, fields] of Object.entries(ufAgg)) {
    ufAvg[uf] = {};
    for (const f of FIELDS) {
      ufAvg[uf][f] = fields[f] ? Math.round(fields[f].sum / fields[f].n) : null;
    }
  }

  const years = Object.keys(perYear).map(Number).sort((a, b) => b - a);
  fs.writeFileSync(
    OUT,
    JSON.stringify({ year: years[0] ?? 0, years, count, perYear, data, ufAvg }),
  );

  const perUf = {};
  for (const key of Object.keys(data)) perUf[key.slice(0, 2)] = (perUf[key.slice(0, 2)] || 0) + 1;
  console.log("Municipalities per UF:", perUf);
  console.log("Rows per source year:", perYear);
  console.log(`\n✅ Wrote ${OUT} (${count} municipalities + state averages).`);
  console.log("Now: git add lib/vtn-data.json && git commit && git push");
}

main().catch((e) => {
  console.error("Ingestion failed:", e);
  process.exit(1);
});
