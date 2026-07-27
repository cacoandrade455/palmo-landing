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
 * CHECAGENS HÍDRICAS (guarda estendido, reauditoria jul/2026):
 *   H1. Blurb seco × fato irrigado: cultura com perfil `sequeiro_semiarido_ok`
 *       (que ganha o blurb "adaptada ao sequeiro") cujo factPt fala em
 *       "irrigad..." SEM mencionar "sequeiro" — o usuário leria os dois
 *       textos se contradizendo.
 *   H2. Região seca sem cultura hídrica não classificada: em região com
 *       agua:"dry" ou do conjunto semiárido do motor, toda vocação que é
 *       chave de vantagem precisa ter entrada EXPLÍCITA em WATER_PROFILE
 *       (ou override regional) — sem isso ela cai no neutro implícito e
 *       aparece não-rebaixada num sertão sem água.
 *   H3 (INFO). Frescor: fato citando ano de edição anterior ao do manifesto
 *       (docs/fontes-jul2026.md; edições-âncora de 2024+) vira INFO até ser
 *       reescrito ou justificado.
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
const ARQ_MOTOR = "lib/land-recommender.ts";
/** Ano-âncora do manifesto (docs/fontes-jul2026.md): PAM/PPM/PEVS 2024. */
const ANO_MANIFESTO = 2024;

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

/** WATER_PROFILE do motor: chave → perfil; e overrides regionais chave→região. */
async function lerPerfisHidricos() {
  const src = await readFile(ARQ_MOTOR, "utf8");
  const ini = src.indexOf("const WATER_PROFILE");
  if (ini < 0) throw new Error(`WATER_PROFILE não encontrado em ${ARQ_MOTOR}`);
  const corpo = src.slice(ini, src.indexOf("\n};", ini));
  const perfis = {};
  for (const m of corpo.matchAll(/^ {2}([a-z_]+):\s*\{\s*profile:\s*"([a-z_]+)"/gm)) {
    perfis[m[1]] = m[2];
  }
  if (!Object.keys(perfis).length) throw new Error("WATER_PROFILE veio vazio");
  const iniOv = src.indexOf("const REGIONAL_PROFILE_OVERRIDE");
  const corpoOv = iniOv >= 0 ? src.slice(iniOv, src.indexOf("\n};", iniOv)) : "";
  const overrides = new Set(
    [...corpoOv.matchAll(/^ {2}([a-z_]+):/gm)].map((m) => m[1]),
  );
  // regiões que o motor trata como semiárido além das agua:"dry"
  const iniSA = src.indexOf("const REGIOES_SEMIARIDAS");
  const corpoSA = iniSA >= 0 ? src.slice(iniSA, src.indexOf("]);", iniSA)) : "";
  const semiaridas = new Set([...corpoSA.matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]));
  return { perfis, overrides, semiaridas };
}

/** factPt de cada chave de vantagem (para H1 e H3). */
async function lerFatos() {
  const src = await readFile(ARQ_VANTAGENS, "utf8");
  const ini = src.indexOf("export const stateAdvantages");
  const corpo = src.slice(ini, src.indexOf("\n};", ini));
  const fatos = {};
  for (const m of corpo.matchAll(
    /^ {2}([a-z_]+):\s*\{[\s\S]*?factPt:\s*\n?\s*"([\s\S]*?)",\n/gm,
  )) {
    fatos[m[1]] = m[2];
  }
  return fatos;
}

/** agua de cada região curada. */
function lerAguaPorRegiao(srcRegioes) {
  const ini = srcRegioes.indexOf("export const REGIOES");
  const fim = srcRegioes.indexOf("export const BIOMA_FALLBACK");
  const corpo = srcRegioes.slice(ini, fim);
  const mapa = {};
  for (const m of corpo.matchAll(/"([^"]+)":\s*\{[\s\S]*?agua:\s*"([a-z]+)"/g)) {
    mapa[m[1]] = m[2];
  }
  return mapa;
}

async function main() {
  const strict = process.argv.includes("--strict");
  const vantagens = await lerVantagens();
  const { regioes, src } = await lerRegioes();
  const alcance = await lerAlcance(src);
  const { perfis, overrides, semiaridas } = await lerPerfisHidricos();
  const fatos = await lerFatos();
  const aguaRegiao = lerAguaPorRegiao(src);

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

  // ── H1: blurb seco × fato irrigado ──
  console.log("Guarda HÍDRICO H1 — perfil sequeiro × fato que fala em irrigação\n");
  for (const [chave, perfil] of Object.entries(perfis)) {
    if (perfil !== "sequeiro_semiarido_ok") continue;
    const fato = fatos[chave];
    if (!fato) continue; // sem vantagem, sem card, sem blurb
    if (/irrigad/i.test(fato) && !/sequeiro/i.test(fato)) {
      divergencias++;
      console.log(
        `  ✗ "${chave}" tem perfil sequeiro_semiarido_ok mas o fato fala em irrigação sem citar o sequeiro — os dois textos se contradizem na tela.`,
      );
    }
  }
  console.log("  (ok quando nada listado acima)\n");

  // ── H2: região seca × vocação-chave sem perfil hídrico explícito ──
  console.log("Guarda HÍDRICO H2 — região seca com vocação-chave sem WATER_PROFILE\n");
  for (const [regiao, vocacoes] of Object.entries(regioes).sort()) {
    const seca = aguaRegiao[regiao] === "dry" || semiaridas.has(regiao);
    if (!seca) continue;
    for (const voc of vocacoes) {
      if (!vantagens[voc]) continue; // não é chave: nunca vira card sozinha
      if (!perfis[voc] && !overrides.has(voc)) {
        divergencias++;
        console.log(
          `  ✗ ${regiao}: vocação "${voc}" é chave de vantagem em região seca mas não tem entrada em WATER_PROFILE — cairia no neutro implícito e apareceria não-rebaixada sem água.`,
        );
      }
    }
  }
  console.log("  (ok quando nada listado acima)\n");

  if (divergencias === 0) {
    console.log("✓ Nenhuma divergência: retrato×ranking e checagens hídricas em zero.\n");
  } else {
    console.log(`TOTAL: ${divergencias} divergência(s).\n`);
  }

  // ── H3 (INFO): frescor dos fatos vs manifesto ──
  console.log(
    `INFO — frescor (fatos citando ano de edição anterior a ${ANO_MANIFESTO}; reescrever ou justificar):`,
  );
  let velhos = 0;
  for (const [chave, fato] of Object.entries(fatos)) {
    const anos = [...fato.matchAll(/\b(19\d{2}|20\d{2})\b/g)]
      .map((m) => Number(m[1]))
      .filter((a) => a < ANO_MANIFESTO);
    if (anos.length) {
      velhos++;
      console.log(`  ${chave}: cita ${anos.join(", ")} — "${fato.slice(0, 80)}..."`);
    }
  }
  if (!velhos) console.log("  ✓ nenhum fato com edição anterior ao manifesto.");
  console.log("");

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
