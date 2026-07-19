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
 * - Caju: CE = 55,3% da castanha nacional; PI 2º com 23% (CONAB mar/2026).
 * - Mandioca: PA lidera (18,6%), BA 2ª (15,6%), PR 3º; SP/PR maior
 *   produtividade, ~23 t/ha (Embrapa/IBGE).
 * - Melancia: BA maior volume — Teixeira de Freitas 59–71 t/ha (CEPEA);
 *   GO maior rendimento/ha (IBGE PAM 2023/24).
 * - Abacaxi: PB maior produtora (safra 2024/25); SP maior rendimento,
 *   R$128 mil/ha; média nacional R$77 mil/ha (IBGE).
 * - Ovinos: BA 23% do rebanho nacional; PE 2º, RS 3º (IBGE PPM 2023).
 * - Caprinos: BA 31%; com PE e PI, NE concentra 96% (IBGE PPM 2023).
 * - Tilápia: PR líder com 27% da produção (Anuário Peixe BR 2026);
 *   SP e MG no pódio; CE cresce 29% a.a.
 * - Camarão: CE ~57% da produção nacional (IBGE/BNB-ETENE; ABCC 2026);
 *   RN 2º, PB 3ª; Aracati/CE maior município produtor.
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
  caju: {
    ufs: ["CE", "PI", "RN"],
    factPt: "CE concentra 55% da castanha de caju nacional; PI é o 2º, com 23% (CONAB mar/2026).",
    factEn: "CE holds 55% of Brazil's cashew-nut output; PI is 2nd with 23% (CONAB Mar/2026).",
  },
  mandioca: {
    ufs: ["PA", "BA", "PR", "SP"],
    factPt: "PA lidera a mandioca nacional e BA é a 2ª; SP e PR têm a maior produtividade, ~23 t/ha (Embrapa/IBGE).",
    factEn: "PA leads Brazil's cassava and BA is 2nd; SP and PR have the highest yields, ~23 t/ha (Embrapa/IBGE).",
  },
  melancia: {
    ufs: ["BA", "GO", "RS"],
    factPt: "BA é a maior produtora de melancia em volume — Teixeira de Freitas colhe 59–71 t/ha (CEPEA); GO tem o maior rendimento por hectare (IBGE).",
    factEn: "BA is Brazil's largest watermelon producer by volume — Teixeira de Freitas harvests 59–71 t/ha (CEPEA); GO has the highest per-hectare returns (IBGE).",
  },
  abacaxi: {
    ufs: ["PB", "PA", "SP", "MG"],
    factPt: "PB é a maior produtora de abacaxi do país (safra 2024/25); SP tem o maior rendimento — R$128 mil/ha (IBGE).",
    factEn: "PB is Brazil's largest pineapple producer (2024/25 season); SP has the highest returns — R$128k/ha (IBGE).",
  },
  ovinos: {
    ufs: ["BA", "PE", "RS", "CE"],
    factPt: "BA tem o maior rebanho ovino do Brasil (23%); PE é o 2º e RS o 3º — Casa Nova/BA lidera entre os municípios (IBGE PPM 2023).",
    factEn: "BA has Brazil's largest sheep flock (23%); PE is 2nd and RS 3rd — Casa Nova/BA leads among municipalities (IBGE PPM 2023).",
  },
  caprinos: {
    ufs: ["BA", "PE", "PI", "CE"],
    factPt: "BA lidera a caprinocultura nacional (31% do rebanho); com PE e PI, o Nordeste concentra 96% dos caprinos do país (IBGE PPM 2023).",
    factEn: "BA leads Brazil's goat farming (31% of the herd); with PE and PI, the Northeast holds 96% of the country's goats (IBGE PPM 2023).",
  },
  tilapia: {
    ufs: ["PR", "SP", "MG", "SC"],
    factPt: "PR lidera a tilápia nacional com 27% da produção (Anuário Peixe BR 2026); SP e MG completam o pódio — no NE, o CE cresce 29% ao ano.",
    factEn: "PR leads Brazil's tilapia with 27% of output (Peixe BR 2026 yearbook); SP and MG complete the podium — in the NE, CE grows 29% a year.",
  },
  camarao: {
    ufs: ["CE", "RN", "PB", "PE"],
    factPt: "CE lidera a carcinicultura com ~57% do camarão cultivado no país (IBGE/BNB); RN e PB completam o pódio — Aracati/CE é o maior município produtor.",
    factEn: "CE leads shrimp farming with ~57% of Brazil's farmed shrimp (IBGE/BNB); RN and PB complete the podium — Aracati/CE is the top producing municipality.",
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
