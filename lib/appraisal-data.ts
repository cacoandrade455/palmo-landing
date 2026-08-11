/**
 * Reference lease-value benchmarks (R$/ha/year) by land use and state.
 *
 * SOURCES (reauditoria geral 27/jul/2026 — manifesto em docs/fontes-jul2026.md):
 * - Grãos: guias de arrendamento 2026 (ContratoRural/InvestidorRural/Scot).
 *   Convenção vigente pós-aperto de margens 25/26: CO 8–14 sc de soja/ha/ano
 *   (picos 15–20 em terras top do Sul, herança da bonança 20/21–22/23);
 *   convertido a ~R$140/saca (CEPEA Paranaguá jul/2026). As faixas em R$
 *   abaixo (1.400–3.000 CO/Sul) seguem compatíveis com os guias 2026
 *   (R$1.800–3.500) — mantidas levemente conservadoras.
 * - Pecuária: guias 2026 (CompreRural): pasto formado CO R$400–900/ha/ano
 *   (1–2 @/ha); extensivo R$50–150 no piso. Faixa mantida conservadora.
 *   pecuaria_leite: SEM guia dedicado localizado na reauditoria jul/2026 —
 *   faixa ampla mantida como referência de baixa confiança (disclaimer na UI).
 * - Cana: fórmula t/ha × ATR × R$/kg (CNA). Pecege/Canaoeste: arrendamento
 *   médio SP R$2.217 (25/26) → projetado R$2.075 (26/27); Consecana-SP
 *   ~R$1,12/kg ATR 25/26 → ~R$1,02 26/27, viés de baixa. A média de mercado
 *   está no PISO da faixa SP; o teto 4.500 é só de região prime. Faixa
 *   AL/PE/PB sem confirmação específica em 2026 (mantida, baixa confiança).
 * - Silvicultura: guias 2026: eucalipto R$100–300 em áreas comuns; MS
 *   aquecido (efeito Arauco) chega a R$1.000–1.600/ha/ano. Faixa 200–700
 *   mantida de propósito (conservadora); o pico de MS é mercado seletivo.
 * - Solar: guias 2025/26 (Sunne/TabEnergia): R$1.000–5.000 média R$2.500,
 *   contratos de 20–25 anos até R$8.000 nos melhores pontos. Confirmado.
 * - Legal ceiling note: Estatuto da Terra caps rent at 15% of land value
 *   (30% for intensive high-yield zones).
 *
 * These are wide REFERENCE ranges, not appraisals. The UI must always show
 * the disclaimer.
 */

import { price } from "./prices";

// Live reference price (from lib/prices.json, refreshed monthly). Falls back
// to 140 if the price book is unavailable (CEPEA Paranaguá, média jul/2026).
export const SACA_SOJA_BRL = price("saca_soja") || 140;

type Range = { min: number; max: number; note?: "sacas" | "arroba" | "atr"; selective?: boolean };

// state groups
const SUL = ["PR", "SC", "RS"];
const CO = ["MT", "MS", "GO", "DF"];
const SUDESTE = ["SP", "MG", "RJ", "ES"];
const MATOPIBA = ["MA", "TO", "PI", "BA"];

function group(states: string[], range: Range): Record<string, Range> {
  return Object.fromEntries(states.map((s) => [s, range]));
}

