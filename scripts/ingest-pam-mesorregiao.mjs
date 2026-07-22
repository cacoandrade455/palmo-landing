/**
 * ingest-pam-mesorregiao.mjs — RODAR LOCALMENTE (anual, quando sai a PAM).
 * O sandbox dos agentes pode não alcançar a API do IBGE; Carlos roda na
 * máquina dele.
 *
 * Objetivo: dar lastro de dado oficial à camada intermediária
 * mesorregião→região curada. Para cada uma das 137 mesorregiões do IBGE
 * calcula, a partir do VALOR da produção:
 *   - produto líder (maior valor da produção em 2024);
 *   - top 3 produtos por valor, com participação no total da mesorregião;
 *   - dominância lavoura × pecuária.
 *
 * Fontes (nenhum número é estimado aqui — tudo vem do SIDRA):
 *   - PAM 2024, tabela 5457, variável 215 (Valor da produção, Mil Reais),
 *     nível N8 (mesorregião). Cobre lavouras temporárias e permanentes.
 *     A PAM não precifica pecuária, por isso a dominância vem do Censo.
 *   - Censo Agropecuário 2017, tabela 6897, variável 1999 (Valor da
 *     produção dos estabelecimentos, Mil Reais), classificação 12547
 *     (Tipo de produção: Animal × Vegetal), nível N8. É a única fonte
 *     oficial que compara valor vegetal e animal no mesmo recorte.
 *   - Malha municipal: scripts/out/muni-mesorregiao.json (gerado por
 *     scripts/ingest-mesorregioes.mjs) — dá UFs e nº de municípios de
 *     cada mesorregião e serve de rota alternativa de agregação.
 *
 * Uso:  node scripts/ingest-pam-mesorregiao.mjs
 * Saída: scripts/out/pam-mesorregiao.json
 *
 * Este script NÃO classifica nada e NÃO escreve em lib/. A proposta de
 * classificação sai de scripts/gera-meso-classificacao.mjs, que lê este
 * JSON. A decisão final de mexer em lib/regioes-agricolas.ts é humana.
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";

const SIDRA = "https://apisidra.ibge.gov.br/values";
const ANO_PAM = "2024";
const ANO_CENSO = "2017";
const TIMEOUT_MS = 240_000;
const TENTATIVAS = 3;
const ESPERA_BASE_MS = 5_000;

const MUNI_JSON = "scripts/out/muni-mesorregiao.json";
const SAIDA = "scripts/out/pam-mesorregiao.json";

/**
 * A classificação 782 traz café em três linhas: "Total", "Arábica" e
 * "Canephora" — Total já é a soma das outras duas. Somar as três inflaria
 * o valor do café e distorceria o ranking, então as variedades saem da
 * soma e voltam num campo próprio (a variedade importa: arábica aponta
 * para o Sul de Minas, canephora para Rondônia e Espírito Santo).
 */
const CAFE_TOTAL = "40139";
const CAFE_ARABICA = "40140";
const CAFE_CANEPHORA = "40141";
const FORA_DO_RANKING = new Set(["0", CAFE_ARABICA, CAFE_CANEPHORA]);

/** Códigos das 27 UFs, usados só na rota alternativa (agregação municipal). */
const UFS = [
  11, 12, 13, 14, 15, 16, 17, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 33,
  35, 41, 42, 43, 50, 51, 52, 53,
];

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Baixa uma consulta do SIDRA com timeout, retry e mensagem clara. */
async function baixar(url, rotulo) {
  let ultimoErro = null;
  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controle.signal });
      if (!res.ok) throw new Error(`SIDRA respondeu HTTP ${res.status}`);
      const json = await res.json();
      if (!Array.isArray(json) || json.length < 2) {
        throw new Error("resposta vazia ou fora do formato esperado");
      }
      // A primeira linha do SIDRA é o cabeçalho descritivo, não é dado.
      return json.slice(1);
    } catch (erro) {
      ultimoErro = erro;
      const motivo =
        erro.name === "AbortError"
          ? `timeout de ${TIMEOUT_MS / 1000}s`
          : erro.message;
      console.warn(
        `  [${rotulo}] tentativa ${tentativa}/${TENTATIVAS} falhou: ${motivo}`,
      );
      if (tentativa < TENTATIVAS) await dormir(ESPERA_BASE_MS * tentativa);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(
    `${rotulo}: falhou nas ${TENTATIVAS} tentativas (${ultimoErro?.message}). ` +
      "Confira a conexão com apisidra.ibge.gov.br e rode de novo.",
  );
}

