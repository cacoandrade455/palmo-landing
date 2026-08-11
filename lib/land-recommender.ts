/**
 * Land-use RECOMMENDER — the inversion of the /quanto-vale calculator.
 *
 * The calculator asks "I want crop X, what is it worth?". This engine asks the
 * opposite: "here is my LAND (uf, municipality, water, hectares) — which uses
 * does my region actually, provably do, ranked by potential?".
 *
 * GOLDEN RULE (inherited from the calculator): a recommendation without a
 * regional base does NOT enter. The only signal of "your region is strong at
 * this" is `stateAdvantages` (lib/state-advantage.ts). If the UF has no
 * registered advantage at all, we DO NOT fabricate a ranking — we return
 * `weakSignal: true` and let the UI say so honestly.
 *
 * This engine is PURE (no UI) and only READS + COMBINES three existing data
 * layers — it never invents crops, prices or facts:
 *   - lib/state-advantage.ts  → the regional-vocation signal (+ sourced fact)
 *   - lib/appraisal-data.ts   → the R$/ha income range + provenance
 *   - lib/content.ts          → the crop→purpose grouping and value/label pairs
 *
 * It is NOT an AI agronomist: no soil, pH, altitude or micro-climate analysis.
 * It is a REGIONAL-VOCATION RANKER, honest about being exactly that.
 */

import {
  compareUses,
  estimateLease,
  formedCropLeaseRef,
} from "./appraisal-data";
import { stateAdvantages } from "./state-advantage";
import {
  REGIOES,
  retratoPorMunicipio,
  type RegiaoRetrato,
} from "./regioes-agricolas";
import { content } from "./content";

export type WaterFit = "needsIrrigation" | "rainfed_ok" | "neutral";
export type Moisture = "humid" | "dry" | "unknown";

export type RecommendInput = {
  uf: string;
  municipality?: string;
  /** owner has (or can secure) a water source for irrigation */
  water: boolean;
  /** optional — only used by the UI for the total-per-area line and the CTA */
  hectares?: number;
  /**
   * Restrict the ranking to the municipality's CURATED micro-region vocations
   * (lib/regioes-agricolas.ts). Default true. Pass false only where a broad
   * UF-level fact index is wanted instead of a ranking.
   */
  scopeToRegion?: boolean;
  /**
   * Curated region already resolved by the caller (a key of REGIOES). The UI
   * resolves município→mesorregião against the LIVE IBGE API to draw the
   * regional portrait; passing that same key here makes the ranking use the
   * exact region the portrait shows, instead of re-deriving it from the
   * offline map. Unknown keys (e.g. a biome fallback like "caatinga") are
   * ignored and the offline resolution takes over.
   */
  regionKey?: string;
};

export type Recommendation = {
  rank: number;
  /** empty for purpose-only entries (e.g. sugarcane) */
  cropValue: string;
  /** valid calculator purpose value + crop-group key (drives the CTA prefill) */
  purpose: string;
  cropLabelPt: string;
  cropLabelEn: string;
  waterFit: WaterFit;
  /** true when the water/region condition makes this a poor fit right now */
  demoted: boolean;
  scoreReasonPt: string;
  scoreReasonEn: string;
  /** the sourced regional fact that justifies the recommendation */
  regionalFactPt: string;
  regionalFactEn: string;
  waterWarningPt?: string;
  waterWarningEn?: string;
  /** lease income range R$/ha/year (the "renda por hectare/ano") */
  incomeMinPerHa?: number;
  incomeMaxPerHa?: number;
  /** true when the income range fell back to a broad national reference */
  incomeFallback?: boolean;
  /** gross revenue the lease derives from (formed-crop models only) */
  revMin?: number;
  revMax?: number;
  /** provenance of the income range (formed-crop models only) */
  sourceNote?: string;
  /** the use is a proven regional vocation for this UF (drives the badge) */
  regionalStrong: boolean;
};

export type KnownUse = {
  purpose: string;
  labelPt: string;
  labelEn: string;
  incomeMinPerHa: number;
  incomeMaxPerHa: number;
  selective: boolean;
  fallback: boolean;
};

export type RecommendResult =
  | {
      weakSignal: false;
      uf: string;
      municipality: string;
      moisture: Moisture;
      recommendations: Recommendation[];
    }
  | {
      weakSignal: true;
      uf: string;
      municipality: string;
      /** the few uses that at least have a market range, for an honest fallback */
      known: KnownUse[];
    };

