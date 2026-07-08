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

async function parsePdf(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });

  const NUM = String.raw`(?:\d{1,3}(?:\.\d{3})*,\d{2}|-|NI)`;
  const rowRe = new RegExp(
    String.raw`\b([A-Z]{2})\s+([A-ZÀ-ÚÇ][A-ZÀ-ÚÇ0-9'’.\- ]{1,60}?)\s+(${NUM}(?:\s+${NUM}){3,5})(?=\s|$)`,
    "g",
  );

  const rows = {};
  let m;
  while ((m = rowRe.exec(text)) !== null) {
    const uf = m[1];
    if (!UFS.has(uf)) {
      rowRe.lastIndex = m.index + m[1].length;
      continue;
    }
    const name = normalizeName(m[2]);
    if (!name || name.length < 2) continue;
    const nums = m[3].trim().split(/\s+/).map(parseBRNumber);
    while (nums.length < 6) nums.push(null);
    const [boa, regular, restrita, pastagem, silvicultura] = nums;
    if (![boa, regular, restrita, pastagem, silvicultura].some((v) => v)) continue;
    rows[`${uf}|${name}`] = { boa, regular, restrita, pastagem, silvicultura };
  }
  return { rows, textSample: text.slice(0, 3000) };
}

async function main() {
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
      const { rows, textSample } = await parsePdf(url);
      lastSample = textSample;
      const n = Object.keys(rows).length;
      perYear[year] = n;
      console.log(`  ${n} municipality rows.`);
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
