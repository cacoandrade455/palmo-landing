/**
 * Palmo — VTN ingestion script
 *
 * Downloads the Receita Federal's official "Valores de Terra Nua 2025"
 * table (land values per municipality × aptitude, used for ITR) and
 * compiles it into lib/vtn-data.json, which the land calculator uses to
 * produce per-municipality estimates.
 *
 * HOW TO RUN (from the project root):
 *   1. npm install unpdf --save-dev
 *   2. node scripts/ingest-vtn.mjs
 *   3. Check the printed stats (should report ~2,900 municipalities).
 *   4. git add lib/vtn-data.json && commit && push
 *
 * Re-run once a year when RFB publishes the new table (update PDF_URL).
 */

import fs from "node:fs";
import path from "node:path";
import { extractText, getDocumentProxy } from "unpdf";

const PDF_URL =
  "https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/vtn/planilha-vtn-2025-para-publicacao-6.pdf/@@download/file";
const OUT = path.join(process.cwd(), "lib", "vtn-data.json");
const YEAR = 2025;

const UFS = new Set([
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]);

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
  // "12.345,67" -> 12345.67 ; "-" or "NI" -> null
  const t = tok.trim();
  if (!t || t === "-" || /^N\/?I$/i.test(t) || t === "0,00" || t === "0") return null;
  const n = Number(t.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function main() {
  console.log("Downloading RFB VTN table…");
  const res = await fetch(PDF_URL, { redirect: "follow" });
  if (!res.ok) {
    console.error(`Download failed: HTTP ${res.status}. Check PDF_URL.`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  console.log(`Downloaded ${(buf.length / 1024).toFixed(0)} KB. Parsing…`);

  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });

  // pdf.js merges text items with spaces (no reliable line breaks), so rows
  // are matched globally across the whole text:
  //   UF MUNICÍPIO n n n n [n [n]]
  // where each n is a pt-BR number (1.234,56), "-" or "NI".
  const NUM = String.raw`(?:\d{1,3}(?:\.\d{3})*,\d{2}|-|NI)`;
  const rowRe = new RegExp(
    String.raw`\b([A-Z]{2})\s+([A-ZÀ-ÚÇ][A-ZÀ-ÚÇ0-9'’.\- ]{1,60}?)\s+(${NUM}(?:\s+${NUM}){3,5})(?=\s|$)`,
    "g",
  );

  const data = {};
  let rows = 0;
  const perUf = {};
  const samples = [];

  let m;
  while ((m = rowRe.exec(text)) !== null) {
    const uf = m[1];
    if (!UFS.has(uf)) {
      // A bogus match (e.g. header noise) may have swallowed a real row that
      // starts inside it — rescan from just past the bogus UF token.
      rowRe.lastIndex = m.index + m[1].length;
      continue;
    }
    const name = normalizeName(m[2]);
    if (!name || name.length < 2) continue;
    const nums = m[3].trim().split(/\s+/).map(parseBRNumber);
    while (nums.length < 6) nums.push(null);
    const [boa, regular, restrita, pastagem, silvicultura] = nums;
    if (![boa, regular, restrita, pastagem, silvicultura].some((v) => v)) continue;

    data[`${uf}|${name}`] = { boa, regular, restrita, pastagem, silvicultura };
    rows++;
    perUf[uf] = (perUf[uf] || 0) + 1;
    if (samples.length < 5) samples.push(`${uf} ${name}: boa=${boa} pastagem=${pastagem}`);
  }

  console.log(`\nParsed ${rows} municipality rows.`);
  console.log("Rows per UF:", perUf);
  console.log("Samples:", samples);

  if (rows < 1000) {
    console.error(
      "\n⚠️  Fewer than 1.000 rows parsed — the PDF layout probably differs from " +
        "what this parser expects. DO NOT commit the output. Send the excerpt below " +
        "to adjust the parser:\n",
    );
    console.error(text.slice(0, 3000));
    process.exit(1);
  }

  fs.writeFileSync(
    OUT,
    JSON.stringify({ year: YEAR, source: PDF_URL, count: rows, data }),
  );
  console.log(`\n✅ Wrote ${OUT} (${rows} municipalities, year ${YEAR}).`);
  console.log("Now: git add lib/vtn-data.json && git commit && git push");
}

main().catch((e) => {
  console.error("Ingestion failed:", e);
  process.exit(1);
});