// ---------------------------------------------------------------------------
// Crop → purpose grouping, read straight from lib/content.ts (never edited).
// e.g. "cacau" → "lavoura_permanente", "banana" → "fruticultura". Purpose-level
// advantage keys ("graos", "cana") are not crop values, so they map to
// themselves.
// ---------------------------------------------------------------------------
const CROP_PURPOSE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const [purpose, list] of Object.entries(content.pt.appraiser.crops)) {
    for (const c of list) m[c.value] = purpose;
  }
  return m;
})();

function labelFor(
  cropValue: string,
  purpose: string,
  lang: "pt" | "en",
): string {
  const a = content[lang].appraiser;
  if (cropValue) {
    const hit = a.crops[purpose]?.find((c) => c.value === cropValue);
    if (hit) return hit.label;
  }
  const p = content[lang].waitlist.purposeOptions.find((o) => o.value === purpose);
  return p?.label ?? purpose;
}

// ---------------------------------------------------------------------------
// WATER PROFILE por cultura (reauditoria jul/2026 — substitui os sets binários
// NEEDS_IRRIGATION / RAINFED_OK). Cada linha tem dossiê com fonte primária em
// docs/hidrico-jul2026.md (Embrapa prioritária; Embrapa Semiárido para o
// semiárido). Chave = cultura, com fallback no purpose.
//
// Os cinco perfis:
// - agua_sempre: exige corpo d'água/irrigação em QUALQUER clima (aquicultura,
//   mamão, cebola, batata, tomate, arroz irrigado).
// - irrigacao_semiarido: de sequeiro no clima úmido, irrigada no semiárido
//   (manga, uva, melão, coco, goiaba, banana, maracujá, café, citros, cana).
//   É atributo da ECONOMIA, não da planta: a mesma uva gotejada em Petrolina
//   é de sequeiro na Serra Gaúcha e na Campanha.
// - umido_obrigatorio: exige clima úmido — no semiárido não se sustenta NEM
//   com irrigação plena como prática econômica registrada (cacau, açaí, maçã,
//   pêssego, pinhão, castanha, piaçava, trigo; em maçã/pêssego/trigo o
//   limitante real é frio/inverno, que a água não compra).
// - sequeiro_semiarido_ok: adaptada ao sequeiro do semiárido — NUNCA é
//   rebaixada por falta d'água (caju clonal Embrapa, carnaúba, mandioca,
//   feijão-caupi, melancia de sequeiro, abacaxi de Itaberaba, caprinos,
//   ovinos, pecuária de caatinga). `riscoInteranual` marca as anuais que
//   cabem na quadra chuvosa mas quebram em ano seco (melancia, feijão, milho).
// - neutro: indiferente ao recorte (grãos de sequeiro do Cerrado, suínos,
//   aves, leite, fumo — fumo sem fonte oficial de regime hídrico, mantido
//   neutro por conservadorismo).
// ---------------------------------------------------------------------------
export type WaterProfile =
  | "agua_sempre"
  | "irrigacao_semiarido"
  | "umido_obrigatorio"
  | "sequeiro_semiarido_ok"
  | "neutro";

type WaterProfileEntry = { profile: WaterProfile; riscoInteranual?: boolean };

