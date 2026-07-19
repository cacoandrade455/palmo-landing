/**
 * State production ADVANTAGE by commodity — which UFs lead a given crop, with
 * sourced productivity/share facts. Used to add a strategic-context line to
 * the calculator: "seu estado é forte em X".
 *
 * SOURCES (compiled Jul/2026):
 * - Soja: CONAB safra 2024/25 — BA maior rendimento entre grandes produtores
 *   (3.894 kg/ha, +23,7% vs média nacional); GO 4.122 kg/ha; MT maior volume.
 *   (Embrapa Soja / agrocontexto / CONAB)
 * - Grãos (geral): MT, PR, RS, GO = 67% da safra nacional (CNA/CONAB 2025).
 * - Milho: MT lidera; PR, GO, MS relevantes (IBGE/CONAB).
 * - Algodão: MT = 70,8% da produção nacional (CONAB 2025).
 * - Café: MG lidera arábica; ES lidera conilon (CONAB/CECAFÉ).
 * - Cana: SP domina (~50% nacional) (CONAB/UNICA).
 * - Laranja/citros: SP domina (~70%+ do cinturão citrícola) (Fundecitrus).
 * - Frutas NE / cacau: BA lidera regionalmente banana, laranja, manga, e
 *   ~92,5% do cacau da área do BNB (BNB/ETENE 2023).
 * - Uva: PE lidera uva da área do BNB (85,2%) (BNB/ETENE 2023).
 * - Melão: RN = 61,9% da produção nacional; polo Mossoró/Açu (IBGE PAM 2024).
 * - Mamão: BA maior volume (31%); ES maior valor e rendimento
 *   (R$184,6 mil/ha); CE maior produtividade, 70 t/ha (IBGE PAM 2023/24).
 * - Maracujá: BA maior produtora (36%); CE 2º, com o dobro da
 *   produtividade baiana (IBGE PAM 2023/24).
 * - Coco: CE maior produtor nacional — 24,7% da produção (BNB/ETENE 2021).
 * - Açaí: PA = 90,4% da produção nacional; AM 2º (IBGE/OIT 2022).
 */

export type StateAdvantage = {
  /** UFs where this crop has a notable production advantage */
  ufs: string[];
  /** short sourced fact shown to the user (PT) */
  factPt: string;
  factEn: string;
};

