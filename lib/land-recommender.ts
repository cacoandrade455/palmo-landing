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
// WATER-FIT buckets (crop agronomy classification — engine logic, not data).
// Which regional vocations depend on a water source vs. thrive on rainfall vs.
// are indifferent. Keyed by crop value, falling back to the purpose.
// ---------------------------------------------------------------------------
const NEEDS_IRRIGATION = new Set([
  "manga", // Vale do São Francisco is irrigated fruit
  "melao", // Mossoró/Açu hub, irrigated per season
  "uva", // irrigated table grapes
  "mamao", // irrigated (CE 70 t/ha)
  "coco", // dwarf coconut is grown irrigated
  "tilapia", // needs a water body
  "camarao", // needs brackish/coastal water
]);
const RAINFED_OK = new Set([
  "cacau", // humid south Bahia / Pará
  "cafe", // humid highlands
  "banana", // rainfed in humid zones
  "citros", // rainfed in SP
  "acai", // humid Amazon
  "goiaba",
  "maracuja",
  "abacate",
  "maca",
  "pessego",
  "abacaxi",
]);

function bucketOf(cropValue: string, purpose: string): WaterFit {
  const k = cropValue || purpose;
  if (NEEDS_IRRIGATION.has(k)) return "needsIrrigation";
  if (RAINFED_OK.has(k)) return "rainfed_ok";
  return "neutral"; // grains-of-dryland, cattle, cassava, extractivism, cane...
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
// Water/region scoring. The water fit is the DECISIVE lever; a small
// revenue term only breaks ties inside the same bucket.
// ---------------------------------------------------------------------------
function waterScore(fit: WaterFit, moisture: Moisture, water: boolean): number {
  if (fit === "needsIrrigation") {
    return water ? 400 : -900; // no water source → drops below everything
  }
  if (fit === "rainfed_ok") {
    if (moisture === "humid") return 500; // natural humidity → prime vocation
    if (moisture === "dry") return water ? 250 : -700; // caatinga needs water
    return water ? 300 : 120; // unknown: viable, but modest without confidence
  }
  // neutral — dryland grains, cattle, cassava, extractivism, cane
  if (moisture === "dry") return 250; // exactly the sertão economy
  if (moisture === "humid") return 150;
  return 180;
}

type WaterCopy = {
  reasonPt: string;
  reasonEn: string;
  warnPt?: string;
  warnEn?: string;
};

function waterCopy(fit: WaterFit, moisture: Moisture, water: boolean): WaterCopy {
  if (fit === "needsIrrigation") {
    if (water) {
      return {
        reasonPt: "Fruticultura de alto valor — e você indicou ter fonte de água para irrigar.",
        reasonEn: "High-value fruit — and you indicated you have a water source to irrigate.",
      };
    }
    return {
      reasonPt: "Vocação de alto valor da sua região, mas depende de irrigação.",
      reasonEn: "High-value vocation for your region, but it depends on irrigation.",
      warnPt: "Requer irrigação — você indicou não ter fonte de água. Sem água garantida, priorize as opções acima.",
      warnEn: "Requires irrigation — you indicated no water source. Without secured water, prioritize the options above.",
    };
  }
  if (fit === "rainfed_ok") {
    if (moisture === "humid") {
      return {
        reasonPt: "Cultura perene que prospera com a umidade natural da sua região.",
        reasonEn: "Perennial crop that thrives on your region's natural rainfall.",
      };
    }
    if (moisture === "dry") {
      if (water) {
        return {
          reasonPt: "Perene de valor que, no seu clima seco, pede irrigação — que você indicou ter.",
          reasonEn: "Valuable perennial that, in your dry climate, needs irrigation — which you indicated you have.",
        };
      }
      return {
        reasonPt: "Registrada na sua região, mas no clima seco não se sustenta sem água.",
        reasonEn: "Registered in your region, but in a dry climate it can't hold up without water.",
        warnPt: "No semiárido, sem irrigação esta cultura perene não vinga — confirme a disponibilidade de água.",
        warnEn: "In the semi-arid, without irrigation this perennial won't take — confirm water availability.",
      };
    }
    return {
      reasonPt: "Perene registrada na sua região; confirme a disponibilidade de chuva ou água na sua terra.",
      reasonEn: "Perennial registered in your region; confirm rainfall or water availability on your land.",
    };
  }
  // neutral
  if (moisture === "dry") {
    return {
      reasonPt: "Adaptada ao clima seco da sua região (sequeiro, pecuária ou extrativismo da caatinga).",
      reasonEn: "Suited to your region's dry climate (dryland cropping, cattle or caatinga extractivism).",
    };
  }
  return {
    reasonPt: "Uso consolidado e resiliente na sua região.",
    reasonEn: "A consolidated, resilient use in your region.",
  };
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
// Public API.
// ---------------------------------------------------------------------------
export function recommendUses(input: RecommendInput): RecommendResult {
  const uf = input.uf;
  const municipality = input.municipality ?? "";
  const water = !!input.water;
  const moisture = regionMoisture(uf, municipality);

  // 1) Collect every registered regional advantage for this UF. This is the
  //    ONLY gate — no advantage, no recommendation. Every entry here is, by
  //    construction, a proven regional vocation (regionalStrong).
  const drafts: Recommendation[] = [];

  for (const [key, adv] of Object.entries(stateAdvantages)) {
    if (!adv.ufs.includes(uf)) continue;

    const isCrop = !!CROP_PURPOSE[key];
    const purpose = isCrop ? CROP_PURPOSE[key] : key;
    const cropValue = isCrop ? key : "";
    const fit = bucketOf(cropValue, purpose);
    const inc = incomeFor(cropValue, purpose, uf);
    const copy = waterCopy(fit, moisture, water);
    // Water fit only decides whether a use is VIABLE right now (demoted); it no
    // longer feeds the ranking order — that is settled purely by revenue below.
    const ws = waterScore(fit, moisture, water);

    drafts.push({
      rank: 0,
      cropValue,
      purpose,
      cropLabelPt: labelFor(cropValue, purpose, "pt"),
      cropLabelEn: labelFor(cropValue, purpose, "en"),
      waterFit: fit,
      demoted: ws < 0,
      scoreReasonPt: copy.reasonPt,
      scoreReasonEn: copy.reasonEn,
      regionalFactPt: adv.factPt,
      regionalFactEn: adv.factEn,
      waterWarningPt: copy.warnPt,
      waterWarningEn: copy.warnEn,
      regionalStrong: true,
      ...inc,
    });
  }

  // 2) Anti-invention gate: no registered vocation → weak signal, never a
  //    forced ranking. Offer the benchmarked uses as an honest fallback.
  if (drafts.length === 0) {
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
  //    of the same purpose already matched, to avoid a redundant card.
  const purposesWithCrop = new Set(
    drafts.filter((d) => d.cropValue).map((d) => d.purpose),
  );
  const pruned = drafts.filter(
    (d) => d.cropValue || !purposesWithCrop.has(d.purpose),
  );

  // 4) Rank by RETURN, highest ceiling first. The order is settled by the
  //    modeled gross-revenue range (revMax desc, revMin desc as the tiebreak),
  //    NOT by regional vocation (which is now only a badge). Water viability
  //    (`demoted`) merely sinks the currently-unviable uses to the bottom — it
  //    never reorders the viable ones. Uses without a modeled revenue range
  //    have no ceiling to compare, so they fall to the end, alphabetically.
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