/** purpose -> uf -> range; "default" is the national fallback (low confidence). */
const table: Record<string, Record<string, Range>> = {
  graos: {
    MT: { min: 1400, max: 3000, note: "sacas" },
    ...group(["GO", "MS", "DF"], { min: 1400, max: 2600, note: "sacas" }),
    ...group(SUL, { min: 1800, max: 3000, note: "sacas" }),
    ...group(["SP", "MG"], { min: 1400, max: 2600, note: "sacas" }),
    ...group(MATOPIBA, { min: 1200, max: 2400, note: "sacas" }),
    default: { min: 800, max: 2000, note: "sacas" },
  },
  pecuaria_corte: {
    ...group([...CO, "SP", "MG"], { min: 300, max: 800, note: "arroba" }),
    ...group(SUL, { min: 300, max: 700, note: "arroba" }),
    default: { min: 80, max: 400, note: "arroba" },
  },
  pecuaria_leite: {
    ...group([...SUL, "MG", "SP", "GO"], { min: 300, max: 800 }),
    default: { min: 150, max: 500 },
  },
  cana: {
    SP: { min: 2000, max: 4500, note: "atr" },
    ...group(["GO", "MS", "MG", "PR"], { min: 1500, max: 3500, note: "atr" }),
    ...group(["AL", "PE", "PB"], { min: 1000, max: 2500, note: "atr" }),
  },
  silvicultura: {
    ...group(["SP", "MG", "PR", "SC", "RS", "BA", "ES", "MS"], {
      min: 200,
      max: 700,
    }),
    default: { min: 150, max: 500 },
  },
  reflorestamento_carbono: {
    // Crédito de carbono (reescrito na reauditoria jul/2026 — a justificativa
    // antiga "140 créditos/ha/ANO" confundia estoque acumulado com fluxo anual):
    // sequestro real 5–15 tCO2e/ha/ano em projetos ARR/regenerativos
    // (Aegro/McKinsey 2025-26) × mercado voluntário R$50–200/tCO2e (ARR
    // US$20–38) ≈ R$1.500–5.250/ha/ano — a MESMA faixa, agora com a conta
    // defensável. Floresta nativa estoca 100–200 tCO2e/ha ACUMULADO em décadas.
    // Requer certificação (Verra/Gold Standard) e projeto de anos — não é renda passiva.
    // selective: mercado que depende de certificação e comprador, como solar.
    default: { min: 1500, max: 5250, selective: true },
  },
  energia_solar: {
    ...group([...SUDESTE, ...CO, ...SUL, "BA", "CE", "RN", "PB", "PE", "PI"], {
      min: 1500,
      max: 6000,
      selective: true,
    }),
    default: { min: 1000, max: 5000, selective: true },
  },
};

/**
 * Crop-level overrides where a specific crop has its own lease market,
 * distinct from its category benchmark.
 * - arroz irrigado (RS/SC): a referência atual de mercado é % da produção
 *   (terra + água = 20–35% da safra, IRGA); a convenção em sacas usada aqui
 *   (~15–25 sc/ha × R$95–115/sc, CEPEA/IRGA 2026) é aproximada e produz a
 *   mesma faixa em R$. Reauditoria jul/2026: faixa compatível, mantida.
 */
const cropOverrides: Record<string, Record<string, Range>> = {
  arroz: {
    RS: { min: 1500, max: 2700 },
    SC: { min: 1500, max: 2700 },
  },
};

/**
 * Crop-specific LAND VALUE references (R$/ha) from market/sector sources,
 * converted to lease equivalents at 2.5%–6%/year — used when a specific
 * crop is selected and no direct lease benchmark exists.
 *
 * SOURCES per entry (add new crops WITH a source, never from memory):
 * - cacau/BA: formed cocoa farms in southern Bahia listed at
 *   R$10.000–60.000/ha (sector portals e.g. tudosobrecacau.com.br and
 *   MF Rural listings, 2026).
 */
export type CropLandRef = {
  landMin: number;
  landMax: number;
  sourceNote: string;
};

const cropLandRefs: Record<string, Record<string, CropLandRef>> = {
  cacau: {
    BA: {
      landMin: 10000,
      landMax: 60000,
      sourceNote: "terras de cacau no sul da Bahia (anúncios e portais do setor)",
    },
  },
};

const REF_LOW = 0.025;
const REF_HIGH = 0.06;