/** keyed by purpose value, and by specific crop value where relevant */
export const stateAdvantages: Record<string, StateAdvantage> = {
  // by purpose
  graos: {
    ufs: ["MT", "PR", "RS", "GO"],
    factPt:
      "MT, PR, RS e GO concentram ~67% da safra nacional de grãos (CONAB/CNA).",
    factEn:
      "MT, PR, RS and GO account for ~67% of Brazil's grain harvest (CONAB/CNA).",
  },
  cana: {
    ufs: ["SP"],
    factPt: "SP concentra cerca de metade da cana-de-açúcar do país (CONAB/UNICA).",
    factEn: "SP produces roughly half of Brazil's sugarcane (CONAB/UNICA).",
  },
  // by specific crop
  soja: {
    ufs: ["BA", "MT", "GO", "PR"],
    factPt:
      "BA tem o maior rendimento de soja entre os grandes produtores (~3.894 kg/ha, +24% vs média); MT é o maior em volume (CONAB 2024/25).",
    factEn:
      "BA has the highest soybean yield among major producers (~3,894 kg/ha, +24% vs average); MT leads by volume (CONAB 2024/25).",
  },
  milho: {
    ufs: ["MT", "PR", "GO", "MS"],
    factPt: "MT lidera a produção de milho; PR, GO e MS também se destacam (CONAB).",
    factEn: "MT leads corn production; PR, GO and MS also stand out (CONAB).",
  },
  algodao: {
    ufs: ["MT", "BA"],
    factPt: "MT responde por ~70% do algodão nacional; BA é o 2º polo (CONAB 2025).",
    factEn: "MT accounts for ~70% of national cotton; BA is the 2nd hub (CONAB 2025).",
  },
  cafe: {
    ufs: ["MG", "ES", "SP"],
    factPt: "MG lidera o café arábica; ES lidera o conilon (CONAB/CECAFÉ).",
    factEn: "MG leads arabica coffee; ES leads conilon (CONAB/CECAFÉ).",
  },
  citros: {
    ufs: ["SP", "MG"],
    factPt: "SP domina o cinturão citrícola nacional (Fundecitrus).",
    factEn: "SP dominates the national citrus belt (Fundecitrus).",
  },
  cacau: {
    ufs: ["BA", "PA"],
    factPt: "BA é referência histórica em cacau; PA lidera em produtividade (IBGE/CEPLAC).",
    factEn: "BA is the historic cocoa reference; PA leads in yield (IBGE/CEPLAC).",
  },
  banana: {
    ufs: ["BA", "SP", "MG"],
    factPt: "BA é a maior produtora regional de banana do Nordeste (BNB/ETENE).",
    factEn: "BA is the Northeast's largest banana producer (BNB/ETENE).",
  },
  manga: {
    ufs: ["BA", "PE"],
    factPt:
      "BA e PE (Vale do São Francisco) lideram a manga nacional e de exportação (IBGE/Embrapa).",
    factEn:
      "BA and PE (São Francisco Valley) lead national and export mango (IBGE/Embrapa).",
  },
  uva: {
    ufs: ["PE", "BA", "RS"],
    factPt:
      "PE lidera a uva do Nordeste (85% da área do BNB); RS lidera vinho no Sul (BNB/ETENE).",
    factEn:
      "PE leads Northeast grapes (85% of BNB area); RS leads Southern wine (BNB/ETENE).",
  },
  melao: {
    ufs: ["RN", "CE"],
    factPt:
      "RN responde por ~62% do melão nacional — polo Mossoró/Açu, líder em exportação (IBGE PAM 2024).",
    factEn:
      "RN accounts for ~62% of Brazil's melon — the Mossoró/Açu hub leads exports (IBGE PAM 2024).",
  },
  mamao: {
    ufs: ["BA", "ES", "CE", "RN"],
    factPt:
      "BA é a maior produtora de mamão (31% do volume); ES lidera em valor e CE em produtividade, 70 t/ha (IBGE PAM 2023/24).",
    factEn:
      "BA is the largest papaya producer (31% of volume); ES leads in value and CE in yield, 70 t/ha (IBGE PAM 2023/24).",
  },
  maracuja: {
    ufs: ["BA", "CE"],
    factPt:
      "BA é a maior produtora de maracujá do país (36%); CE é o 2º, com o dobro da produtividade baiana (IBGE PAM 2023/24).",
    factEn:
      "BA is Brazil's largest passion-fruit producer (36%); CE is 2nd, with twice Bahia's yield (IBGE PAM 2023/24).",
  },
  coco: {
    ufs: ["CE", "BA", "PE", "RN"],
    factPt:
      "CE é o maior produtor de coco do Brasil (~25% da produção); o Nordeste concentra ~74% (BNB/ETENE).",
    factEn:
      "CE is Brazil's largest coconut producer (~25% of output); the Northeast holds ~74% (BNB/ETENE).",
  },
  acai: {
    ufs: ["PA", "AM"],
    factPt: "PA responde por ~90% do açaí nacional; AM é o 2º produtor (IBGE/OIT 2022).",
    factEn: "PA accounts for ~90% of Brazil's açaí; AM is the 2nd producer (IBGE/OIT 2022).",
  },
};

/** Returns the advantage fact if the user's UF is among the leaders for this crop/purpose. */
export function stateAdvantageFor(
  key: string,
  uf: string,
): { factPt: string; factEn: string } | null {
  const adv = stateAdvantages[key];
  if (!adv) return null;
  if (!adv.ufs.includes(uf)) return null;
  return { factPt: adv.factPt, factEn: adv.factEn };
}
