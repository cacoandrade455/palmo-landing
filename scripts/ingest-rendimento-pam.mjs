/**
 * PALMO — Ingestão do rendimento médio municipal (IBGE/PAM)
 *
 * Lê a tabela 5457 do SIDRA/IBGE (Produção Agrícola Municipal), pega a
 * variável 112 (Rendimento médio da produção) do ANO MAIS RECENTE publicado,
 * para os produtos que têm par INEQUÍVOCO com uma cultura do dropdown da
 * Palmo, e grava lib/rendimento-pam.json.
 *
 * ── COMO RODAR (local — o SIDRA não abre no sandbox) ─────────────────────
 *   node scripts/ingest-rendimento-pam.mjs
 *
 * Rodar 1x agora e depois 1x/ano (a PAM é anual; 2024 saiu em 03/10/2025).
 * O script é autodescobridor: acha o código de cada produto pelo NOME EXATO
 * nos metadados da tabela. Se o IBGE renumerar, continua funcionando; se
 * RENOMEAR, o script PARA e diz qual nome sumiu — nunca adivinha por
 * semelhança, porque "Caju" e "Castanha de caju" são produtos diferentes com
 * rendimentos de ordem de grandeza diferente.
 *
 * ── AS TRÊS ARMADILHAS QUE ESTE SCRIPT EXISTE PARA NÃO CAIR ──────────────
 *
 * 1. AUSÊNCIA NÃO É ZERO. 76,8% dos valores da PAM 2024 são "-" (zero
 *    absoluto: não se produz ali), e ainda há ".." (não se aplica), "..."
 *    (não disponível) e "X" (sigilo). Medido em 13/08/2026: dos 400.536
 *    valores da tabela, só 61.043 são numéricos, o menor é 3 e o valor "0"
 *    NÃO APARECE NENHUMA VEZ. Logo: qualquer zero gravado por este script é
 *    bug de parsing, e o script recusa gravar zero.
 *
 * 2. A UNIDADE DA API MENTE para dois produtos. A resposta traz sempre
 *    MN="Quilogramas por Hectare", mas a nota 6 da própria tabela 5457 diz:
 *    "As quantidades produzidas de abacaxi e de coco-da-baía são expressas em
 *    mil frutos e o rendimento médio em frutos/ha". Por isso a unidade vem da
 *    tabela DE-PARA abaixo, curada, e NUNCA do campo MN.
 *
 * 3. O LIMITE DE 50.000 VALORES por requisição não tem paginação: a chamada
 *    inteira falha com HTTP 400 e corpo em TEXTO PURO (não JSON). Fatiar por
 *    UF quebra nas UFs grandes (MG: 853 municípios × 72 produtos = 61.416).
 *    Fatiamos por PRODUTO, com o tamanho do lote calculado a partir do número
 *    real de municípios — nunca constante mágica.
 */

import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "lib", "rendimento-pam.json");

const AGREGADO = "5457"; // PAM — lavouras temporárias e permanentes
const VARIAVEL = "112"; // Rendimento médio da produção
const CLASSIFICACAO = "782"; // Produto das lavouras temporárias e permanentes
const META = `https://servicodados.ibge.gov.br/api/v3/agregados/${AGREGADO}/metadados`;
const MUNICIPIOS_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios";
const LIMITE_VALORES = 50000; // limite duro da API, sem paginação

const USER_AGENT =
  "Palmo/1.0 (marketplace de terras; ingestao anual PAM; contato: cacoandrade45@gmail.com)";