/**
 * FORMED-CROP revenue references: gross revenue (faturamento) per hectare
 * for a producing plantation, leased at the regional convention of ~15% of
 * revenue. This is a DIFFERENT market from bare land: it assumes the crop
 * is planted, mature and producing.
 *
 * SOURCES (field-sourced — add new entries WITH a source):
 * - banana/BA: ~R$44k/ha/ano gross on producing farms (grower reference,
 *   southern Bahia, jul/2026); range widened for productivity variation.
 * - cacau/BA: 60–150 arrobas/ha on productive farms × ~R$380/@ (spot,
 *   jul/2026) = R$22.8k–57k/ha gross (grower reference, southern Bahia).
 * - mamao: IBGE PAM 2024 — rendimento médio nacional R$77,6 mil/ha
 *   (41,5 t/ha); ES lidera em volume, R$119,4 mil/ha (59,1 t/ha); CE tem o
 *   maior R$/ha, R$125,5 mil (71,3 t/ha); BA R$46,7 mil/ha (35,9 t/ha);
 *   RN é o 4º produtor, R$65,0 mil/ha (39,3 t/ha). Incaper/CNA no ES.
 *   CNA Campo Futuro rodou painéis de mamão em Itamaraju/Prado-BA (mar/2026).
 * - maracuja: IBGE PAM 2024 — rendimento médio nacional R$54,3 mil/ha
 *   (15,6 t/ha); BA maior produtora (36% da produção) com 13,5 t/ha;
 *   CE 24,2 t/ha e R$103,9 mil/ha (Embrapa/IBGE).
 * - coco: coqueiro-anão irrigado 20–40 mil frutos/ha (BNB/ETENE 2021,
 *   Embrapa, CNA) × R$0,60–1,40/fruto (ETENE; APROCOCO 2024+).
 * - acai: terra firme plantado/irrigado 8–13 t/ha (Embrapa/Sedap-PA,
 *   cv. BRS Pai d'Égua) × ~R$4,5 mil/t (IBGE PAM 2024: R$7,77 bi /
 *   1,74 mi t ≈ R$4,46/kg; média PA 6,5 t/ha, R$29,9 mil/ha).
 *   Várzea manejada (~4–5 t/ha) é mercado extrativista distinto.
 * - goiaba: rendimento médio nacional ~R$60,3 mil/ha, ~24,2 t/ha; PR tem o
 *   maior R$/ha, R$106,2 mil (30,2 t/ha) e PE é a maior em valor
 *   (IBGE PAM 2024 / Embrapa).
 * - abacate: ~16,9 t/ha e ~R$45,7 mil/ha médio; SP+MG = 61% do faturamento
 *   (IBGE PAM 2024); avocado de exportação no topo.
 * - maca: SC R$99,0 mil/ha e 29,0 t/ha; PR R$109,9 mil/ha; RS R$90,9 mil/ha
 *   (IBGE PAM 2024); São Joaquim/SC = 25% da produção e 27% da área
 *   nacional; SC+RS+PR = 98% do valor.
 * - caju: castanha em casca R$5,50/kg ao produtor no CE (CONAB mar/2026);
 *   cajueiral tradicional 300–500 kg/ha; clonal adensado até 1.606 kg/ha
 *   (Embrapa). CE = 55,3% da produção nacional; PI 23% (CONAB 2026).
 */
const REVENUE_SHARE = 0.15;

type FormedCropRef = {
  revMin: number;
  revMax: number;
  sourceNote: string;
};