const WATER_PROFILE: Record<string, WaterProfileEntry> = {
  // agua_sempre
  tilapia: { profile: "agua_sempre" }, // vazão de abastecimento é requisito de projeto (Embrapa Pesca)
  camarao: { profile: "agua_sempre" }, // água salobra COSTEIRA — açude no sertão não habilita
  aquicultura: { profile: "agua_sempre" },
  mamao: { profile: "agua_sempre" }, // irrigação imprescindível até no ES úmido (Incaper); déficit induz flor estéril
  cebola: { profile: "agua_sempre" }, // 350–650mm bem distribuídos, baixa tolerância a déficit (Embrapa Hortaliças)
  batata: { profile: "agua_sempre" }, // "altamente sensível ao déficit hídrico"; pivô é a regra (Embrapa Hortaliças)
  tomate: { profile: "agua_sempre" }, // industrial de GO 100% irrigado, plantio na estação seca (Embrapa)
  arroz: { profile: "agua_sempre" }, // RS/SC inundação (IRGA/Epagri); exceção regional MATOPIBA abaixo
  // irrigacao_semiarido
  manga: { profile: "irrigacao_semiarido" },
  melao: { profile: "irrigacao_semiarido" },
  uva: { profile: "irrigacao_semiarido" },
  coco: { profile: "irrigacao_semiarido" }, // anão irrigado no semiárido; gigante do litoral úmido é sequeiro
  goiaba: { profile: "irrigacao_semiarido" }, // sequeiro só com 800–1.000mm; <600mm não produz (Embrapa, Plantar Goiaba)
  banana: { profile: "irrigacao_semiarido" }, // ≥1.100mm; polo Jaíba/Janaúba é 100% perímetro irrigado (Embrapa/SEAPA-MG)
  maracuja: { profile: "irrigacao_semiarido" }, // ≥70mm/mês; polo Livramento/Dom Basílio irrigado por barragem (Embrapa/SEINFRA-BA)
  cafe: { profile: "irrigacao_semiarido" }, // arábica de altitude é sequeiro; conilon ES e cerrado irrigado no seco
  citros: { profile: "irrigacao_semiarido" }, // maioria do cinturão SP é sequeiro subúmido; irrigado no semiárido (Jaíba)
  cana: { profile: "irrigacao_semiarido" }, // Zona da Mata é sequeiro com salvamento; no sertão só irrigada (Embrapa)
  // umido_obrigatorio
  cacau: { profile: "umido_obrigatorio" }, // déficit hídrico anual >100mm já desaconselha (Embrapa)
  acai: { profile: "umido_obrigatorio" }, // várzea/Amazônia úmida; terra firme exige irrigação pesada DENTRO do úmido
  maca: { profile: "umido_obrigatorio" }, // limitante real: horas de frio — irrigar não resolve
  pessego: { profile: "umido_obrigatorio" }, // idem maçã (clima temperado úmido)
  abacate: { profile: "umido_obrigatorio" }, // ~1.300mm bem distribuídos; polos subúmidos SP/MG
  pinhao: { profile: "umido_obrigatorio" }, // araucária restrita ao subtropical chuvoso de altitude
  castanha_amazonia: { profile: "umido_obrigatorio" }, // 1.400–2.800mm, extrativismo de floresta
  piacava: { profile: "umido_obrigatorio" }, // endêmica da Mata Atlântica litorânea baiana (UESC)
  trigo: { profile: "umido_obrigatorio" }, // inverno temperado (ZARC trigo de sequeiro Sul); inviável no semiárido mesmo com água
  // sequeiro_semiarido_ok
  melancia: { profile: "sequeiro_semiarido_ok", riscoInteranual: true }, // ciclo 65–85 dias cabe na quadra chuvosa (Embrapa Semiárido CT 180/2020; IT 11/1999 Massaroca-Juazeiro)
  abacaxi: { profile: "sequeiro_semiarido_ok" }, // sistema Embrapa de sequeiro p/ Itaberaba-BA, 600–800mm, "cultivo não irrigado"
  caju: { profile: "sequeiro_semiarido_ok" }, // clones Embrapa PARA sequeiro; produz com 600–800mm/ano
  carnauba: { profile: "sequeiro_semiarido_ok" }, // extrativismo de população nativa, zero irrigação
  babacu: { profile: "sequeiro_semiarido_ok" }, // extrativismo da Mata dos Cocais (transição)
  mandioca: { profile: "sequeiro_semiarido_ok" }, // "a cultura que melhor se adapta ao Semiárido" (Embrapa)
  feijao: { profile: "sequeiro_semiarido_ok", riscoInteranual: true }, // caupi/macassar do sertão (Embrapa Meio-Norte); a 3ª safra irrigada é outro mercado
  pecuaria_corte: { profile: "sequeiro_semiarido_ok" }, // caatinga como pastagem nativa (Embrapa) — com suplementação na seca
  ovinos: { profile: "sequeiro_semiarido_ok" }, // Embrapa Caprinos e Ovinos (Sobral-CE), sistemas sobre caatinga
  caprinos: { profile: "sequeiro_semiarido_ok" }, // os mais adaptados do bioma (Embrapa)
  // neutro com risco marcado
  milho: { profile: "neutro", riscoInteranual: true }, // >70% da área familiar do semiárido é milho+caupi (Embrapa), mas quebra com veranico
};

