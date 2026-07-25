/**
 * ingest-mesorregioes.mjs — RODAR LOCALMENTE (mensal).
 * O sandbox não alcança a API do IBGE; Carlos roda na máquina dele.
 *
 * Busca a malha oficial do IBGE (todos os 5.570 municípios com sua
 * mesorregião) e gera DUAS saídas:
 *
 *   1. scripts/out/muni-mesorregiao.json — dado bruto oficial (auditoria).
 *   2. lib/muni-regiao-gerado.ts — o mapa município→região curada que o app
 *      consome offline. É o espelho exato da resolução online: para cada
 *      município, aplica a MESMA tabela MESO_TO_REGIAO que lib/retrato-
 *      regional.ts usa quando a API do IBGE responde.
 *
 * Por que a saída 2 existe (24/jul): o RETRATO resolvia a mesorregião pela API
 * (Brasil inteiro) enquanto o RECOMENDADOR, síncrono, só enxergava os 77
 * municípios-âncora escritos à mão. Coberturas diferentes = ranking
 * contradizendo o retrato logo acima dele. Gerar o mapa completo iguala as
 * duas. NENHUM fato novo é criado aqui: uma associação mesorregião→região só
 * existe se um humano a escreveu em MESO_TO_REGIAO.
 *
 * Municípios cuja mesorregião não tem região curada NÃO entram no mapa — eles
 * caem no retrato por bioma e o ranking segue no comportamento por UF. É a
 * degradação segura, e é de propósito.
 *
 * Uso:  node scripts/ingest-mesorregioes.mjs
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";

const API = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios";
const FONTE_MESO = "lib/retrato-regional.ts";
const SAIDA_TS = "lib/muni-regiao-gerado.ts";
const SAIDA_JSON = "scripts/out/muni-mesorregiao.json";

const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .trim();

/**
 * Lê MESO_TO_REGIAO do próprio fonte TypeScript. Ler em vez de duplicar mantém
 * uma única fonte da verdade: o que o navegador resolve online é exatamente o
 * que este script escreve para o offline.
 */
async function lerMesoToRegiao() {
  const src = await readFile(FONTE_MESO, "utf8");
  const ini = src.indexOf("const MESO_TO_REGIAO");
  if (ini < 0) throw new Error(`MESO_TO_REGIAO não encontrado em ${FONTE_MESO}`);
  const fim = src.indexOf("\n};", ini);
  if (fim < 0) throw new Error(`bloco MESO_TO_REGIAO malformado em ${FONTE_MESO}`);
  const bloco = src.slice(ini, fim);
  const mapa = {};
  for (const m of bloco.matchAll(/"([A-Z]{2}:[^"]+)"\s*:\s*"([^"]+)"/g)) {
    mapa[m[1]] = m[2];
  }
  if (!Object.keys(mapa).length) throw new Error("MESO_TO_REGIAO veio vazio");
  return mapa;
}