const formedCropRefs: Record<string, Record<string, FormedCropRef>> = {
  banana: {
    BA: {
      revMin: 35000,
      revMax: 45000,
      sourceNote:
        "produtores do sul da Bahia (2026): fazenda formada; a média censitária da BA é R$25,2 mil/ha (IBGE PAM 2024, inclui bananal não tecnificado)",
    },
    default: {
      revMin: 25000,
      revMax: 45000,
      sourceNote:
        "fruticultura formada (IBGE PAM 2024: média nacional R$34,2 mil/ha; SP irrigada R$47,5 mil/ha)",
    },
  },
  cacau: (() => {
    const p = price("arroba_cacau") || 310;
    const rev = { revMin: Math.round(60 * p), revMax: Math.round(150 * p) };
    const note = `sul da Bahia: 60–150 @/ha (lavoura tecnificada/clonada; a média censitária da BA é ~21 @/ha, IBGE PAM 2024; CEPLAC leva assistidos a 90–200 @/ha) × R$${p}/@ (spot jul/2026, muito volátil)`;
    return {
      BA: { ...rev, sourceNote: note },
      default: { ...rev, sourceNote: note },
    };
  })(),
  cafe: (() => {
    const p = price("saca_cafe_arabica") || 1700;
    const rev = { revMin: Math.round(25 * p), revMax: Math.round(45 * p) };
    const note = `cafeicultura formada: 25–45 sc/ha (CONAB 2º lev. 2026: média nacional 34,4 sc/ha na safra recorde; teto = irrigado de cerrado) × R$${p}/sc (CEPEA)`;
    return {
      MG: { ...rev, sourceNote: note },
      SP: { ...rev, sourceNote: note },
      ES: { ...rev, sourceNote: note },
      default: { ...rev, sourceNote: note },
    };
  })(),
  citros: (() => {
    const p = price("caixa_laranja") || 31;
    const rev = { revMin: Math.round(650 * p), revMax: Math.round(950 * p) };
    const note = `citricultura formada (Fundecitrus: 687 cx/ha em 24/25 e 869 cx/ha em 25/26; safra 26/27 estimada em queda de 12,9%): 650–950 cx/ha × R$${p}/cx (CEPEA indústria)`;
    return {
      SP: { ...rev, sourceNote: note },
      MG: { ...rev, sourceNote: note },
      default: { ...rev, sourceNote: note },
    };
  })(),
  manga: (() => {
    // Reauditoria jul/2026: fallback antigo de R$0,55/kg subestimava a receita
    // em 3–5× contra o preço médio REALIZADO da PAM 2024 (BA ~R$2,41/kg,
    // PE ~R$1,15/kg); o multiplicador 1.6 de "pico de exportação" saiu junto —
    // com preço médio realista a faixa 20–30 t/ha × preço já abraça a média
    // censitária (BA R$55,3 mil/ha; PE R$31,9 mil/ha; PAM 2024).
    const p = price("kg_manga") || 2; // R$/kg (média anual; spot jul/2026 R$3,7–4,2 é entressafra)
    const rev = { revMin: Math.round(20 * 1000 * p), revMax: Math.round(30 * 1000 * p) };
    const note = `manga formada Vale do São Francisco (Embrapa: ~28 t/ha média do Vale): 20–30 t/ha × ~R$${p.toFixed(2)}/kg (média anual realizada, PAM 2024/CEPEA; preço muito volátil na entressafra)`;
    return {
      BA: { ...rev, sourceNote: note },
      PE: { ...rev, sourceNote: note },
      default: { ...rev, sourceNote: note },
    };
  })(),
  uva: {
    // uva de mesa irrigada (Vale do São Francisco / Nordeste): alta receita, alto custo
    BA: {
      revMin: 120000,
      revMax: 280000,
      sourceNote:
        "viticultura de mesa irrigada do Vale do São Francisco (IBGE PAM 2024: BA 31,8 t/ha e R$270,7 mil/ha)",
    },
    PE: {
      revMin: 120000,
      revMax: 280000,
      sourceNote:
        "viticultura de mesa irrigada do Vale do São Francisco (IBGE PAM 2024: PE 49,8 t/ha e R$284,0 mil/ha)",
    },
    default: {
      revMin: 30000,
      revMax: 80000,
      sourceNote: "viticultura de mesa irrigada (varia muito por região e cultivar)",
    },
  },
  mamao: {
    // mamoicultura formada (ciclo ~2 anos): rendimento médio nacional
    // R$77,6 mil/ha (41,5 t/ha); ES lidera em volume e CE em R$/ha (PAM 2024)
    ES: {
      revMin: 60000,
      revMax: 130000,
      sourceNote:
        "mamoicultura ES (IBGE PAM 2024: 59,1 t/ha e R$119,4 mil/ha; Incaper)",
    },
    BA: {
      revMin: 35000,
      revMax: 80000,
      sourceNote:
        "mamoicultura BA (IBGE PAM 2024: 35,9 t/ha e R$46,7 mil/ha; painéis CNA Itamaraju/Prado 2026)",
    },
    CE: {
      revMin: 70000,
      revMax: 140000,
      sourceNote:
        "mamoicultura irrigada (IBGE PAM 2024: CE lidera produtividade, 71,3 t/ha e R$125,5 mil/ha)",
    },
    RN: {
      revMin: 40000,
      revMax: 90000,
      sourceNote:
        "mamoicultura irrigada (IBGE PAM 2024: RN 4º produtor, 39,3 t/ha e R$65,0 mil/ha)",
    },
    default: {
      revMin: 40000,
      revMax: 100000,
      sourceNote:
        "mamoicultura formada (IBGE PAM 2024: média nacional R$77,6 mil/ha, 41,5 t/ha)",
    },
  },
  maracuja: {
    // ciclo de ~1,5–2 anos; rendimento médio nacional R$54,3 mil/ha (IBGE).
    // Reauditoria jul/2026: piso da BA baixado de 35k para 30k — a média
    // censitária baiana é R$31,8 mil/ha (PAM 2024) e o piso não deve ficar
    // acima dela. Fato novo da PAM 2024: o CE ultrapassou a BA em VALOR de
    // produção (R$691 mi vs R$620 mi); a BA segue maior em volume.
    BA: {
      revMin: 30000,
      revMax: 60000,
      sourceNote:
        "maior produtora nacional em volume (36%), 13,5 t/ha e média de R$31,8 mil/ha (IBGE PAM 2024; polos Livramento/Dom Basílio)",
    },
    CE: {
      revMin: 45000,
      revMax: 80000,
      sourceNote:
        "maracujá irrigado CE, 24,2 t/ha e R$103,9 mil/ha (IBGE PAM 2024; Embrapa)",
    },
    default: {
      revMin: 30000,
      revMax: 70000,
      sourceNote:
        "maracujá formado (IBGE PAM 2024: média nacional R$54,3 mil/ha, 15,6 t/ha)",
    },
  },
  coco: (() => {
    // coqueiro-anão irrigado p/ coco verde: 20–40 mil frutos/ha (BNB/ETENE,
    // Embrapa) × preço vivo do fruto (lib/prices.json)
    const p = price("fruto_coco") || 1.0;
    const note = `coqueiro-anão irrigado (BNB/ETENE, Embrapa): 20–40 mil frutos/ha × R$${p.toFixed(2)}/fruto`;
    const ne = { revMin: Math.round(20000 * p), revMax: Math.round(40000 * p), sourceNote: note };
    return {
      ...group2(["CE", "BA", "PE", "RN", "SE", "AL"], ne),
      default: {
        revMin: Math.round(15000 * p),
        revMax: Math.round(40000 * p),
        sourceNote: `coqueiral anão formado × R$${p.toFixed(2)}/fruto (BNB/ETENE; preço APROCOCO)`,
      },
    };
  })(),
  acai: (() => {
    // terra firme plantado: 8–13 t/ha (Embrapa/Sedap-PA) × preço vivo do kg
    const p = price("kg_acai") || 3.6;
    return {
      PA: {
        revMin: Math.round(8000 * p),
        revMax: Math.round(13000 * p),
        sourceNote: `açaí plantado em terra firme (Embrapa/Sedap-PA): 8–13 t/ha × R$${p.toFixed(2)}/kg`,
      },
      default: {
        revMin: 15000,
        revMax: 40000,
        sourceNote: "açaí plantado em terra firme (Embrapa); várzea manejada é mercado à parte",
      },
    };
  })(),
  goiaba: {
    PR: {
      revMin: 80000,
      revMax: 130000,
      sourceNote:
        "goiabicultura PR: R$106,2 mil/ha de rendimento médio, 30,2 t/ha (IBGE PAM 2024)",
    },
    default: {
      revMin: 35000,
      revMax: 90000,
      sourceNote:
        "goiabicultura: média nacional ~R$60,3 mil/ha, ~24,2 t/ha; PE é a maior produtora em valor (IBGE PAM 2024/Embrapa)",
    },
  },
  abacate: {
    // Reauditoria jul/2026: a nota de SP usava os números NACIONAIS como se
    // fossem estaduais; corrigida para os da UF (PAM 2024: SP 15,6 t/ha e
    // R$37,1 mil/ha) e o piso baixado de 40k para 35k para não ficar acima
    // da média censitária paulista.
    SP: {
      revMin: 35000,
      revMax: 80000,
      sourceNote:
        "abacaticultura SP: 15,6 t/ha e R$37,1 mil/ha médio na UF (IBGE PAM 2024); avocado de exportação no topo",
    },
    MG: {
      revMin: 40000,
      revMax: 80000,
      sourceNote:
        "abacaticultura MG: SP+MG = 61% do faturamento nacional (IBGE PAM 2024)",
    },
    default: {
      revMin: 30000,
      revMax: 70000,
      sourceNote: "abacaticultura: ~16,9 t/ha, ~R$45,7 mil/ha médio (IBGE PAM 2024)",
    },
  },
  maca: {
    SC: {
      revMin: 70000,
      revMax: 120000,
      sourceNote:
        "pomares de SC: R$99,0 mil/ha médio, 29,0 t/ha (IBGE PAM 2024); São Joaquim = 25% da produção nacional",
    },
    PR: {
      revMin: 75000,
      revMax: 130000,
      sourceNote: "pomares do PR: R$109,9 mil/ha médio, 28,0 t/ha (IBGE PAM 2024)",
    },
    RS: {
      revMin: 65000,
      revMax: 115000,
      sourceNote: "pomares do RS: R$90,9 mil/ha médio, 31,8 t/ha (IBGE PAM 2024)",
    },
    default: {
      revMin: 30000,
      revMax: 80000,
      sourceNote:
        "macieiras do Sul (IBGE PAM 2024): SC/RS/PR fazem 98% do valor da produção",
    },
  },
  caju: (() => {
    // faixa larga de propósito: cajueiral velho rende pouco; renovado com
    // clones (Embrapa) multiplica por 3–5×. Preço vivo da castanha (CONAB).
    const p = price("kg_castanha_caju") || 5.5;
    const ref = {
      revMin: Math.round(300 * p),
      revMax: Math.round(1600 * p),
      sourceNote: `cajueiral: 300 kg/ha (tradicional) a 1.600 kg/ha (clonal, Embrapa) × R$${p.toFixed(2)}/kg de castanha (CONAB)`,
    };
    return { ...group2(["CE", "PI", "RN"], ref), default: ref };
  })(),
  // pessego: modelo ADICIONADO na reauditoria jul/2026 — a lacuna anterior era
  // deliberada, mas a PAM 2024 (SIDRA t.1613) dá base defensável por UF:
  // Brasil R$47,8 mil/ha (12,4 t/ha); RS R$34,0 mil/ha (10,9 t/ha, 65% do
  // volume, polo de Pelotas); SC R$51,4 mil/ha; PR R$59,2 mil/ha; SP R$123,9
  // mil/ha (21,2 t/ha — pêssego de mesa perto do mercado, área pequena).
  pessego: {
    RS: {
      revMin: 25000,
      revMax: 45000,
      sourceNote:
        "pessegocultura RS (IBGE PAM 2024: 10,9 t/ha e R$34,0 mil/ha; polo de Pelotas, 65% do volume nacional)",
    },
    SC: {
      revMin: 35000,
      revMax: 65000,
      sourceNote: "pomares de SC (IBGE PAM 2024: 12,6 t/ha e R$51,4 mil/ha)",
    },
    SP: {
      revMin: 80000,
      revMax: 140000,
      sourceNote:
        "pêssego de mesa SP (IBGE PAM 2024: 21,2 t/ha e R$123,9 mil/ha; área pequena, perto do mercado)",
    },
    default: {
      revMin: 30000,
      revMax: 80000,
      sourceNote: "pessegocultura formada (IBGE PAM 2024: média nacional R$47,8 mil/ha, 12,4 t/ha)",
    },
  },
  // GENGIBRE segue deliberadamente SEM modelo (busca documentada na
  // reauditoria jul/2026): produtividade tem fonte boa (ES maior produtor,
  // média 50,9 t/ha — SEAG-ES/Incaper), mas NÃO existe série oficial de preço
  // ao produtor (ausente da PAM/classificação c81; sem indicador CEPEA/CONAB/
  // CEASA consolidado). O farmgate documentado oscilou R$0,57–1,57/kg entre
  // anos (boom-bust de exportação) — a receita implícita variaria de ~R$9 mil
  // a ~R$90 mil/ha, banda inútil para decisão. Sem preço defensável, sem modelo.
};

