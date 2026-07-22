/**
 * ingest-mesorregioes.mjs — RODAR LOCALMENTE (mensal).
 * O sandbox não alcança a API do IBGE; Carlos roda na máquina dele.
 *
 * Busca a malha oficial do IBGE (todos os 5.570 municípios com sua
 * mesorregião) e gera/atualiza o fallback município→mesorregião.
 *
 * Uso:  node scripts/ingest-mesorregioes.mjs
 * Saída: scripts/out/muni-mesorregiao.json  (dado bruto oficial)
 *
 * Depois, os municípios cujos códigos de mesorregião correspondem a uma
 * região curada em lib/regioes-agricolas.ts são associados; os demais
 * recebem o bioma. A associação mesorregião→região curada é manual (feita
 * uma vez, conforme Carlos valida cada mesorregião), então este script só
 * cuida da parte que muda de fato: a malha municipal oficial.
 */

import { writeFile, mkdir } from "node:fs/promises";

const API =
  "https://servicodados.ibge.gov.br/api/v1/localidades/municipios";

async function main() {
  console.log("Buscando malha de municípios do IBGE...");
  const res = await fetch(API);
  if (!res.ok) throw new Error(`IBGE respondeu ${res.status}`);
  const municipios = await res.json();
  console.log(`  ${municipios.length} municípios recebidos.`);

  const norm = (s) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();

  const mapa = {};
  for (const m of municipios) {
    const uf = m.microrregiao?.mesorregiao?.UF?.sigla ?? "";
    const meso = m.microrregiao?.mesorregiao?.nome ?? "";
    const mesoId = m.microrregiao?.mesorregiao?.id ?? null;
    const nome = m.nome ?? "";
    if (!uf || !nome) continue;
    mapa[`${norm(nome)}/${uf}`] = {
      codIbge: m.id,
      mesorregiao: meso,
      mesorregiaoId: mesoId,
    };
  }

  await mkdir("scripts/out", { recursive: true });
  await writeFile(
    "scripts/out/muni-mesorregiao.json",
    JSON.stringify(mapa, null, 2),
    "utf8",
  );
  console.log(
    `OK: scripts/out/muni-mesorregiao.json com ${Object.keys(mapa).length} municípios.`,
  );
  console.log(
    "Próximo passo: revisar as mesorregiões novas e associá-las a uma região\n" +
      "curada (ou bioma) em lib/regioes-agricolas.ts. As já mapeadas seguem valendo.",
  );
}

main().catch((e) => {
  console.error("Falhou:", e.message);
  process.exit(1);
});