/**
 * ── O DE-PARA, CURADO CÉLULA A CÉLULA ────────────────────────────────────
 *
 * Chave: o `value` da cultura no dropdown (lib/content.ts → appraiser.crops).
 * `produto`: o nome EXATO do produto na classificação 782 do IBGE.
 * `unidade`: "kg_ha" ou "frutos_ha" — CURADA, nunca lida da resposta.
 * `sacaKg`: divisor para sc/ha. Só existe onde a saca é oficial E se refere à
 *           MESMA forma que o IBGE mede. Ausente = não converte.
 * `escopo`: CÓDIGO (não frase) para quando o rótulo da Palmo promete algo mais
 *           estreito, ou diferente, do que o IBGE mede — "Arroz irrigado" contra
 *           todo o arroz do município, "Oliveira (azeite)" contra a azeitona
 *           colhida. A frase correspondente é copy de interface e mora no
 *           componente, em PT e EN. Sem isto a ressalva morreria aqui dentro e o
 *           leitor veria um rótulo estreito com um número largo embaixo.
 *
 * A chave é SÓ a cultura, nunca (finalidade, cultura): `crop` é texto livre no
 * banco, sem enum, e um par finalidade/cultura torto não pode fazer o card
 * sumir.
 *
 * `produtoAlternativo` / `escopoAlternativo`: quando a c782 publica DUAS
 *           lavouras diferentes sob o mesmo rótulo do dropdown e a escolha
 *           depende do município. Só o algodão usa: o herbáceo é a lavoura
 *           anual tecnificada e responde por quase toda a área do país; o
 *           arbóreo é o algodão perene do semiárido, que sobrevive em
 *           municípios onde o herbáceo simplesmente não existe. Prefere-se o
 *           herbáceo; onde ele falta, entra o arbóreo, e a ressalva na tela diz
 *           QUAL dos dois foi usado naquele município.
 *           Medido em 14/08/2026: em 2024 o herbáceo tem 376 municípios em 17
 *           UFs (mediana 1.500 kg/ha) e o arbóreo tem ZERO — o mecanismo de
 *           alternativo não dispara para nenhum município neste ano. Fica
 *           mesmo assim, porque a regra é do dado e não do ano: o arbóreo teve
 *           valor municipal até 2013 e a categoria continua publicada.
 *
 * ── A REGRA, decidida pelo Carlos em 14/08/2026 ──────────────────────────
 * Cultura NÃO sai do mapa por desconforto de rótulo. Onde o número é o certo e
 * quem engana é o rótulo, a saída é NOMEAR o que o número mede, na ressalva de
 * escopo que aparece embaixo do valor. Só fica fora o que não tem dado
 * municipal com fonte.
 *
 * A regra anterior era outra: deixava fora sempre que o rótulo da Palmo
 * nomeasse uma população mais estreita de lavouras do que a medida. Ela tirava
 * arroz, limão, noz e palmito — dado bom do IBGE, escondido do proprietário
 * por causa de uma palavra no dropdown. Agora eles entram, com a agregação dita
 * em voz alta na própria tela.
 *
 * O QUE CONTINUA FORA, E POR QUÊ:
 *   • hortalicas   — "Hortaliças em geral" é rótulo guarda-chuva, não é
 *                    produto. Não existe agregado de hortaliças na c782, e
 *                    somar tomate com alho não produz rendimento de coisa
 *                    alguma.
 *   • sem par na PAM (29): gergelim, canola, milheto, grao_de_bico, chia,
 *     macadamia, aroeira, acerola, atemoia, graviola, pitaya, morango,
 *     cupuacu, roma, lichia, jabuticaba, cenoura, abobora, pimentao, inhame,
 *     quiabo, gengibre, pimentas, mandioquinha, brassicas, beterraba, chuchu,
 *     pepino, flores. Não é escolha nossa: a PAM não pesquisa esses produtos.
 *   • pecuária, avicultura, aquicultura, silvicultura e extrativismo (31) — a
 *     PAM é de LAVOURA. Pecuária é a PPM e extrativismo/silvicultura é a PEVS
 *     (esta já ingerida em lib/pevs.json). Não se misturam, e a unidade nem
 *     seria por hectare.
 */