/** O SIDRA usa "-", "..", "...", "X" para vazio/sigiloso. Só número vale. */
function valorNumerico(v) {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

/** Lê a malha e devolve o esqueleto das mesorregiões + índice município→meso. */
async function lerMalha() {
  let bruto;
  try {
    bruto = JSON.parse(await readFile(MUNI_JSON, "utf8"));
  } catch (erro) {
    throw new Error(
      `não consegui ler ${MUNI_JSON} (${erro.message}). ` +
        "Rode antes: node scripts/ingest-mesorregioes.mjs",
    );
  }

  const mesos = new Map();
  const porCodigoMunicipio = new Map();

  for (const [chave, m] of Object.entries(bruto)) {
    const id = String(m.mesorregiaoId ?? "");
    if (!id) continue;
    const uf = chave.slice(-2);
    if (!mesos.has(id)) {
      mesos.set(id, {
        mesorregiaoId: id,
        mesorregiao: m.mesorregiao ?? "",
        ufs: new Set(),
        qtdMunicipios: 0,
      });
    }
    const meso = mesos.get(id);
    meso.ufs.add(uf);
    meso.qtdMunicipios += 1;
    porCodigoMunicipio.set(String(m.codIbge), id);
  }

  return { mesos, porCodigoMunicipio };
}

/** Soma valor por (mesorregião, produto) a partir das linhas do SIDRA. */
function acumular(alvo, mesoId, codigo, produto, valor) {
  if (!mesoId || !codigo || valor === null) return;
  if (!alvo.has(mesoId)) alvo.set(mesoId, new Map());
  const porProduto = alvo.get(mesoId);
  const atual = porProduto.get(codigo);
  if (atual) atual.valor += valor;
  else porProduto.set(codigo, { produto, valor });
}

/** Rota principal: PAM direto no nível mesorregião (N8). */
async function pamPorMesorregiao() {
  const url = `${SIDRA}/t/5457/n8/all/v/215/p/${ANO_PAM}/c782/all`;
  const linhas = await baixar(url, "PAM 2024 / mesorregiões");
  const acumulado = new Map();
  for (const l of linhas) {
    acumular(
      acumulado,
      String(l.D1C),
      String(l.D4C),
      l.D4N,
      valorNumerico(l.V),
    );
  }
  return acumulado;
}

/** Rota alternativa: PAM por município, agregada pela malha oficial. */
async function pamPorMunicipioAgregado(porCodigoMunicipio) {
  const acumulado = new Map();
  for (const uf of UFS) {
    const url =
      `${SIDRA}/t/5457/n6/in%20n3%20${uf}/v/215/p/${ANO_PAM}/c782/all`;
    const linhas = await baixar(url, `PAM 2024 / municípios da UF ${uf}`);
    for (const l of linhas) {
      const mesoId = porCodigoMunicipio.get(String(l.D1C));
      acumular(acumulado, mesoId, String(l.D4C), l.D4N, valorNumerico(l.V));
    }
    console.log(`  UF ${uf}: ${linhas.length} linhas agregadas.`);
  }
  return acumulado;
}

/** Censo Agro 2017: valor da produção vegetal × animal por mesorregião. */
async function dominanciaPorMesorregiao() {
  const url =
    `${SIDRA}/t/6897/n8/all/v/1999/p/${ANO_CENSO}` +
    "/c829/46302/c12547/111995,111999/c218/46502/c12517/113601";
  const linhas = await baixar(url, "Censo Agro 2017 / vegetal × animal");
  const mapa = new Map();
  for (const l of linhas) {
    const id = String(l.D1C);
    if (!mapa.has(id)) mapa.set(id, { vegetal: null, animal: null });
    const alvo = mapa.get(id);
    if (l.D5C === "111999") alvo.vegetal = valorNumerico(l.V);
    if (l.D5C === "111995") alvo.animal = valorNumerico(l.V);
  }
  return mapa;
}

/**
 * Classifica a dominância com corte explícito de 60%: abaixo disso a
 * mesorregião é mista de verdade e fica "indeterminado" — melhor um vazio
 * honesto do que um rótulo forçado.
 */
function rotularDominancia(par) {
  if (!par || par.vegetal === null || par.animal === null) {
    return { dominancia: "indeterminado", motivo: "sem dado no Censo 2017" };
  }
  const total = par.vegetal + par.animal;
  if (total <= 0) {
    return { dominancia: "indeterminado", motivo: "valor total zero" };
  }
  const percVegetal = par.vegetal / total;
  if (percVegetal >= 0.6) {
    return { dominancia: "lavoura", percVegetal, motivo: "valor vegetal ≥ 60%" };
  }
  if (percVegetal <= 0.4) {
    return { dominancia: "pecuaria", percVegetal, motivo: "valor animal ≥ 60%" };
  }
  return {
    dominancia: "indeterminado",
    percVegetal,
    motivo: "vegetal e animal entre 40% e 60% — mesorregião mista",
  };
}

async function main() {
  console.log("Lendo a malha município→mesorregião...");
  const { mesos, porCodigoMunicipio } = await lerMalha();
  console.log(
    `  ${mesos.size} mesorregiões e ${porCodigoMunicipio.size} municípios.`,
  );

  console.log(`Buscando PAM ${ANO_PAM} (valor da produção) no SIDRA...`);
  let valores;
  let origemPam;
  try {
    valores = await pamPorMesorregiao();
    origemPam = `SIDRA tabela 5457, variável 215, nível N8 (mesorregião), ${ANO_PAM}`;
    console.log(`  OK direto no nível mesorregião: ${valores.size} mesos.`);
  } catch (erro) {
    console.warn(`  Nível mesorregião indisponível (${erro.message}).`);
    console.warn("  Caindo para agregação município→mesorregião...");
    valores = await pamPorMunicipioAgregado(porCodigoMunicipio);
    origemPam =
      `SIDRA tabela 5457, variável 215, nível N6 (município) agregado ` +
      `para mesorregião via ${MUNI_JSON}, ${ANO_PAM}`;
    console.log(`  OK por agregação: ${valores.size} mesos.`);
  }

  console.log(`Buscando Censo Agro ${ANO_CENSO} (vegetal × animal)...`);
  let dominancias = new Map();
  let origemCenso = `SIDRA tabela 6897, variável 1999, nível N8, ${ANO_CENSO}`;
  try {
    dominancias = await dominanciaPorMesorregiao();
    console.log(`  OK: ${dominancias.size} mesos com dado de dominância.`);
  } catch (erro) {
    console.warn(`  Censo indisponível (${erro.message}).`);
    console.warn("  Toda a dominância sairá como 'indeterminado'.");
    origemCenso = "indisponível na execução — dominância não apurada";
  }

  const saida = [];
  const semDado = [];
  for (const meso of [...mesos.values()].sort((a, b) =>
    a.mesorregiaoId.localeCompare(b.mesorregiaoId),
  )) {
    const porProduto = valores.get(meso.mesorregiaoId) ?? new Map();
    const ranking = [...porProduto.entries()]
      .filter(([codigo, r]) => !FORA_DO_RANKING.has(codigo) && r.valor > 0)
      .map(([, r]) => r)
      .sort((a, b) => b.valor - a.valor);
    const totalMilReais = ranking.reduce((s, r) => s + r.valor, 0);
    const top3 = ranking.slice(0, 3).map((r) => ({
      produto: r.produto,
      valorMilReais: r.valor,
      participacao: totalMilReais > 0 ? r.valor / totalMilReais : null,
    }));
    const arabica = porProduto.get(CAFE_ARABICA)?.valor ?? 0;
    const canephora = porProduto.get(CAFE_CANEPHORA)?.valor ?? 0;
    const cafe =
      porProduto.get(CAFE_TOTAL)?.valor > 0
        ? {
            arabicaMilReais: arabica,
            canephoraMilReais: canephora,
            variedadePredominante:
              arabica === canephora
                ? "indeterminado"
                : arabica > canephora
                  ? "arabica"
                  : "canephora",
          }
        : null;
    const dom = rotularDominancia(dominancias.get(meso.mesorregiaoId));
    if (ranking.length === 0) semDado.push(meso.mesorregiaoId);

    saida.push({
      mesorregiaoId: Number(meso.mesorregiaoId),
      mesorregiao: meso.mesorregiao,
      ufs: [...meso.ufs].sort(),
      qtdMunicipios: meso.qtdMunicipios,
      valorProducaoTotalMilReais: totalMilReais,
      produtoLider: top3[0] ?? null,
      top3,
      cafe,
      dominancia: dom.dominancia,
      dominanciaMotivo: dom.motivo,
      participacaoVegetalCenso2017:
        dom.percVegetal === undefined ? null : dom.percVegetal,
    });
  }

  await mkdir("scripts/out", { recursive: true });
  await writeFile(
    SAIDA,
    JSON.stringify(
      {
        geradoEm: new Date().toISOString(),
        nivel: "mesorregiao",
        fontes: {
          valorProducaoLavouras: origemPam,
          dominanciaLavouraPecuaria: origemCenso,
          malhaMunicipal: MUNI_JSON,
        },
        observacoes: [
          "valorProducaoTotalMilReais soma apenas lavouras (PAM não precifica pecuária).",
          "dominancia compara valor vegetal e animal do Censo Agro 2017 (corte de 60%).",
          "Valores em Mil Reais correntes do ano da pesquisa.",
          "Café entra no ranking só como 'Café (em grão) Total'; arábica e canephora vão no campo cafe.",
        ],
        mesorregioes: saida,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`OK: ${SAIDA} com ${saida.length} mesorregiões.`);
  if (semDado.length) {
    console.warn(
      `Atenção: ${semDado.length} mesorregiões sem valor de lavoura ` +
        `(${semDado.join(", ")}) — verificar antes de classificar.`,
    );
  }
  console.log(
    "Próximo passo: node scripts/gera-meso-classificacao.mjs (gera a proposta " +
      "para revisão humana). Nada é escrito em lib/ automaticamente.",
  );
}

main().catch((erro) => {
  console.error("Falhou:", erro.message);
  process.exit(1);
});