/** group() for formed-crop refs (same idea, different value type). */
function group2(
  states: string[],
  ref: FormedCropRef,
): Record<string, FormedCropRef> {
  return Object.fromEntries(states.map((s) => [s, ref]));
}

export type FormedLeaseRef = {
  minPerHa: number;
  maxPerHa: number;
  /** gross revenue range the lease derives from — shown so the math is auditable */
  revMin: number;
  revMax: number;
  sourceNote: string;
};

export function formedCropLeaseRef(crop: string, uf: string): FormedLeaseRef | null {
  const r = formedCropRefs[crop]?.[uf] ?? formedCropRefs[crop]?.default;
  if (!r) return null;
  return {
    minPerHa: Math.round(r.revMin * REVENUE_SHARE),
    maxPerHa: Math.round(r.revMax * REVENUE_SHARE),
    revMin: r.revMin,
    revMax: r.revMax,
    sourceNote: r.sourceNote,
  };
}

export type CropLeaseRef = {
  minPerHa: number;
  maxPerHa: number;
  landMin: number;
  landMax: number;
  sourceNote: string;
};

export function cropLandLeaseRef(crop: string, uf: string): CropLeaseRef | null {
  const r = cropLandRefs[crop]?.[uf] ?? cropLandRefs[crop]?.default;
  if (!r) return null;
  return {
    minPerHa: Math.round(r.landMin * REF_LOW),
    maxPerHa: Math.round(r.landMax * REF_HIGH),
    landMin: r.landMin,
    landMax: r.landMax,
    sourceNote: r.sourceNote,
  };
}