const DE_PARA = {
  // ── grãos ──────────────────────────────────────────────────────────────
  soja: { produto: "Soja (em grão)", unidade: "kg_ha", sacaKg: 60 },
  arroz: {
    produto: "Arroz (em casca)",
    unidade: "kg_ha",
    // 50 kg, NUNCA 60: a saca de arroz em casca é de 50 kg. O divisor está
    // amarrado à cultura justamente para ninguém copiar o 60 da soja e errar
    // por +20% num número que ninguém confere de cabeça.
    sacaKg: 50,
    escopo: "arroz_todo_sistema",
  },
  algodao: {
    produto: "Algodão herbáceo (em caroço)",
    produtoAlternativo: "Algodão arbóreo (em caroço)",
    unidade: "kg_ha",
    escopo: "algodao_herbaceo",
    escopoAlternativo: "algodao_arboreo",
  },
  milho: { produto: "Milho (em grão)", unidade: "kg_ha", sacaKg: 60 },
  feijao: { produto: "Feijão (em grão)", unidade: "kg_ha", sacaKg: 60 },
  sorgo: {
    produto: "Sorgo (em grão)",
    unidade: "kg_ha",
    // Sem saca em v1: a unidade de 60 kg existe na Portaria MAPA 812/2025,
    // mas não há indicador de mercado que chame isso de "saca". Fica fora
    // até haver decisão expressa.
  },
  trigo: { produto: "Trigo (em grão)", unidade: "kg_ha", sacaKg: 60 },
  girassol: { produto: "Girassol (em grão)", unidade: "kg_ha" },
  amendoim: { produto: "Amendoim (em casca)", unidade: "kg_ha" },
  aveia: { produto: "Aveia (em grão)", unidade: "kg_ha" },
  cevada: { produto: "Cevada (em grão)", unidade: "kg_ha" },
  mamona: { produto: "Mamona (baga)", unidade: "kg_ha" },
  fumo: { produto: "Fumo (em folha)", unidade: "kg_ha" },
  fava: {
    produto: "Fava (em grão)",
    unidade: "kg_ha",
    // A fava do IBGE é a do Nordeste (Phaseolus lunatus), não a fava europeia
    // (Vicia faba). O rótulo EN já diz "Lima bean (fava)"; a ressalva fecha a
    // dúvida também em português, onde "fava" sozinha é ambígua.
    escopo: "fava_de_lima",
  },
  triticale: { produto: "Triticale (em grão)", unidade: "kg_ha" },

  // ── lavoura permanente ─────────────────────────────────────────────────
  cafe: {
    produto: "Café (em grão) Total",
    unidade: "kg_ha",
    sacaKg: 60,
    // Nota 4 da tabela 5457: "Até 2001, café (em coco), a partir de 2002,
    // café (beneficiado ou em grão)". É a MESMA forma da saca de 60 kg.
    escopo: "soma_de_tipos", // arábica + canephora, beneficiado (nota 4 da tabela 5457)
  },
  cacau: { produto: "Cacau (em amêndoa)", unidade: "kg_ha" },
  caju: {
    produto: "Castanha de caju",
    unidade: "kg_ha",
    // O rótulo da Palmo é "Caju (castanha)": desempata contra o produto
    // "Caju" (a fruta), que é outra linha da c782.
  },
  citros: {
    produto: "Laranja",
    unidade: "kg_ha",
    // Sem escopo: o rótulo já diz "laranja", que é exatamente o produto medido.
  },
  dende: { produto: "Dendê (cacho de coco)", unidade: "kg_ha" },
  erva_mate: { produto: "Erva-mate (folha verde)", unidade: "kg_ha" },
  pimenta_do_reino: { produto: "Pimenta-do-reino", unidade: "kg_ha" },
  guarana: { produto: "Guaraná (semente)", unidade: "kg_ha" },
  oliveira: { produto: "Azeitona", unidade: "kg_ha", escopo: "fruto_nao_derivado" },
  urucum: { produto: "Urucum (semente)", unidade: "kg_ha" },
  limao_tahiti: { produto: "Limão", unidade: "kg_ha", escopo: "limao_agregado" },
  seringueira: {
    // Escolha por COBERTURA MUNICIPAL medida em 14/08/2026, não por preferência:
    // "Borracha (látex coagulado)" tem 585 municípios em 14 UFs (mediana 2.096
    // kg/ha), enquanto "Borracha (látex líquido)" tem ZERO — os 5.563
    // municípios vêm "..." (não disponível) em 2024, e a série nacional só teve
    // valor entre 1981 e 1987. Não há trade-off nem risco de misturar as duas:
    // uma delas simplesmente não existe hoje.
    produto: "Borracha (látex coagulado)",
    unidade: "kg_ha",
    escopo: "seringueira_coagulado",
  },
  noz_pecan: { produto: "Noz (fruto seco)", unidade: "kg_ha", escopo: "noz_sem_especie" },
  palmito_pupunha: { produto: "Palmito", unidade: "kg_ha", escopo: "palmito_sem_especie" },

  // ── fruticultura ───────────────────────────────────────────────────────
  banana: {
    produto: "Banana (cacho)",
    unidade: "kg_ha",
    escopo: "rendimento_do_cacho", // em toneladas desde 2001 (nota 2 da tabela 5457)
  },
  manga: { produto: "Manga", unidade: "kg_ha" },
  uva: { produto: "Uva", unidade: "kg_ha" },
  melao: { produto: "Melão", unidade: "kg_ha" },
  acai: { produto: "Açaí", unidade: "kg_ha" }, // cultivado; o extrativo é da PEVS, outra pesquisa
  mamao: { produto: "Mamão", unidade: "kg_ha" },
  maracuja: { produto: "Maracujá", unidade: "kg_ha" },
  melancia: { produto: "Melancia", unidade: "kg_ha" },
  goiaba: { produto: "Goiaba", unidade: "kg_ha" },
  abacate: { produto: "Abacate", unidade: "kg_ha" },
  maca: { produto: "Maçã", unidade: "kg_ha" },
  pessego: { produto: "Pêssego", unidade: "kg_ha" },
  tangerina: { produto: "Tangerina", unidade: "kg_ha" },
  figo: { produto: "Figo", unidade: "kg_ha" },
  caqui: { produto: "Caqui", unidade: "kg_ha" },
  abacaxi: {
    produto: "Abacaxi*",
    unidade: "frutos_ha", // nota 6 da tabela 5457 — NÃO é kg/ha
  },
  coco: {
    produto: "Coco-da-baía*",
    unidade: "frutos_ha", // nota 6 da tabela 5457 — NÃO é kg/ha
  },

  // ── horticultura ───────────────────────────────────────────────────────
  mandioca: { produto: "Mandioca", unidade: "kg_ha" },
  batata: { produto: "Batata-inglesa", unidade: "kg_ha" },
  batata_doce: { produto: "Batata-doce", unidade: "kg_ha" },
  tomate: { produto: "Tomate", unidade: "kg_ha" },
  cebola: { produto: "Cebola", unidade: "kg_ha" },
  alho: { produto: "Alho", unidade: "kg_ha" },
};