async function main() {
  const MESO_TO_REGIAO = await lerMesoToRegiao();
  console.log(
    `${Object.keys(MESO_TO_REGIAO).length} mesorregiões curadas lidas de ${FONTE_MESO}.`,
  );

  console.log("Buscando malha de municípios do IBGE...");
  const res = await fetch(API);
  if (!res.ok) throw new Error(`IBGE respondeu ${res.status}`);
  const municipios = await res.json();
  console.log(`  ${municipios.length} municípios recebidos.`);

  const bruto = {};
  const mapa = {};
  const semMeso = [];
  const mesosVistas = new Set();

  for (const m of municipios) {
    const nome = m.nome ?? "";
    // A malha de mesorregiões é a divisão de 2010: municípios instalados depois
    // vêm sem ela (só com região imediata/intermediária). Registramos e
    // seguimos — sem mesorregião não há região curada, e isso é honesto.
    const uf =
      m.microrregiao?.mesorregiao?.UF?.sigla ??
      m["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla ??
      "";
    const meso = m.microrregiao?.mesorregiao?.nome ?? "";
    if (!uf || !nome) continue;
    const chave = `${norm(nome)}/${uf}`;
    bruto[chave] = {
      codIbge: m.id,
      mesorregiao: meso || null,
      mesorregiaoId: m.microrregiao?.mesorregiao?.id ?? null,
    };
    if (!meso) {
      semMeso.push(`${nome}/${uf}`);
      continue;
    }
    const mesoKey = `${uf}:${norm(meso)}`;
    mesosVistas.add(mesoKey);
    const regiao = MESO_TO_REGIAO[mesoKey];
    if (regiao) mapa[chave] = regiao;
  }

  await mkdir("scripts/out", { recursive: true });
  await writeFile(SAIDA_JSON, JSON.stringify(bruto, null, 2), "utf8");
  console.log(`OK: ${SAIDA_JSON} com ${Object.keys(bruto).length} municípios.`);

  const orfas = Object.keys(MESO_TO_REGIAO).filter((k) => !mesosVistas.has(k));
  if (orfas.length) {
    console.warn(
      `AVISO: ${orfas.length} chave(s) de MESO_TO_REGIAO não existem na malha ` +
        `do IBGE (erro de digitação?):\n  ${orfas.join("\n  ")}`,
    );
  }
  if (semMeso.length) {
    console.warn(
      `AVISO: ${semMeso.length} município(s) sem mesorregião na malha ` +
        `(instalados após 2010): ${semMeso.join(", ")}`,
    );
  }

  // Formato compacto: uma linha por REGIÃO, com os municípios separados por "|".
  // Este arquivo entra no bundle do navegador e 75% do tráfego é celular — a
  // forma "chave: valor" por município custava 3x mais bytes para dizer o
  // mesmo. O índice é montado sob demanda em regiaoGeradaDe().
  const porRegiao = {};
  for (const [muni, regiao] of Object.entries(mapa)) {
    (porRegiao[regiao] ??= []).push(muni);
  }
  const linhas = Object.keys(porRegiao)
    .sort()
    .map((r) => `  ${JSON.stringify(r)}:\n    ${JSON.stringify(porRegiao[r].sort().join("|"))},`)
    .join("\n");
  const ts = `/**
 * GERADO POR scripts/ingest-mesorregioes.mjs — NÃO EDITAR À MÃO.
 * Regerar com: node scripts/ingest-mesorregioes.mjs
 *
 * Município → região curada, derivado mecanicamente de duas fontes existentes:
 *   - a malha oficial de mesorregiões do IBGE (${municipios.length} municípios);
 *   - a tabela MESO_TO_REGIAO, curada à mão em ${FONTE_MESO}.
 *
 * É o espelho OFFLINE da resolução que lib/retrato-regional.ts faz online
 * contra a API do IBGE. Não contém nenhum fato que um humano não tenha
 * escrito: cada entrada é "este município pertence a esta mesorregião" (IBGE)
 * cruzado com "esta mesorregião tem esta vocação" (curadoria).
 *
 * Municípios fora de uma mesorregião curada ficam DE FORA de propósito: sem
 * entrada aqui, o retrato cai no bioma e o ranking mantém o comportamento por
 * UF.
 *
 * Cobertura: ${Object.keys(mapa).length} de ${Object.keys(bruto).length} municípios.
 */

/** região curada → "NOME/UF|NOME/UF|..." (maiúsculo, sem acento). */
const REGIAO_MUNICIPIOS: Record<string, string> = {
${linhas}
};

/** Índice invertido, montado na primeira consulta e reaproveitado depois. */
let indice: Map<string, string> | null = null;

/** Região curada de um município ("NOME/UF" normalizado), ou undefined. */
export function regiaoGeradaDe(chave: string): string | undefined {
  if (!indice) {
    indice = new Map();
    for (const [regiao, lista] of Object.entries(REGIAO_MUNICIPIOS)) {
      for (const muni of lista.split("|")) indice.set(muni, regiao);
    }
  }
  return indice.get(chave);
}
`;
  await writeFile(SAIDA_TS, ts, "utf8");
  console.log(
    `OK: ${SAIDA_TS} com ${Object.keys(mapa).length} municípios em ` +
      `${new Set(Object.values(mapa)).size} regiões curadas ` +
      `(${((Object.keys(mapa).length / Object.keys(bruto).length) * 100).toFixed(1)}% do país).`,
  );
  console.log(
    "Próximo passo: mesorregiões novas só entram no mapa depois de ganharem\n" +
      `retrato curado em lib/regioes-agricolas.ts e associação em ${FONTE_MESO}.`,
  );
}

main().catch((e) => {
  console.error("Falhou:", e.message);
  process.exit(1);
});