// Exceções por região curada: o perfil NACIONAL não vale em toda parte.
// arroz: no MATOPIBA o sistema registrado é terras altas/sequeiro em rotação
// com soja (Embrapa Arroz e Feijão) — não exige o corpo d'água do RS.
const REGIONAL_PROFILE_OVERRIDE: Record<string, Record<string, WaterProfile>> = {
  arroz: { "matopiba-fronteira": "neutro" },
};

// Regiões curadas do semiárido (delimitação SUDENE). Necessário porque o campo
// `agua` da região é ambíguo para este fim: "irrigado" descreve tanto o Vale do
// São Francisco (semiárido) quanto a Metade Sul do RS (pampa úmido) — e é essa
// ambiguidade que fazia a uva da Campanha "pedir irrigação" (lacuna nº 4 do
// PR #19, corrigida aqui: fora do semiárido, uva é sequeiro — Embrapa Uva e Vinho).
const REGIOES_SEMIARIDAS = new Set([
  "ba-vale-sao-francisco",
  "ba-sertao-nordeste",
  "ba-centro-norte",
  "ce-rn-sertao-caju",
  "rn-assu-mossoro",
  "ce-baixo-jaguaribe",
]);

/** Contexto climático efetivo: município curado (DRY/HUMID) > região curada. */
type ClimaContexto = "umido" | "semiarido" | "indefinido";

function climaDe(regiao: RegiaoRetrato | null, moisture: Moisture): ClimaContexto {
  if (moisture === "dry") return "semiarido";
  if (moisture === "humid") return "umido";
  if (regiao) {
    if (regiao.agua === "dry" || REGIOES_SEMIARIDAS.has(regiao.key)) return "semiarido";
    if (regiao.agua === "humid") return "umido";
  }
  return "indefinido";
}

function profileOf(
  cropValue: string,
  purpose: string,
  regiao: RegiaoRetrato | null,
): WaterProfileEntry {
  const k = cropValue || purpose;
  const override = regiao ? REGIONAL_PROFILE_OVERRIDE[k]?.[regiao.key] : undefined;
  if (override) return { profile: override };
  return WATER_PROFILE[k] ?? WATER_PROFILE[purpose] ?? { profile: "neutro" };
}

/**
 * Viabilidade hídrica: perfil × contexto climático × água declarada.
 * `fit` mantém os três valores históricos (a UI os conhece); `demoted` é o
 * único efeito no ranking (afunda, nunca reordena viáveis).
 */
function bucketOf(
  entry: WaterProfileEntry,
  clima: ClimaContexto,
  water: boolean,
): { fit: WaterFit; demoted: boolean } {
  switch (entry.profile) {
    case "agua_sempre":
      return { fit: "needsIrrigation", demoted: !water };
    case "irrigacao_semiarido":
      if (clima === "umido") return { fit: "rainfed_ok", demoted: false };
      if (clima === "semiarido") return { fit: "needsIrrigation", demoted: !water };
      return { fit: "rainfed_ok", demoted: false }; // indefinido: viável, com caveat
    case "umido_obrigatorio":
      // No semiárido a água não compra o clima: rebaixada MESMO com fonte.
      if (clima === "semiarido") return { fit: "rainfed_ok", demoted: true };
      return { fit: "rainfed_ok", demoted: false };
    case "sequeiro_semiarido_ok":
      return { fit: clima === "semiarido" ? "neutral" : "rainfed_ok", demoted: false };
    case "neutro":
      return { fit: "neutral", demoted: false };
  }
}

