/**
 * State production ADVANTAGE by commodity — which UFs lead a given crop, with
 * sourced productivity/share facts. Used to add a strategic-context line to
 * the calculator: "seu estado é forte em X".
 *
 * SOURCES (compiled Jul/2026; auditoria de cobertura ufs x fato em Jul/2026):
 * - Soja: CONAB safra 2024/25 — MT maior volume (50,59 mi t); PR 21,48 mi t;
 *   BA maior rendimento entre grandes produtores (3.894 kg/ha, +23,7% vs média
 *   nacional); GO 4.122 kg/ha, produtividade recorde da série na 24/25.
 *   RS é o 3º produtor nacional (2ª maior área, 7,1 mi ha) com 22,4 mi t
 *   recordes na 25/26 (CONAB 25/26). MATOPIBA (12º lev. 24/25): TO 5,12 mi t,
 *   MA 4,32 mi t, PI 3,96 mi t — a fronteira que mais cresce (+114% da soja
 *   em dez safras, CONAB). MG 6º produtor na PAM 2024 (7,74 mi t, à frente
 *   da BA com 7,67). (Embrapa Soja / agrocontexto / CONAB / IBGE PAM 2024)
 * - Grãos (geral): MT, PR, RS, GO = 67% da safra nacional (CNA/CONAB 2025);
 *   no MATOPIBA, MA (8,79 mi t de grãos na 24/25), TO e PI somam >13 mi t só
 *   de soja (CONAB 12º lev. 24/25). MG (14,3 mi t) e BA (10,3 mi t) só de
 *   soja+milho em 2024 (IBGE PAM 2024).
 * - Milho: MT lidera com folga — 41,2% da produção nacional; PR (13,5%),
 *   GO (11,3%) e MS (6,9%) a seguir; MG 5º (5,7%), RS 6º (3,9%); BA 8ª do
 *   país e maior produtora do Nordeste (2,63 mi t, à frente do MA com 2,38),
 *   puxada pelo Extremo Oeste (IBGE PAM 2024, SIDRA t.5457 v.214).
 * - Algodão: MT = 70,8% da produção nacional (CONAB 2025).
 * - Café: MG lidera arábica (24,8 mi sacas); ES lidera conilon (11,8 mi das
 *   15,1 mi sacas); SP 4,6 mi sacas, 100% arábica — Mogiana e Centro-Oeste
 *   paulista (CONAB, 1º levantamento 2025). BA: 4ª produtora do país e líder
 *   do NE — 3,68 mi sacas em 2025 (maior volume desde 2017), arábica no
 *   Planalto (Vitória da Conquista, Chapada Diamantina) e conilon no
 *   Sul/Extremo Sul, 2ª maior do país na variedade, com cerrado irrigado no
 *   Oeste (CONAB, 2º levantamento 2025). RO: 5º produtor nacional — 170 mil t
 *   em 2024 (~2,8 mi sacas), praticamente 100% canephora (2º maior volume da
 *   variedade na PAM 2024), IG "Matas de Rondônia" (IBGE PAM 2024 / INPI).
 * - Cana: SP 55,1%; MG (11,0%) e GO (10,7%) disputam o 2º posto; MS 6,9%,
 *   PR 5º (4,5%); no NE, AL é o maior produtor regional (18,7 mi t, 7º do
 *   país), PE 8º (16,1 mi t) e PB 9º (7,2 mi t) — o cinturão histórico da
 *   Zona da Mata (IBGE PAM 2024; CONAB/UNICA para o share ~50% de SP).
 * - Laranja/citros: cinturão citrícola de SP + Triângulo/Sudoeste de MG é o
 *   maior polo de laranja para suco do mundo e fez ~80,9% da produção
 *   nacional em 2023 (Fundecitrus/IBGE).
 * - Banana: SP 13,7%, MG 12,0%, BA 11,9% (IBGE PAM 2024); BA lidera o NE;
 *   PE é o 5º produtor nacional (9,2%, 646 mil t — PAM 2024).
 * - Manga: BA 45,9% e PE 29,4% (Vale do São Francisco); SP 3º (11,3%);
 *   MG 4º (5,2%, polo Jaíba/Janaúba); RN 6º (2,3%, polo Açu-Mossoró)
 *   (IBGE PAM 2024).
 * - Cacau: BA com ~92,5% do cacau da área do BNB (BNB/ETENE 2023). Volume
 *   nacional 2024: PA 46,2% e BA 46,1% praticamente empatados; ES 3º (4,1%);
 *   RO 4º (2,9%, 8,7 mil t, em expansão) (IBGE PAM 2024).
 * - Uva: PE lidera uva da área do BNB (85,2%) (BNB/ETENE 2023); Vale do São
 *   Francisco (Petrolina e Lagoa Grande/PE, Juazeiro e Casa Nova/BA) = ~95%
 *   da uva exportada pelo Brasil (Valexport/ComexStat 2024). SC é a 6ª
 *   produtora (2,1% — PAM 2024), com os vinhos de altitude de São Joaquim
 *   (Epagri).
 * - Melão: RN = 61,9% da produção nacional; polo Mossoró/Açu; CE 3º maior
 *   produtor, ~8% da produção em ~7% da área (IBGE PAM / HF Brasil 2023/24).
 * - Mamão: PAM 2024 — ES maior volume (34,6%), BA 2ª (27,1%), CE 3º (11,1%),
 *   RN 4º (8,8%), MG 5º (6,0%, perímetros irrigados do Norte de Minas);
 *   os cinco somam ~88% do país. (Na PAM 2023 a BA liderava o volume; ES
 *   segue líder em valor e CE em produtividade.)
 * - Maracujá: BA maior produtora (36%); CE 2º, com o dobro da
 *   produtividade baiana (IBGE PAM 2023/24).
 * - Coco: CE maior produtor nacional — 28,0% na PAM 2024 (24,7% no dado
 *   BNB/ETENE 2021); litoral do NE concentra ~80% (CE+BA+PE+RN+SE+AL+PB,
 *   PAM 2024) — AL 8º (4,0%) e PB 9ª (4,0%).
 * - Açaí: PA = 90,4% da produção nacional; AM 2º (IBGE/OIT 2022).
 * - Caju: CE principal produtor (61,7% da produção prevista para 2025);
 *   CE+PI+RN = 92,7% da castanha in natura do país (CONAB nov/2025 e
 *   mar/2026).
 * - Mandioca: PA lidera (18,6%), BA 2ª (15,6%), PR 3º; SP/PR maior
 *   produtividade, ~23 t/ha (Embrapa/IBGE).
 * - Melancia: GO assumiu a liderança em 2024 com 13,7% (270,5 mil t; Uruana
 *   é o maior município); BA 2ª com 11,7% — Teixeira de Freitas 59–71 t/ha
 *   (CEPEA); SP 3º (9,7%), RS 4º (8,7%), PE 5º (7,7%) e RN 6º (7,2%,
 *   142,6 mil t no polo irrigado Açu-Mossoró) (IBGE PAM 2024).
 * - Abacaxi: PB maior produtora em volume (300,9 mi de frutos em 2024);
 *   PA 2º (290,4 mi) e maior valor de produção (R$1,08 bi, Floresta do
 *   Araguaia é o maior município); MG 3º (143,7 mi); SP maior rendimento,
 *   R$128 mil/ha; média nacional R$77 mil/ha (IBGE).
 * - Goiaba: Nordeste = maior região produtora (47% do share); BA no top 5
 *   nacional (8%, 45 mil t); PE lidera no NE (70,4% da área do BNB); SP maior
 *   área (28%), PR maior produtividade (IBGE 2024 / BNB-ETENE).
 * - Suínos: SC lidera o abate nacional com 28,2% em 2025; PR 21,2% e RS
 *   17,9% — o Sul concentra 67% (IBGE, abate 2025). Oeste Catarinense é o
 *   núcleo da integração.
 * - Frango de corte: PR lidera o abate com 34,4% em 2025; SC 13,7% e RS
 *   11,4% — Sul ~60% do abate nacional (IBGE, abate 2025).
 * - Ovinos: BA 23% do rebanho nacional (4,66 mi cabeças); PE 2º com 16,9%
 *   (3,52 mi), RS 3º (3,35 mi), CE 4º (2,55 mi); NE = 71,2% dos ovinos
 *   (IBGE PPM 2023).
 * - Caprinos: BA 31%; com PE e PI, NE concentra 96% (IBGE PPM 2023).
 * - Tilápia: PR líder com 27% da produção (273,1 mil t); SP 2º (93,7 mil t),
 *   MG 3º (77,5 mil t), SC 4º (63,4 mil t) (Anuário Peixe BR, dados 2025).
 * - Camarão: CE 110 mil das 210 mil t nacionais em 2024 (ABCC); CE+RN+PB+PE
 *   = 88,3% da produção nacional (BNB-ETENE dez/2025); Aracati/CE maior
 *   município produtor.
 * - Extrativismo (IBGE PEVS): carnaúba — PI+CE ~96% do pó (100% NE);
 *   babaçu — MA ~94% (Vargem Grande líder); pinhão — Sul ~97%;
 *   castanha-da-amazônia — AC/AM/PA (Brasiléia/AC líder); piaçava —
 *   BA ~96% (Ilhéus, Nilo Peçanha, Cairu).
 * - Pêssego: RS ~64% da produção nacional (polo de Pelotas); SP 2º com 17%
 *   e maior produtividade (~22 t/ha); SC 3º maior produtor (IBGE/Epagri).
 *
 * REGRA DE CONSISTÊNCIA: todo estado listado em `ufs` precisa estar coberto
 * pelo fato — nominalmente ou por um dado regional que o inclua (ex.: "o
 * Nordeste concentra X%" cobre BA/PE/CE/RN listados). Ao mexer no `ufs`,
 * reescrever o fato junto, com fonte.
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
    ufs: ["MT", "PR", "RS", "GO", "MG", "BA", "MA", "PI", "TO"],
    factPt:
      "MT, PR, RS e GO concentram ~67% da safra nacional de grãos (CONAB/CNA); MG e BA vêm logo atrás — 14,3 e 10,3 mi t só de soja e milho em 2024 (IBGE PAM) — e no MATOPIBA, a fronteira que mais cresce, TO, MA e PI colheram juntos mais de 13 mi t só de soja na 24/25 (CONAB).",
    factEn:
      "MT, PR, RS and GO account for ~67% of Brazil's grain harvest (CONAB/CNA); MG and BA come right behind — 14.3 and 10.3 M t of soybeans and corn alone in 2024 (IBGE PAM) — and in MATOPIBA, the fastest-growing frontier, TO, MA and PI together harvested over 13 M t of soybeans alone in 24/25 (CONAB).",
  },
  cana: {
    ufs: ["SP", "MG", "PR", "AL", "PE", "PB"],
    factPt:
      "SP concentra 55% da cana do país; MG (11%) e GO (10,7%) disputam o 2º posto e o PR é o 5º; no Nordeste, o cinturão histórico da Zona da Mata tem AL como maior produtor regional (18,7 mi t), seguido de PE e PB (IBGE PAM 2024).",
    factEn:
      "SP holds 55% of Brazil's sugarcane; MG (11%) and GO (10.7%) vie for 2nd place and PR is 5th; in the Northeast, the historic Zona da Mata belt has AL as the regional leader (18.7 M t), followed by PE and PB (IBGE PAM 2024).",
  },
  // by specific crop
  soja: {
    ufs: ["BA", "MT", "GO", "PR", "RS", "MG", "MA", "PI", "TO"],
    factPt:
      "MT é o maior produtor de soja (50,6 mi t) e o PR o 2º (21,5 mi t); o RS é o 3º, com 22,4 mi t recordes na 25/26. BA e GO têm os maiores rendimentos (~3.900 e ~4.100 kg/ha), MG é o 6º produtor nacional (7,7 mi t em 2024, IBGE PAM) e a fronteira do MATOPIBA — TO (5,1 mi t), MA (4,3 mi t) e PI (4,0 mi t) — é a que mais cresce no país (CONAB 2024/25 e 25/26).",
    factEn:
      "MT is the largest soybean producer (50.6 M t) and PR is 2nd (21.5 M t); RS ranks 3rd, with a record 22.4 M t in 25/26. BA and GO have the highest yields (~3,900 and ~4,100 kg/ha), MG is the 6th-largest national producer (7.7 M t in 2024, IBGE PAM) and the MATOPIBA frontier — TO (5.1 M t), MA (4.3 M t) and PI (4.0 M t) — is the country's fastest-growing (CONAB 2024/25 and 25/26).",
  },
  milho: {
    ufs: ["MT", "PR", "GO", "MS", "MG", "RS", "BA"],
    factPt:
      "MT lidera o milho com folga (41% da produção nacional); PR, GO e MS vêm a seguir, MG é o 5º produtor e o RS o 6º; a BA, 8ª do país, é a maior produtora do Nordeste, puxada pelo cerrado do Extremo Oeste (IBGE PAM 2024).",
    factEn:
      "MT leads corn by a wide margin (41% of national output); PR, GO and MS follow, MG is the 5th producer and RS the 6th; BA, 8th nationally, is the Northeast's largest, driven by the western Cerrado (IBGE PAM 2024).",
  },
  algodao: {
    ufs: ["MT", "BA"],
    factPt: "MT responde por ~70% do algodão nacional; BA é o 2º polo (CONAB 2025).",
    factEn: "MT accounts for ~70% of national cotton; BA is the 2nd hub (CONAB 2025).",
  },
  cafe: {
    ufs: ["MG", "ES", "SP", "BA", "RO"],
    factPt:
      "MG lidera o café arábica (24,8 mi de sacas) e o ES lidera o conilon (11,8 mi); SP produz 4,6 mi de sacas, 100% arábica. A BA é a 4ª produtora do país e a maior do Nordeste — 3,7 mi de sacas em 2025, com arábica no Planalto (Vitória da Conquista, Chapada Diamantina) e conilon no Sul, onde é a 2ª do país na variedade (CONAB 2025). RO é a 5ª produtora nacional — ~2,8 mi de sacas em 2024, praticamente tudo robusta/conilon, com a IG 'Matas de Rondônia' (IBGE PAM 2024).",
    factEn:
      "MG leads arabica coffee (24.8 M bags) and ES leads conilon (11.8 M); SP produces 4.6 M bags, 100% arabica. BA is Brazil's 4th-largest producer and the Northeast's biggest — 3.7 M bags in 2025, with arabica on the Planalto highlands (Vitória da Conquista, Chapada Diamantina) and conilon in the south, where it ranks 2nd nationally in the variety (CONAB 2025). RO is the 5th-largest producer — ~2.8 M bags in 2024, virtually all robusta/conilon, under the 'Matas de Rondônia' Geographical Indication (IBGE PAM 2024).",
  },
  citros: {
    ufs: ["SP", "MG"],
    factPt:
      "O cinturão citrícola de SP e do Triângulo/Sudoeste de MG é o maior polo de laranja para suco do mundo e responde por ~80% da laranja do Brasil (Fundecitrus/IBGE).",
    factEn:
      "The citrus belt of SP and the Triângulo/Southwest of MG is the world's largest juice-orange hub and accounts for ~80% of Brazil's oranges (Fundecitrus/IBGE).",
  },
  cacau: {
    ufs: ["BA", "PA", "RO"],
    factPt:
      "BA é a referência histórica do cacau e o PA lidera em produtividade — os dois praticamente empatam em volume (46% cada); RO é o 4º produtor nacional, em expansão (IBGE PAM 2024/CEPLAC).",
    factEn:
      "BA is the historic cocoa reference and PA leads in yield — the two are virtually tied in volume (46% each); RO is the 4th-largest national producer, and expanding (IBGE PAM 2024/CEPLAC).",
  },
  banana: {
    ufs: ["BA", "SP", "MG", "PE"],
    factPt:
      "SP lidera a banana nacional (13,7%), seguido de MG (12,0%) e da BA (11,9%), maior produtora do Nordeste; PE é o 5º produtor do país (9,2%) (IBGE PAM 2024).",
    factEn:
      "SP leads Brazil's banana output (13.7%), followed by MG (12.0%) and BA (11.9%), the Northeast's largest producer; PE is the country's 5th-largest (9.2%) (IBGE PAM 2024).",
  },
  manga: {
    ufs: ["BA", "PE", "MG", "RN"],
    factPt:
      "BA (46%) e PE (29%) — o Vale do São Francisco — lideram a manga nacional e de exportação; MG é o 4º produtor, com o polo irrigado de Jaíba/Janaúba, e o RN o 6º, no polo Açu-Mossoró (IBGE PAM 2024/Embrapa).",
    factEn:
      "BA (46%) and PE (29%) — the São Francisco Valley — lead national and export mango; MG is the 4th producer, with the irrigated Jaíba/Janaúba hub, and RN the 6th, in the Açu-Mossoró hub (IBGE PAM 2024/Embrapa).",
  },
  uva: {
    ufs: ["PE", "BA", "RS", "SC"],
    factPt:
      "PE lidera a uva do Nordeste (85% da área do BNB) e, com a BA, forma o Vale do São Francisco — Petrolina, Lagoa Grande, Juazeiro e Casa Nova respondem por ~95% da uva exportada pelo Brasil; RS lidera o vinho no Sul e SC, 6ª produtora, destaca-se com os vinhos de altitude de São Joaquim (BNB/ETENE, Valexport/ComexStat, IBGE PAM 2024/Epagri).",
    factEn:
      "PE leads Northeast grapes (85% of BNB area) and, with BA, forms the São Francisco Valley — Petrolina, Lagoa Grande, Juazeiro and Casa Nova ship ~95% of Brazil's exported grapes; RS leads Southern wine and SC, the 6th-largest producer, stands out with São Joaquim's high-altitude wines (BNB/ETENE, Valexport/ComexStat, IBGE PAM 2024/Epagri).",
  },
  melao: {
    ufs: ["RN", "CE"],
    factPt:
      "RN responde por ~62% do melão nacional — polo Mossoró/Açu, líder em exportação; o CE é o 3º maior produtor, com ~8% da produção do país (IBGE PAM 2024).",
    factEn:
      "RN accounts for ~62% of Brazil's melon — the Mossoró/Açu hub leads exports; CE is the 3rd largest producer, with ~8% of national output (IBGE PAM 2024).",
  },
  mamao: {
    ufs: ["BA", "ES", "CE", "RN", "MG"],
    factPt:
      "ES é o maior produtor de mamão (34,6% do volume) e a BA a 2ª (27,1%); CE (11,1%) e RN (8,8%) vêm a seguir e MG é o 5º (6%), com o mamão irrigado do Norte de Minas — os cinco somam ~88% do país (IBGE PAM 2024).",
    factEn:
      "ES is the largest papaya producer (34.6% of volume) and BA is 2nd (27.1%); CE (11.1%) and RN (8.8%) follow and MG is 5th (6%), with the irrigated papaya of northern Minas — together the five hold ~88% of Brazil's papaya (IBGE PAM 2024).",
  },
  maracuja: {
    ufs: ["BA", "CE"],
    factPt:
      "BA é a maior produtora de maracujá do país (36%); CE é o 2º, com o dobro da produtividade baiana (IBGE PAM 2023/24).",
    factEn:
      "BA is Brazil's largest passion-fruit producer (36%); CE is 2nd, with twice Bahia's yield (IBGE PAM 2023/24).",
  },
  coco: {
    ufs: ["CE", "BA", "PE", "RN", "AL", "PB"],
    factPt:
      "CE é o maior produtor de coco do Brasil (28% em 2024); o coqueiral acompanha todo o litoral do Nordeste, que concentra ~80% da produção nacional (IBGE PAM 2024/BNB-ETENE).",
    factEn:
      "CE is Brazil's largest coconut producer (28% in 2024); the palm groves line the entire Northeast coast, which holds ~80% of national output (IBGE PAM 2024/BNB-ETENE).",
  },
  acai: {
    ufs: ["PA", "AM"],
    factPt: "PA responde por ~90% do açaí nacional; AM é o 2º produtor (IBGE/OIT 2022).",
    factEn: "PA accounts for ~90% of Brazil's açaí; AM is the 2nd producer (IBGE/OIT 2022).",
  },
  caju: {
    ufs: ["CE", "PI", "RN"],
    factPt:
      "CE lidera a castanha de caju do país e, com PI e RN, concentra 92,7% da produção nacional in natura (CONAB 2025/2026).",
    factEn:
      "CE leads Brazil's cashew-nut output and, with PI and RN, holds 92.7% of national raw production (CONAB 2025/2026).",
  },
  mandioca: {
    ufs: ["PA", "BA", "PR", "SP"],
    factPt: "PA lidera a mandioca nacional e BA é a 2ª; SP e PR têm a maior produtividade, ~23 t/ha (Embrapa/IBGE).",
    factEn: "PA leads Brazil's cassava and BA is 2nd; SP and PR have the highest yields, ~23 t/ha (Embrapa/IBGE).",
  },
  melancia: {
    ufs: ["BA", "GO", "RS", "RN"],
    factPt: "GO assumiu a liderança da melancia em 2024 (13,7% do país, com Uruana à frente); a BA é a 2ª (11,7%) — Teixeira de Freitas colhe 59–71 t/ha — o RS é o 4º (8,7%) e o RN o 6º (7,2%), com a melancia irrigada do polo Açu-Mossoró (IBGE 2024/CEPEA).",
    factEn: "GO took the watermelon lead in 2024 (13.7% of Brazil, with Uruana out front); BA is 2nd (11.7%) — Teixeira de Freitas harvests 59–71 t/ha — RS is 4th (8.7%) and RN 6th (7.2%), with the irrigated watermelon of the Açu-Mossoró hub (IBGE 2024/CEPEA).",
  },
  abacaxi: {
    ufs: ["PB", "PA", "SP", "MG"],
    factPt: "PB é a maior produtora de abacaxi em volume (300,9 mi de frutos em 2024); o PA é o 2º e lidera em valor (R$1,08 bi, com Floresta do Araguaia à frente), MG é o 3º e SP tem o maior rendimento — R$128 mil/ha (IBGE).",
    factEn: "PB is Brazil's largest pineapple producer by volume (300.9 M fruits in 2024); PA is 2nd and leads in value (R$1.08 bn, with Floresta do Araguaia out front), MG is 3rd and SP has the highest returns — R$128k/ha (IBGE).",
  },
  ovinos: {
    ufs: ["BA", "PE", "RS", "CE"],
    factPt: "BA tem o maior rebanho ovino do Brasil (23%), PE é o 2º (17%), RS o 3º e CE o 4º; o Nordeste concentra 71% dos ovinos do país (IBGE PPM 2023).",
    factEn: "BA has Brazil's largest sheep flock (23%), PE is 2nd (17%), RS 3rd and CE 4th; the Northeast holds 71% of the country's sheep (IBGE PPM 2023).",
  },
  caprinos: {
    ufs: ["BA", "PE", "PI", "CE"],
    factPt: "BA lidera a caprinocultura nacional (31% do rebanho); com PE e PI, o Nordeste concentra 96% dos caprinos do país (IBGE PPM 2023).",
    factEn: "BA leads Brazil's goat farming (31% of the herd); with PE and PI, the Northeast holds 96% of the country's goats (IBGE PPM 2023).",
  },
  suinos: {
    ufs: ["SC", "PR", "RS"],
    factPt:
      "SC lidera o abate nacional de suínos (28,2% em 2025), seguida de PR (21,2%) e RS (17,9%) — o Sul concentra 67% do abate do país; o Oeste Catarinense é o coração da integração (IBGE 2025).",
    factEn:
      "SC leads Brazil's hog slaughter (28.2% in 2025), followed by PR (21.2%) and RS (17.9%) — the South holds 67% of the national total; western Santa Catarina is the heart of the integration system (IBGE 2025).",
  },
  frango_corte: {
    ufs: ["PR", "SC", "RS"],
    factPt:
      "PR lidera o abate de frangos do país (34,4% em 2025); SC (13,7%) e RS (11,4%) completam o tripé do Sul, que responde por ~60% do abate nacional (IBGE 2025).",
    factEn:
      "PR leads Brazil's chicken slaughter (34.4% in 2025); SC (13.7%) and RS (11.4%) complete the Southern tripod, which accounts for ~60% of the national total (IBGE 2025).",
  },
  tilapia: {
    ufs: ["PR", "SP", "MG", "SC"],
    factPt: "PR lidera a tilápia nacional com 27% da produção (273 mil t); SP (93,7 mil t), MG (77,5 mil t) e SC (63,4 mil t) completam o top 4 (Anuário Peixe BR).",
    factEn: "PR leads Brazil's tilapia with 27% of output (273k t); SP (93.7k t), MG (77.5k t) and SC (63.4k t) complete the top 4 (Peixe BR yearbook).",
  },
  camarao: {
    ufs: ["CE", "RN", "PB", "PE"],
    factPt: "CE lidera a carcinicultura com 110 mil das 210 mil t de camarão cultivado no país; com RN, PB e PE, os quatro somam 88,3% da produção nacional — Aracati/CE é o maior município produtor (ABCC/BNB-ETENE 2024/25).",
    factEn: "CE leads shrimp farming with 110k of Brazil's 210k t of farmed shrimp; with RN, PB and PE, the four hold 88.3% of national output — Aracati/CE is the top producing municipality (ABCC/BNB-ETENE 2024/25).",
  },
  carnauba: {
    ufs: ["PI", "CE"],
    factPt: "PI e CE concentram ~96% do pó de carnaúba do Brasil — 100% da produção é nordestina (IBGE PEVS).",
    factEn: "PI and CE hold ~96% of Brazil's carnauba powder — 100% of production is Northeastern (IBGE PEVS).",
  },
  babacu: {
    ufs: ["MA", "PI"],
    factPt: "MA responde por ~94% das amêndoas de babaçu do país; PI é o 2º (IBGE PEVS) — Vargem Grande/MA lidera entre os municípios.",
    factEn: "MA accounts for ~94% of Brazil's babassu kernels; PI is 2nd (IBGE PEVS) — Vargem Grande/MA leads among municipalities.",
  },
  pinhao: {
    ufs: ["PR", "SC", "RS"],
    factPt: "O Sul concentra ~97% do pinhão nacional (IBGE PEVS) — renda em pé das araucárias nativas.",
    factEn: "The South holds ~97% of Brazil's pine nuts (IBGE PEVS) — standing income from native araucarias.",
  },
  castanha_amazonia: {
    ufs: ["AC", "AM", "PA"],
    factPt: "AC lidera a castanha-da-amazônia, com AM e PA no pódio (IBGE PEVS); Brasiléia/AC é o maior município produtor.",
    factEn: "AC leads Brazil-nut output, with AM and PA on the podium (IBGE PEVS); Brasiléia/AC is the top producing municipality.",
  },
  piacava: {
    ufs: ["BA"],
    factPt: "BA concentra ~96% da piaçava do Brasil — Ilhéus, Nilo Peçanha e Cairu lideram (IBGE PEVS).",
    factEn: "BA holds ~96% of Brazil's piassava — Ilhéus, Nilo Peçanha and Cairu lead (IBGE PEVS).",
  },
  goiaba: {
    ufs: ["SP", "PR", "BA", "CE", "PE"],
    factPt:
      "O Nordeste é a maior região produtora de goiaba do país (47%); a BA está no top 5 nacional e PE lidera no NE (IBGE 2024 / BNB-ETENE). SP tem a maior área e o PR a maior produtividade.",
    factEn:
      "The Northeast is Brazil's largest guava-producing region (47%); BA is in the national top 5 and PE leads the NE (IBGE 2024 / BNB-ETENE). SP has the largest area and PR the highest yield.",
  },
  abacate: {
    ufs: ["SP", "MG"],
    factPt: "SP lidera o abacate nacional; com MG, concentra 68% do faturamento (IBGE) — puxado pelo avocado de exportação.",
    factEn: "SP leads Brazil's avocado; with MG it holds 68% of revenue (IBGE) — driven by export Hass.",
  },
  maca: {
    ufs: ["SC", "RS", "PR"],
    factPt: "SC lidera a maçã com 58% do valor nacional — São Joaquim sozinho faz 42% do país; com RS e PR, o Sul concentra 98% (IBGE/Epagri).",
    factEn: "SC leads apples with 58% of national value — São Joaquim alone grows 42% of Brazil's crop; with RS and PR, the South holds 98% (IBGE/Epagri).",
  },
  pessego: {
    ufs: ["RS", "SP", "SC"],
    factPt: "RS concentra ~64% do pêssego nacional (polo de Pelotas); SP é o 2º, com 17%, e lidera em produtividade (~22 t/ha); SC é o 3º maior produtor (IBGE/Epagri).",
    factEn: "RS holds ~64% of Brazil's peaches (the Pelotas hub); SP is 2nd with 17% and leads in yield (~22 t/ha); SC is the 3rd largest producer (IBGE/Epagri).",
  },
  fumo: {
    ufs: ["RS", "SC", "PR"],
    factPt: "RS, SC e PR concentram 98% do tabaco nacional; renda média ao produtor: ~R$46 mil/ha (Afubra/CONAB, safra 24/25).",
    factEn: "RS, SC and PR hold 98% of Brazil's tobacco; average producer income: ~R$46k/ha (Afubra/CONAB, 24/25 season).",
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