/** Normalização única: sem acento, minúsculo, só letras e números. */
const norm = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function j(url) {
  const r = await fetch(url, {
    headers: { accept: "application/json", "user-agent": USER_AGENT },
  });
  if (!r.ok) {
    // O SIDRA responde erro de limite em TEXTO PURO. Ler como JSON aqui
    // esconderia a mensagem que explica o problema.
    const corpo = await r.text().catch(() => "");
    throw new Error(`${r.status} em ${url}\n   corpo: ${corpo.slice(0, 200)}`);
  }
  return r.json();
}

/**
 * Converte o valor bruto do SIDRA em número ou null.
 *
 * "-" (zero absoluto), ".." (não se aplica), "..." (não disponível) e "X"
 * (sigilo) são AUSÊNCIA, cada um com um motivo diferente, e nenhum deles é
 * zero. Devolver 0 aqui inventaria rendimento em 307.658 municípios.
 */
function valor(v) {
  const bruto = String(v ?? "").trim();
  if (!/^[0-9]+([.,][0-9]+)?$/.test(bruto)) return null;
  const n = Number(bruto.replace(",", "."));
  // Zero não existe no universo real (mínimo medido: 3). Se aparecer, é bug.
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function main() {
  console.log("1/5 Lendo metadados da tabela", AGREGADO, "…");
  const meta = await j(META);

  const variavel = (meta.variaveis ?? []).find((v) => String(v.id) === VARIAVEL);
  if (!variavel) throw new Error(`variável ${VARIAVEL} sumiu da tabela ${AGREGADO}`);
  console.log(`    variável ${VARIAVEL}: ${variavel.nome} (${variavel.unidade})`);

  const classe = (meta.classificacoes ?? []).find((c) => String(c.id) === CLASSIFICACAO);
  if (!classe) throw new Error(`classificação ${CLASSIFICACAO} sumiu da tabela ${AGREGADO}`);

  const ano = String(meta.periodicidade?.fim ?? "");
  if (!/^\d{4}$/.test(ano)) throw new Error("não consegui ler o ano mais recente dos metadados");
  console.log(`    ano mais recente publicado: ${ano}`);

  // Nome exato → código. Sem aproximação: produto errado é número errado.
  const porNome = new Map(classe.categorias.map((c) => [c.nome, String(c.id)]));
  const alvos = [];
  const semPar = [];
  for (const [cultura, def] of Object.entries(DE_PARA)) {
    const codigo = porNome.get(def.produto);
    if (!codigo) {
      semPar.push(`${cultura} → "${def.produto}"`);
      continue;
    }
    const codigoAlternativo = def.produtoAlternativo ? porNome.get(def.produtoAlternativo) : null;
    if (def.produtoAlternativo && !codigoAlternativo) {
      semPar.push(`${cultura} (alternativo) → "${def.produtoAlternativo}"`);
      continue;
    }
    alvos.push({ cultura, codigo, codigoAlternativo: codigoAlternativo ?? null, ...def });
  }
  if (semPar.length > 0) {
    throw new Error(
      `produto não encontrado na classificação ${CLASSIFICACAO} (o IBGE renomeou?):\n   ` +
        semPar.join("\n   "),
    );
  }
  console.log(`    ${alvos.length} culturas com par inequívoco na PAM`);

  console.log("2/5 Lendo a lista de municípios do IBGE …");
  const municipios = await j(MUNICIPIOS_URL);
  const indice = {};
  for (const m of municipios) {
    const uf = m?.microrregiao?.mesorregiao?.UF?.sigla ?? m?.["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla;
    if (!uf || !m.id || !m.nome) continue;
    indice[`${uf}|${norm(m.nome)}`] = m.id;
  }
  console.log(`    ${Object.keys(indice).length} municípios indexados por (UF, nome normalizado)`);

  // Lote calculado, não constante mágica: o teto é de VALORES, e o número de
  // municípios muda quando o IBGE cria município.
  const nMunicipios = new Set(Object.values(indice)).size;
  const porLote = Math.max(1, Math.floor(LIMITE_VALORES / nMunicipios));
  // O teto da API é de VALORES, e valor se conta por PRODUTO pedido, não por
  // cultura: uma cultura com produto alternativo pede dois. Fatiar por cultura
  // estouraria o teto em silêncio no dia em que houvesse muitas delas.
  const lotes = [];
  let atual = [];
  let produtosNoLote = 0;
  for (const a of alvos) {
    const custo = a.codigoAlternativo ? 2 : 1;
    if (produtosNoLote + custo > porLote && atual.length > 0) {
      lotes.push(atual);
      atual = [];
      produtosNoLote = 0;
    }
    atual.push(a);
    produtosNoLote += custo;
  }
  if (atual.length > 0) lotes.push(atual);
  const totalProdutos = alvos.reduce((n, a) => n + (a.codigoAlternativo ? 2 : 1), 0);
  console.log(
    `3/5 Buscando rendimento: ${alvos.length} culturas / ${totalProdutos} produtos em ` +
      `${lotes.length} requisições (até ${porLote} produtos por vez; teto de ` +
      `${LIMITE_VALORES} valores / ${nMunicipios} municípios)`,
  );

  // Primeiro junta o cru por papel; a escolha entre principal e alternativo é
  // feita DEPOIS, com os dois na mão, município a município.
  const bruto = {};
  const rendimentos = {};
  const escoposPorMunicipio = {};
  let numericos = 0;
  let ausentes = 0;

  for (let i = 0; i < lotes.length; i++) {
    const lote = lotes[i];
    // Cada alvo pode pedir dois produtos (o principal e o alternativo), e o
    // papel de cada código precisa sobreviver à volta: é ele que decide qual
    // ressalva o município recebe.
    const codigos = lote.flatMap((a) => (a.codigoAlternativo ? [a.codigo, a.codigoAlternativo] : [a.codigo])).join(",");
    const porCodigo = new Map();
    for (const a of lote) {
      porCodigo.set(a.codigo, { cultura: a.cultura, alternativo: false });
      if (a.codigoAlternativo) porCodigo.set(a.codigoAlternativo, { cultura: a.cultura, alternativo: true });
    }
    const url =
      `https://apisidra.ibge.gov.br/values/t/${AGREGADO}/n6/all/v/${VARIAVEL}` +
      `/p/${ano}/c${CLASSIFICACAO}/${codigos}/f/c/h/n`;

    // try/catch POR LOTE: um lote que falhe não derruba os outros.
    try {
      const linhas = await j(url);
      for (const linha of linhas) {
        const cultura = porCodigo.get(String(linha.D4C));
        const ibge = String(linha.D1C ?? "");
        if (!cultura || !/^\d{7}$/.test(ibge)) continue;
        const v = valor(linha.V);
        if (v == null) {
          ausentes++;
          continue;
        }
        const papel = cultura.alternativo ? "alternativo" : "principal";
        ((bruto[cultura.cultura] ??= {})[ibge] ??= {})[papel] = v;
        numericos++;
      }
      console.log(`    ${i + 1}/${lotes.length} ok — ${lote.map((a) => a.cultura).join(", ")}`);
    } catch (e) {
      console.log(`    ${i + 1}/${lotes.length} FALHOU — ${lote.map((a) => a.cultura).join(", ")}`);
      console.log(`       ${e.message}`);
    }
  }

  // ── ESCOLHA ENTRE PRINCIPAL E ALTERNATIVO, MUNICÍPIO A MUNICÍPIO ─────────
  // O principal manda sempre que existe. O alternativo só entra onde o
  // principal falta, e nesse caso o município leva uma ressalva PRÓPRIA, para
  // a tela dizer qual das duas lavouras foi medida ali. Nunca se soma um com o
  // outro: são lavouras diferentes.
  const porAlvo = new Map(alvos.map((a) => [a.cultura, a]));
  let comAlternativo = 0;
  for (const [cultura, porMunicipio] of Object.entries(bruto)) {
    const def = porAlvo.get(cultura);
    for (const [ibge, papeis] of Object.entries(porMunicipio)) {
      if (papeis.principal != null) {
        (rendimentos[ibge] ??= {})[cultura] = papeis.principal;
      } else if (papeis.alternativo != null) {
        (rendimentos[ibge] ??= {})[cultura] = papeis.alternativo;
        if (def?.escopoAlternativo) {
          (escoposPorMunicipio[cultura] ??= {})[ibge] = def.escopoAlternativo;
          comAlternativo++;
        }
      }
    }
  }

  console.log(`4/5 ${numericos} valores numéricos; ${ausentes} ausências descartadas (nunca viram zero)`);
  if (comAlternativo > 0) console.log(`    ${comAlternativo} municípios ficaram com o produto ALTERNATIVO (ressalva própria)`);
  if (numericos === 0) throw new Error("nenhum valor numérico: não gravo arquivo vazio por cima do bom");

  const unidades = {};
  const sacas = {};
  const escopos = {};
  for (const a of alvos) {
    unidades[a.cultura] = a.unidade;
    if (a.sacaKg) sacas[a.cultura] = a.sacaKg;
    // O escopo é um CÓDIGO, não uma frase: a frase é copy de interface e mora
    // no componente, em PT e EN. Aqui só viaja o motivo.
    if (a.escopo) escopos[a.cultura] = a.escopo;
  }

  const saida = {
    fonte: "IBGE · Produção Agrícola Municipal (PAM), tabela 5457, variável 112",
    tabelaUrl: `https://sidra.ibge.gov.br/tabela/${AGREGADO}`,
    ano: Number(ano),
    geradoEm: new Date().toISOString().slice(0, 10),
    comoRegerar: "node scripts/ingest-rendimento-pam.mjs",
    unidades,
    sacasKg: sacas,
    escopos,
    escoposPorMunicipio,
    municipios: indice,
    rendimentos,
  };

  fs.writeFileSync(OUT, JSON.stringify(saida));
  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`5/5 Gravado ${OUT} (${kb} KB) — ${Object.keys(rendimentos).length} municípios com pelo menos uma cultura`);
}

main().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
