/**
 * checar-vocacoes-vs-vantagens.mjs — guarda de consistência RETRATO × RANKING.
 * Roda 100% offline (sem rede): só lê os fontes do repositório.
 *
 * O bug que este guarda pega: o retrato de uma região curada AFIRMA uma
 * vocação (ex.: "café lidera no Centro Sul Baiano"), mas a vantagem estadual
 * correspondente (lib/state-advantage.ts) não lista alguma UF que aquela
 * região alcança. Resultado no produto: o retrato promete a cultura e o
 * ranking logo abaixo não consegue exibi-la — o filtro de microrregião deixa
 * a cultura passar, mas o gate por UF (`adv.ufs.includes(uf)`) a barra antes.
 *
 * Método, para CADA região curada em REGIOES:
 *   1. UFs alcançadas = união das UFs que chegam à região por qualquer porta:
 *      MUNI_TO_REGIAO (âncoras à mão), MUNI_REGIAO_GERADO (mapa offline) e
 *      MESO_TO_REGIAO (resolução online via API do IBGE).
 *   2. Para cada cultura de `vocacoes` que exista como chave em
 *      stateAdvantages: toda UF alcançada que não esteja em `ufs` é uma
 *      DIVERGÊNCIA — um retrato prometendo o que o ranking não entrega.
 *
 * Seção informativa (não conta como divergência): vocações que não são chave
 * de vantagem nem finalidade de nenhuma vantagem da UF — sozinhas elas nunca
 * geram card, o que pode ser intencional (ex.: "batata" documenta o retrato
 * sem ter vantagem própria).
 *
 * Uso:
 *   node scripts/checar-vocacoes-vs-vantagens.mjs            # relatório
 *   node scripts/checar-vocacoes-vs-vantagens.mjs --strict   # exit 1 se houver divergência
 *
 * De propósito NÃO está ligado ao build: é rotina de auditoria, não teste.
 */

import { readFile } from "node:fs/promises";

const ARQ_VANTAGENS = "lib/state-advantage.ts";
const ARQ_REGIOES = "lib/regioes-agricolas.ts";
const ARQ_GERADO = "lib/muni-regiao-gerado.ts";
const ARQ_RESOLVEDOR = "lib/retrato-regional.ts";

/** stateAdvantages: chave → lista de UFs. */
async function lerVantagens() {
  const src = await readFile(ARQ_VANTAGENS, "utf8");
  const ini = src.indexOf("export const stateAdvantages");
  if (ini < 0) throw new Error(`stateAdvantages não encontrado em ${ARQ_VANTAGENS}`);
  const corpo = src.slice(ini, src.indexOf("\n};", ini));
  const mapa = {};
  // Cada entrada é um objeto plano: `chave: { ufs: [...], factPt: ..., ... },`
  for (const m of corpo.matchAll(
    /^ {2}([a-z_]+):\s*\{[\s\S]*?ufs:\s*\[([^\]]*)\]/gm,
  )) {
    const ufs = [...m[2].matchAll(/"([A-Z]{2})"/g)].map((u) => u[1]);
    mapa[m[1]] = ufs;
  }
  if (!Object.keys(mapa).length) throw new Error("stateAdvantages veio vazio");
  return mapa;
}

/** REGIOES: chave da região → vocações. Para no BIOMA_FALLBACK (fora do escopo: o recomendador não filtra por bioma). */
async function lerRegioes() {
  const src = await readFile(ARQ_REGIOES, "utf8");
  const ini = src.indexOf("export const REGIOES");
  const fim = src.indexOf("export const BIOMA_FALLBACK");
  if (ini < 0 || fim < 0) throw new Error(`REGIOES não encontrado em ${ARQ_REGIOES}`);
  const corpo = src.slice(ini, fim);
  const mapa = {};
  for (const m of corpo.matchAll(
    /"([^"]+)":\s*\{[\s\S]*?vocacoes:\s*\[([\s\S]*?)\]/g,
  )) {
    mapa[m[1]] = [...m[2].matchAll(/"([a-z_]+)"/g)].map((v) => v[1]);
  }
  if (!Object.keys(mapa).length) throw new Error("REGIOES veio vazio");
  return { regioes: mapa, src };
}

