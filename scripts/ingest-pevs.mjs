/**
 * PALMO — Ingestão PEVS (preço médio ao produtor do extrativismo)
 *
 * Lê a tabela 289 do SIDRA/IBGE (Quantidade e Valor da produção na extração
 * vegetal, por tipo de produto extrativo), calcula o preço médio ao produtor
 * (valor ÷ quantidade = R$/kg) por MUNICÍPIO, UF e Brasil para os produtos do
 * dropdown Extrativismo, e grava lib/pevs.json.
 *
 * ── COMO RODAR (local — o SIDRA não abre no sandbox) ─────────────────────
 *   node scripts/ingest-pevs.mjs
 *
 * Rodar 1x agora e depois 1x/ano (a PEVS é anual, sai em setembro).
 * O script é autodescobridor: busca os códigos dos produtos pelo NOME nos
 * metadados da tabela — se o IBGE renumerar, continua funcionando. Cada
 * produto tem try/catch próprio: se um falhar, os outros entram mesmo assim.
 * Se algo der errado, cole a saída completa no chat.
 */

import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "lib", "pevs.json");
const AGREGADO = "289"; // PEVS — extração vegetal: quantidade e valor por produto
const META = `https://servicodados.ibge.gov.br/api/v3/agregados/${AGREGADO}/metadados`;
const UFS_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/estados";

// produtos do dropdown → termos de busca no nome oficial do SIDRA
const PRODUTOS = {
  carnauba: { label: "Carnaúba (pó)", termos: ["carnaúba", "pó"] },
  babacu: { label: "Babaçu (amêndoa)", termos: ["babaçu"] },
  pinhao: { label: "Pinhão", termos: ["pinhão"] },
  castanha_amazonia: { label: "Castanha-do-pará", termos: ["castanha-do-pará"] },
  piacava: { label: "Piaçava", termos: ["piaçava"] },
  pequi: { label: "Pequi", termos: ["pequi"] },
  mangaba: { label: "Mangaba", termos: ["mangaba"] },
  licuri: { label: "Licuri", termos: ["licuri"] },
  umbu: { label: "Umbu", termos: ["umbu"] },
  // baru não consta na PEVS — fica de fora de propósito
};

const norm = (s) =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

async function j(url) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`${r.status} em ${url}`);
  return r.json();
}

function num(v) {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function main() {
  console.log("1/4 Lendo metadados da tabela", AGREGADO, "…");
  const meta = await j(META);

  // variáveis: quantidade (toneladas) e valor (mil reais) — achadas pelo nome
  const vars = meta.variaveis ?? [];
  const vQtd = vars.find((v) => norm(v.nome).includes("quantidade"));
  const vVal = vars.find((v) => norm(v.nome).includes("valor"));
  if (!vQtd || !vVal) throw new Error("variáveis de quantidade/valor não encontradas");
  console.log(`   quantidade=${vQtd.id} (${vQtd.nome}) | valor=${vVal.id} (${vVal.nome})`);

  // classificação de produto + códigos por nome
  const clas = (meta.classificacoes ?? []).find((c) => norm(c.nome).includes("produto"));
  if (!clas) throw new Error("classificação de produto não encontrada");
  const cats = clas.categorias ?? [];
  const codigoDe = {};
  for (const [key, p] of Object.entries(PRODUTOS)) {
    const hit = cats.find((c) => p.termos.every((t) => norm(c.nome).includes(norm(t))));
    if (hit) {
      codigoDe[key] = hit.id;
      console.log(`   ✓ ${p.label} → código ${hit.id} ("${hit.nome}")`);
    } else {
      console.log(`   ✗ ${p.label}: não encontrado nos metadados (segue sem ele)`);
    }
  }

  console.log("2/4 Lendo UFs…");
  const ufs = await j(UFS_URL); // [{id, sigla, nome}]

  const base = (nivel, produtoCod) =>
    `https://servicodados.ibge.gov.br/api/v3/agregados/${AGREGADO}/periodos/-1/variaveis/${vQtd.id}|${vVal.id}?localidades=${nivel}&classificacao=${clas.id}[${produtoCod}]`;

  // extrai {localidadeNome -> {qtd, val}, periodo} de uma resposta v3
  function extrai(payload) {
    const out = {};
    let periodo = "";
    for (const varBlock of payload) {
      const isQtd = String(varBlock.id) === String(vQtd.id);
      for (const res of varBlock.resultados ?? []) {
        for (const serie of res.series ?? []) {
          const nome = serie.localidade?.nome ?? "";
          const s = serie.serie ?? {};
          const per = Object.keys(s)[0];
          if (per) periodo = per;
          const v = num(s[per]);
          if (v == null) continue;
          out[nome] = out[nome] || {};
          out[nome][isQtd ? "qtd" : "val"] = v;
        }
      }
    }
    return { dados: out, periodo };
  }

  // preço R$/kg = (valor em MIL R$ × 1000) / (quantidade em TONELADAS × 1000)
  const preco = (d) => (d?.qtd && d?.val ? +(d.val / d.qtd).toFixed(2) : null);

  const products = {};
  console.log("3/4 Baixando dados por produto…");
  for (const [key, cod] of Object.entries(codigoDe)) {
    const p = PRODUTOS[key];
    try {
      // Brasil (N1) + UFs (N3)
      const br = extrai(await j(base("N1[all]", cod)));
      const porUf = extrai(await j(base("N3[all]", cod)));
      const byUf = {};
      for (const uf of ufs) {
        const d = porUf.dados[uf.nome];
        const pr = preco(d);
        if (pr) byUf[uf.sigla] = pr;
      }
      // Municípios: uma chamada por UF que tem preço (mantém as chamadas leves)
      const byMuni = {};
      for (const uf of ufs) {
        if (!byUf[uf.sigla]) continue;
        try {
          const m = extrai(await j(base(`N6[N3[${uf.id}]]`, cod)));
          for (const [nome, d] of Object.entries(m.dados)) {
            const pr = preco(d);
            // SIDRA devolve "Granja - CE" — remove o sufixo para casar com o
            // nome do dropdown (IBGE localidades): chave final "Granja (CE)"
            const nomeLimpo = nome.replace(/\s*-\s*[A-Z]{2}$/, "");
            if (pr) byMuni[`${nomeLimpo} (${uf.sigla})`] = pr;
          }
        } catch (e) {
          console.log(`     … municípios de ${uf.sigla} falharam (${e.message}) — segue`);
        }
      }
      const national = preco(br.dados["Brasil"]);
      products[key] = {
        label: p.label,
        year: br.periodo || porUf.periodo || "",
        ...(national ? { national } : {}),
        byUf,
        byMuni,
      };
      console.log(
        `   ✓ ${p.label}: BR ${national ?? "-"} R$/kg | ${Object.keys(byUf).length} UFs | ${Object.keys(byMuni).length} municípios (PEVS ${products[key].year})`,
      );
    } catch (e) {
      console.log(`   ✗ ${p.label} falhou por completo: ${e.message} — segue sem ele`);
    }
  }

  console.log("4/4 Gravando", OUT, "…");
  fs.writeFileSync(
    OUT,
    JSON.stringify({ updatedAt: new Date().toISOString().slice(0, 10), products }, null, 2),
  );
  console.log(`✅ ${Object.keys(products).length} produtos gravados.`);
  console.log('Next: git add -A && git commit -m "dados PEVS de preco ao produtor" && git push');
}

main().catch((e) => {
  console.error("Ingestão PEVS falhou:", e);
  process.exit(1);
});