// ---------------------------------------------------------------------------
// Coarse REGIONAL MOISTURE hint by municipality. This is NOT micro-climate
// analysis — it is a small, curated flag inspired by the official SUDENE
// semi-arid delimitation (dry set) and the humid coastal/forest zones (humid
// set). It is deliberately NON-EXHAUSTIVE: unknown municipalities default to
// "unknown", which trusts the UF-level vocation and always shows a water
// caveat rather than over-promising.
// ---------------------------------------------------------------------------
function norm(s: string): string {
  // strip combining diacritical marks (U+0300–U+036F) after NFD decomposition
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function keys(uf: string, names: string[]): string[] {
  return names.map((n) => `${uf}:${norm(n)}`);
}

// Well-known semi-arid municipalities (SUDENE semi-arid, sertão / caatinga).
const DRY = new Set<string>([
  ...keys("BA", [
    "Jeremoabo", "Juazeiro", "Casa Nova", "Curaçá", "Uauá", "Canudos",
    "Euclides da Cunha", "Ribeira do Pombal", "Paulo Afonso", "Senhor do Bonfim",
    "Jacobina", "Irecê", "Xique-Xique", "Barra", "Bom Jesus da Lapa", "Guanambi",
    "Caetité", "Brumado", "Livramento de Nossa Senhora", "Seabra",
    "Morro do Chapéu", "Campo Formoso", "Remanso", "Sento Sé", "Sobradinho",
    "Tucano", "Monte Santo", "Jaguarari", "Andorinha", "Pindobaçu",
  ]),
  ...keys("PE", [
    "Petrolina", "Ouricuri", "Serra Talhada", "Arcoverde", "Salgueiro",
    "Cabrobó", "Petrolândia", "Floresta", "Custódia",
  ]),
  ...keys("RN", ["Mossoró", "Açu", "Assu", "Apodi", "Caicó", "Currais Novos"]),
  ...keys("CE", [
    "Juazeiro do Norte", "Crato", "Quixadá", "Iguatu", "Tauá", "Crateús",
  ]),
  ...keys("PB", ["Patos", "Sousa", "Cajazeiras", "Pombal", "Monteiro"]),
  ...keys("PI", ["Picos", "São Raimundo Nonato", "Paulistana"]),
  ...keys("MG", ["Janaúba", "Jaíba", "Montes Claros", "Espinosa", "Porteirinha"]),
  ...keys("SE", ["Nossa Senhora da Glória", "Poço Redondo", "Canindé de São Francisco"]),
  ...keys("AL", ["Delmiro Gouveia", "Santana do Ipanema", "Água Branca"]),
]);

// Well-known humid zones (Atlantic-forest coast, Bahia cocoa/piassava belt,
// extreme-south Bahia). Perennial rain-fed crops are viable here without a
// dedicated water source.
const HUMID = new Set<string>([
  ...keys("BA", [
    "Ilhéus", "Itabuna", "Uruçuca", "Ubaitaba", "Camamu", "Maraú", "Una",
    "Canavieiras", "Belmonte", "Itacaré", "Ituberá", "Nilo Peçanha", "Cairu",
    "Valença", "Gandu", "Ipiaú", "Ubatã", "Wenceslau Guimarães", "Teolândia",
    "Igrapiúna", "Barra do Rocha", "Teixeira de Freitas", "Prado", "Itamaraju",
    "Porto Seguro", "Eunápolis", "Camacan", "Santa Cruz Cabrália",
  ]),
]);

export function regionMoisture(uf: string, municipality?: string): Moisture {
  if (!municipality) return "unknown";
  const k = `${uf}:${norm(municipality)}`;
  if (DRY.has(k)) return "dry";
  if (HUMID.has(k)) return "humid";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Copy hídrica por perfil × contexto × água. O blurb de clima seco agora é
// CONDICIONADO ao atributo real da cultura (reauditoria jul/2026): só quem é
// `sequeiro_semiarido_ok` recebe "adaptada ao sequeiro"; soja e cana nunca
// mais ganham crédito de caatinga por engano.
// ---------------------------------------------------------------------------
type WaterCopy = {
  reasonPt: string;
  reasonEn: string;
  warnPt?: string;
  warnEn?: string;
};

function waterCopy(
  entry: WaterProfileEntry,
  clima: ClimaContexto,
  water: boolean,
): WaterCopy {
  switch (entry.profile) {
    case "agua_sempre":
      if (water) {
        return {
          reasonPt: "Uso que depende de água o ano todo, e você indicou ter fonte para isso.",
          reasonEn: "A use that depends on water year-round, and you indicated you have a source for it.",
        };
      }
      return {
        reasonPt: "Uso de valor registrado na sua região, mas depende de água garantida em qualquer clima.",
        reasonEn: "A valuable use registered in your region, but it depends on secured water in any climate.",
        warnPt: "Requer água o ano todo (irrigação ou corpo d'água). Você indicou não ter fonte. Sem ela, priorize as opções acima.",
        warnEn: "Requires year-round water (irrigation or a water body). You indicated no source. Without it, prioritize the options above.",
      };
    case "irrigacao_semiarido":
      if (clima === "umido") {
        return {
          reasonPt: "Cultura que prospera de sequeiro com a umidade natural da sua região.",
          reasonEn: "A crop that thrives rainfed on your region's natural moisture.",
        };
      }
      if (clima === "semiarido") {
        if (water) {
          return {
            reasonPt: "Cultura de alto valor que no semiárido é irrigada, e você indicou ter fonte de água.",
            reasonEn: "A high-value crop that is irrigated in the semi-arid, and you indicated you have a water source.",
          };
        }
        return {
          reasonPt: "Vocação de alto valor da sua região, mas no semiárido depende de irrigação.",
          reasonEn: "A high-value vocation for your region, but in the semi-arid it depends on irrigation.",
          warnPt: "No semiárido esta cultura não vinga sem irrigação. Você indicou não ter fonte de água. Priorize as vocações de sequeiro.",
          warnEn: "In the semi-arid this crop won't take without irrigation. You indicated no water source. Prioritize the rainfed vocations.",
        };
      }
      return {
        reasonPt: "Viável de sequeiro na maior parte das regiões; confirme o regime de chuva da sua terra.",
        reasonEn: "Viable rainfed in most regions; confirm your land's rainfall pattern.",
      };
    case "umido_obrigatorio":
      if (clima === "semiarido") {
        return {
          reasonPt: "Cultura de clima úmido registrada no seu estado, mas fora do alcance do semiárido.",
          reasonEn: "A humid-climate crop registered in your state, but out of the semi-arid's reach.",
          warnPt: "Exige clima úmido: no semiárido não se sustenta nem com irrigação. Considere as vocações de sequeiro da sua região.",
          warnEn: "Requires a humid climate: in the semi-arid it doesn't hold up even with irrigation. Consider your region's rainfed vocations.",
        };
      }
      if (clima === "umido") {
        return {
          reasonPt: "Cultura que prospera com a umidade natural da sua região.",
          reasonEn: "A crop that thrives on your region's natural moisture.",
        };
      }
      return {
        reasonPt: "Cultura de clima úmido registrada na sua região; confirme o regime de chuva da sua terra.",
        reasonEn: "A humid-climate crop registered in your region; confirm your land's rainfall pattern.",
      };
    case "sequeiro_semiarido_ok":
      if (clima === "semiarido") {
        const base: WaterCopy = {
          reasonPt: "Adaptada ao sequeiro do semiárido (Embrapa): não depende de irrigação.",
          reasonEn: "Adapted to semi-arid rainfed farming (Embrapa): it doesn't depend on irrigation.",
        };
        if (entry.riscoInteranual) {
          base.warnPt = "Sequeiro dependente da quadra chuvosa: a safra varia com o ano. Em ano seco há risco de frustração.";
          base.warnEn = "Rainfed and tied to the rainy season: harvests vary by year. In a dry year there is crop-failure risk.";
        }
        return base;
      }
      return {
        reasonPt: "Uso consolidado e resiliente na sua região.",
        reasonEn: "A consolidated, resilient use in your region.",
      };
    case "neutro":
      if (clima === "semiarido" && entry.riscoInteranual) {
        return {
          reasonPt: "Sequeiro tradicional da sua região.",
          reasonEn: "Traditional rainfed cropping in your region.",
          warnPt: "No semiárido a safra de sequeiro depende da chuva do ano: risco de frustração em ano seco.",
          warnEn: "In the semi-arid, rainfed harvests depend on the year's rainfall: crop-failure risk in dry years.",
        };
      }
      return {
        reasonPt: "Uso consolidado e resiliente na sua região.",
        reasonEn: "A consolidated, resilient use in your region.",
      };
  }
}

// ---------------------------------------------------------------------------
// Income range for a candidate: formed-crop model first (revenue + provenance),
// then the purpose-level lease table. Missing income is fine — the candidate
// still ranks on its regional + water signal.
// ---------------------------------------------------------------------------
type Income = {
  incomeMinPerHa?: number;
  incomeMaxPerHa?: number;
  incomeFallback?: boolean;
  revMin?: number;
  revMax?: number;
  sourceNote?: string;
};

function incomeFor(cropValue: string, purpose: string, uf: string): Income {
  if (cropValue) {
    const formed = formedCropLeaseRef(cropValue, uf);
    if (formed) {
      return {
        incomeMinPerHa: formed.minPerHa,
        incomeMaxPerHa: formed.maxPerHa,
        revMin: formed.revMin,
        revMax: formed.revMax,
        sourceNote: formed.sourceNote,
      };
    }
  }
  const est = estimateLease(purpose, uf, cropValue || undefined);
  if (est.kind === "range") {
    return {
      incomeMinPerHa: est.minPerHa,
      incomeMaxPerHa: est.maxPerHa,
      incomeFallback: est.fallback,
    };
  }
  return {};
}

// ---------------------------------------------------------------------------
// MICRO-REGION GATE. `stateAdvantages` only knows UFs, so on its own it will
// happily offer a Bahia landowner every Bahian vocation at once — western-Bahia
// cotton to a farmer in Irecê, São Francisco grapes to one in Ilhéus. The
// curated portraits already carry the finer truth in their `vocacoes` field, so
// we reuse it as a filter instead of inventing a second data source.
//
// Only CURATED regions filter (retratoPorMunicipio without a bioma hint returns
// null when the municipality is not mapped). Unmapped municipalities keep the
// previous UF-level behaviour — the degradation is deliberate and safe. The
// biome fallback is deliberately NOT consulted here: "caatinga" or "cerrado"
// vocations are far too coarse to filter a ranking with.
//
// The resolution has two doors, in this order:
//   1. `regionKey` — the region the UI already resolved against the live IBGE
//      API to draw the portrait. Passing it keeps ranking and portrait telling
//      the same story even when the offline map is a month behind.
//   2. the offline município→região map, which now mirrors the online path for
//      every municipality of every curated mesorregião (see
//      lib/muni-regiao-gerado.ts), not just the hand-picked anchors.
// ---------------------------------------------------------------------------
function regionOf(input: RecommendInput): RegiaoRetrato | null {
  try {
    const direct = input.regionKey ? REGIOES[input.regionKey] : undefined;
    if (direct) return direct;
    const uf = input.uf;
    const municipality = input.municipality ?? "";
    if (!uf || !municipality) return null;
    const muni = municipality
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim()
      .toUpperCase();
    return retratoPorMunicipio(`${muni}/${uf.trim().toUpperCase()}`);
  } catch {
    return null; // the gate is an extra: it can never break the ranking
  }
}

// ---------------------------------------------------------------------------
// Public API.
// ---------------------------------------------------------------------------
export function recommendUses(input: RecommendInput): RecommendResult {
  const uf = input.uf;
  const municipality = input.municipality ?? "";
  const water = !!input.water;
  const moisture = regionMoisture(uf, municipality);
  // Curated region (or null). Feeds BOTH the micro-region gate below and the
  // water bucket, so a rainfed-wine region never demands a pump. The bucket
  // reads it even when `scopeToRegion` is off: climate is a fact about the
  // land, not a preference about how wide the ranking should be.
  const regiao = regionOf(input);

  // 1) Collect every registered regional advantage for this UF. This is the
  //    ONLY gate — no advantage, no recommendation. Every entry here is, by
  //    construction, a proven regional vocation (regionalStrong).
  const drafts: Recommendation[] = [];
  const clima = climaDe(regiao, moisture);

  for (const [key, adv] of Object.entries(stateAdvantages)) {
    if (!adv.ufs.includes(uf)) continue;

    const isCrop = !!CROP_PURPOSE[key];
    const purpose = isCrop ? CROP_PURPOSE[key] : key;
    const cropValue = isCrop ? key : "";
    const entry = profileOf(cropValue, purpose, regiao);
    // Viabilidade hídrica: perfil da cultura × contexto climático × água
    // declarada. Só decide o `demoted` — a ordem é assunto da receita, abaixo.
    const { fit, demoted } = bucketOf(entry, clima, water);
    const inc = incomeFor(cropValue, purpose, uf);
    const copy = waterCopy(entry, clima, water);

    drafts.push({
      rank: 0,
      cropValue,
      purpose,
      cropLabelPt: labelFor(cropValue, purpose, "pt"),
      cropLabelEn: labelFor(cropValue, purpose, "en"),
      waterFit: fit,
      demoted,
      scoreReasonPt: copy.reasonPt,
      scoreReasonEn: copy.reasonEn,
      regionalFactPt: adv.factPt,
      regionalFactEn: adv.factEn,
      waterWarningPt: demoted || entry.riscoInteranual ? copy.warnPt : undefined,
      waterWarningEn: demoted || entry.riscoInteranual ? copy.warnEn : undefined,
      regionalStrong: true,
      ...inc,
    });
  }

  // 1b) Micro-region gate. The UF advantages above are a coarse net; the
  //     curated portrait for this municipality knows which of them actually
  //     belong here. An advantage survives when the region lists either the
  //     crop itself ("algodao") or its purpose ("graos").
  const vocacoes =
    input.scopeToRegion === false || !regiao?.vocacoes?.length
      ? null
      : new Set(regiao.vocacoes);
  const scoped = vocacoes
    ? drafts.filter((d) => vocacoes.has(d.cropValue) || vocacoes.has(d.purpose))
    : drafts;

  // 2) Anti-invention gate: no registered vocation → weak signal, never a
  //    forced ranking. Offer the benchmarked uses as an honest fallback.
  //    A region that filters down to nothing takes the SAME honest path: we
  //    would rather say "no registered vocation here yet" than rank a crop
  //    that provably belongs to another corner of the state.
  if (scoped.length === 0) {
    const known: KnownUse[] = compareUses(uf)
      .slice(0, 4)
      .map((c) => ({
        purpose: c.purpose,
        labelPt: labelFor("", c.purpose, "pt"),
        labelEn: labelFor("", c.purpose, "en"),
        incomeMinPerHa: c.minPerHa,
        incomeMaxPerHa: c.maxPerHa,
        selective: c.selective,
        fallback: c.fallback,
      }));
    return { weakSignal: true, uf, municipality, known };
  }

  // 3) Drop the generic purpose-level entry (e.g. "graos") when specific crops
  //    of the same purpose already matched, to avoid a redundant card. Only a
  //    crop the region names EXPLICITLY silences the generic card: when a crop
  //    got in merely by riding the broad purpose, the purpose is still the
  //    headline. Without this, a grain mesorregião that lists "graos" would
  //    show "Fumo" alone — tobacco rides the graos purpose, then evicts the
  //    very grain card the region is known for.
  const purposesWithCrop = new Set(
    scoped
      .filter((d) => d.cropValue && (!vocacoes || vocacoes.has(d.cropValue)))
      .map((d) => d.purpose),
  );
  const pruned = scoped.filter(
    (d) => d.cropValue || !purposesWithCrop.has(d.purpose),
  );

  // 4) REGRA DE ORDENAÇÃO (explicitada na reauditoria jul/2026):
  //    a) viáveis antes de rebaixadas — `demoted` afunda, nunca reordena;
  //    b) entre viáveis, teto de receita modelada desc (revMax, depois revMin);
  //    c) cultura SEM faixa de receita nunca ultrapassa uma com faixa: cai
  //       para o fim do bloco viável, em ordem alfabética determinística.
  //    Consequência assumida: uma cultura sem faixa pode LIDERAR por
  //    eliminação quando todas as demais estão rebaixadas — é o caso da
  //    melancia de sequeiro em Xique-Xique sem água, e é o comportamento
  //    honesto (a alternativa seria esconder a única vocação viável).
  pruned.sort((a, b) => {
    // Water-unviable uses sink beneath every viable one.
    if (a.demoted !== b.demoted) return a.demoted ? 1 : -1;
    // A modeled revenue range beats none; entries without one go to the end.
    const aHas = a.revMax != null;
    const bHas = b.revMax != null;
    if (aHas !== bHas) return aHas ? -1 : 1;
    if (aHas && bHas) {
      if (b.revMax! !== a.revMax!) return b.revMax! - a.revMax!; // higher ceiling first
      const ar = a.revMin ?? 0;
      const br = b.revMin ?? 0;
      if (br !== ar) return br - ar; // higher floor breaks the tie
    }
    // No revenue ceiling on either side → deterministic alphabetical order.
    return a.cropLabelPt.localeCompare(b.cropLabelPt);
  });

  const recommendations: Recommendation[] = pruned.map((d, i) => ({
    ...d,
    rank: i + 1,
  }));

  return { weakSignal: false, uf, municipality, moisture, recommendations };
}