/** UFs alcançadas por região, pelas três portas de resolução. */
async function lerAlcance(srcRegioes) {
  const alcance = {}; // região → Map<UF, Set<porta>>
  const marca = (regiao, uf, porta) => {
    ((alcance[regiao] ??= new Map()).get(uf) ?? alcance[regiao].set(uf, new Set()).get(uf)).add(porta);
  };

  // Porta 1: âncoras à mão (MUNI_TO_REGIAO, "NOME/UF" → região).
  const iniAnc = srcRegioes.indexOf("export const MUNI_TO_REGIAO");
  const blocoAnc = srcRegioes.slice(iniAnc, srcRegioes.indexOf("\n};", iniAnc));
  for (const m of blocoAnc.matchAll(/"[^"]+\/([A-Z]{2})":\s*"([^"]+)"/g)) {
    marca(m[2], m[1], "âncora");
  }

  // Porta 2: mapa offline gerado (região → "NOME/UF|NOME/UF|...").
  const srcGer = await readFile(ARQ_GERADO, "utf8");
  for (const m of srcGer.matchAll(/"([^"]+)":\s*\n\s*"([^"]+)"/g)) {
    for (const muni of m[2].split("|")) {
      const uf = muni.slice(-2);
      if (/^[A-Z]{2}$/.test(uf)) marca(m[1], uf, "mapa gerado");
    }
  }

  // Porta 3: resolução online por mesorregião ("UF:MESO" → região).
  const srcRes = await readFile(ARQ_RESOLVEDOR, "utf8");
  const iniMeso = srcRes.indexOf("const MESO_TO_REGIAO");
  const blocoMeso = srcRes.slice(iniMeso, srcRes.indexOf("\n};", iniMeso));
  for (const m of blocoMeso.matchAll(/"([A-Z]{2}):[^"]+"\s*:\s*"([^"]+)"/g)) {
    marca(m[2], m[1], "mesorregião online");
  }
  return alcance;
}

async function main() {
  const strict = process.argv.includes("--strict");
  const vantagens = await lerVantagens();
  const { regioes, src } = await lerRegioes();
  const alcance = await lerAlcance(src);

  // Finalidade de cada vantagem-cultura não é necessária aqui: o gate por UF
  // (`adv.ufs.includes(uf)`) é o mesmo para cultura e finalidade. O que o
  // guarda cruza é: vocação prometida × UF alcançada × `ufs` da vantagem.
  let divergencias = 0;
  const infoSemVantagem = [];

  console.log("Guarda RETRATO × RANKING — vocações prometidas vs UFs das vantagens\n");

  for (const [regiao, vocacoes] of Object.entries(regioes).sort()) {
    const ufsMap = alcance[regiao] ?? new Map();
    const ufs = [...ufsMap.keys()].sort();
    if (!ufs.length) {
      console.log(`⚠ ${regiao}: nenhuma porta de resolução alcança esta região (retrato morto?)\n`);
      continue;
    }
    const linhas = [];
    const semChave = [];
    for (const voc of vocacoes) {
      const adv = vantagens[voc];
      if (!adv) {
        semChave.push(voc);
        continue;
      }
      const faltam = ufs.filter((uf) => !adv.includes(uf));
      if (faltam.length) {
        divergencias += faltam.length;
        for (const uf of faltam) {
          const portas = [...(ufsMap.get(uf) ?? [])].join(", ");
          linhas.push(
            `  ✗ vocação "${voc}" prometida, mas ufs de \`${voc}\` [${adv.join(", ")}] não inclui ${uf} (alcançada via ${portas})`,
          );
        }
      }
    }
    if (linhas.length) {
      console.log(`${regiao} — UFs alcançadas: ${ufs.join(", ")}`);
      for (const l of linhas) console.log(l);
      console.log("");
    }
    if (semChave.length) infoSemVantagem.push(`  ${regiao}: ${semChave.join(", ")}`);
  }

  if (divergencias === 0) {
    console.log("✓ Nenhuma divergência: toda vocação prometida por retrato tem vantagem que cobre as UFs alcançadas.\n");
  } else {
    console.log(`TOTAL: ${divergencias} divergência(s) região×vocação×UF.\n`);
  }

  console.log(
    "INFO (não é divergência) — vocações sem chave em stateAdvantages; sozinhas\n" +
      "nunca geram card próprio (podem ser documentais ou finalidades amplas que\n" +
      "outras vantagens usam para passar no filtro):",
  );
  for (const l of infoSemVantagem) console.log(l);

  if (strict && divergencias > 0) process.exit(1);
}

main().catch((e) => {
  console.error("Falhou:", e.message);
  process.exit(1);
});