export type Estimate =
  | {
      kind: "range";
      minPerHa: number;
      maxPerHa: number;
      note?: Range["note"];
      /** true when the range came from the national default, not a surveyed state range */
      fallback?: boolean;
    }
  | { kind: "consult" };

export function estimateLease(
  purpose: string,
  uf: string,
  crop?: string,
): Estimate {
  if (crop) {
    const byUf = cropOverrides[crop];
    const own = byUf?.[uf];
    const r = own ?? byUf?.default;
    if (r) return { kind: "range", minPerHa: r.min, maxPerHa: r.max, note: r.note, fallback: !own };
  }
  const byUf = table[purpose];
  if (!byUf) return { kind: "consult" };
  const own = byUf[uf];
  const r = own ?? byUf.default;
  if (!r) return { kind: "consult" };
  return { kind: "range", minPerHa: r.min, maxPerHa: r.max, note: r.note, fallback: !own };
}

export type UseComparison = {
  purpose: string;
  minPerHa: number;
  maxPerHa: number;
  /** midpoint used for ranking */
  mid: number;
  /** opportunistic markets (e.g. solar): real prices, but site-dependent demand */
  selective: boolean;
  /** true when the range came from the national default, not a surveyed state range */
  fallback: boolean;
};

/**
 * All benchmarked uses for a UF, ranked by midpoint value (highest first).
 * Only uses with actual regional/fallback data are included — uses without
 * defensible benchmarks never appear in comparisons. Selective markets are
 * flagged so the UI can annotate them and keep them out of headline
 * recommendations.
 */
export function compareUses(uf: string): UseComparison[] {
  const out: UseComparison[] = [];
  for (const [purpose, byUf] of Object.entries(table)) {
    const own = byUf[uf];
    const r = own ?? byUf.default;
    if (!r) continue;
    out.push({
      purpose,
      minPerHa: r.min,
      maxPerHa: r.max,
      mid: (r.min + r.max) / 2,
      selective: !!r.selective,
      fallback: !own,
    });
  }
  return out.sort((a, b) => b.mid - a.mid);
}

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
