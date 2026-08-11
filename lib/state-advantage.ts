/**
 * State production ADVANTAGE by commodity — which UFs lead a given crop, with
 * sourced productivity/share facts. Used to add a strategic-context line to
 * the calculator: "seu estado é forte em X".
 *
 * REAUDITORIA GERAL 27/jul/2026 — todo fato reconferido número a número
 * contra a edição mais recente de cada fonte (manifesto: docs/fontes-jul2026.md):
 * - IBGE PAM 2024 (11/set/2025) — última PAM; verificação direta na API SIDRA
 *   (t.5457/t.1612). PPM 2024 (16/set/2025) e PEVS 2024 (25/set/2025, resultado
 *   preliminar) idem (t.3939/t.74/t.289).
 * - CONAB grãos: 10º levantamento safra 2025/26 (14/jul/2026) — soja, milho,
 *   algodão e o share de grãos por UF saem da planilha oficial do boletim.
 * - CONAB café: 2º levantamento 2026 (21/mai/2026, safra recorde 66,7 mi sacas).
 * - Abate 2025 fechado (IBGE, divulgado fev/2026) para suínos e frango;
 *   Anuário Peixe BR 2026 (dados 2025) para tilápia; BNB-ETENE dez/2025 para
 *   camarão e mar/2026 para caju; Fundecitrus mai/2026 para a safra 2026/27.
 * - Afirmações municipais e de área BNB não reconferíveis nesta rodada estão
 *   marcadas no relatório do PR (ex.: SP R$128 mil/ha no abacaxi, Teixeira de
 *   Freitas 59–71 t/ha) — mantidas por ausência de indício contrário.
 *
 * Principais correções desta reauditoria (fonte no fato): mandioca (BA caiu
 * de 2ª para fora do top 5), pinhão (Sul é ~70%, não ~97%; MG é o 3º),
 * piaçava (BA ~49%, dividindo a liderança com o AM), castanha-da-amazônia
 * (AM lidera, não o AC), maçã (RS 1º em volume, SC 1ª em valor; São Joaquim
 * 25%, não 42%), babaçu (MA ~84%, não ~94%), tilápia (PR tem 38,6% da
 * TILÁPIA; os números antigos eram de piscicultura total), melão (CE é 4º),
 * goiaba (PE é o maior produtor), abacate (61% do valor, não 68%), fumo
 * (96%, não 98%), soja/grãos/algodão/café (safras 25/26 e 2026 vigentes),
 * ovinos/caprinos (PPM 2023 → PPM 2024), açaí (fonte 2022 → PAM/PEVS 2024).
 *
 * NOVAS VANTAGENS (reauditoria jul/2026, backlog do guarda): feijao, cebola,
 * trigo, pecuaria_leite, arroz, batata, tomate — dados brutos extraídos da
 * API SIDRA (PAM 2024 t.1612; PPM 2024 t.74) e CONAB 10º lev. 25/26.
 *
 * REGRA DE CONSISTÊNCIA: todo estado listado em `ufs` precisa estar coberto
 * pelo fato — nominalmente ou por um dado regional que o inclua (ex.: "o
 * Nordeste concentra X%" cobre BA/PE/CE/RN/PB listados; "MATOPIBA" cobre
 * MA/PI/TO). Ao mexer no `ufs`, reescrever o fato junto, com fonte.
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
      "MT, PR, RS e GO concentram ~64% da safra nacional de grãos (CONAB, 10º levantamento 2025/26); MG e BA vêm logo atrás: 14,3 e 10,3 mi t só de soja e milho em 2024 (IBGE PAM); e no MATOPIBA, a fronteira que mais cresce, TO, MA e PI colheram juntos 16 mi t só de soja na 25/26 (CONAB).",
    factEn:
      "MT, PR, RS and GO account for ~64% of Brazil's grain harvest (CONAB, 10th survey of 2025/26); MG and BA come right behind: 14.3 and 10.3 M t of soybeans and corn alone in 2024 (IBGE PAM); and in MATOPIBA, the fastest-growing frontier, TO, MA and PI together harvested 16 M t of soybeans alone in 25/26 (CONAB).",
  },
  cana: {
    ufs: ["SP", "MG", "GO", "PR", "AL", "PE", "PB"],
    factPt:
      "SP concentra 55% da cana do país; MG (11%) e GO (10,7%) disputam o 2º posto e o PR é o 5º; no Nordeste, o cinturão histórico da Zona da Mata tem AL como maior produtor regional (18,7 mi t, 7º do país), seguido de PE (16,1 mi t) e PB (IBGE PAM 2024).",
    factEn:
      "SP holds 55% of Brazil's sugarcane; MG (11%) and GO (10.7%) vie for 2nd place and PR is 5th; in the Northeast, the historic Zona da Mata belt has AL as the regional leader (18.7 M t, 7th nationally), followed by PE (16.1 M t) and PB (IBGE PAM 2024).",
  },
  // by specific crop
  soja: {
    ufs: ["BA", "MT", "GO", "PR", "RS", "MG", "MA", "PI", "TO"],
    factPt:
      "Na safra 2025/26 (CONAB, 10º levantamento, jul/2026), MT colheu 51,6 mi t de soja (líder há 26 anos), PR 22,0 mi t (2º), GO 20,1 mi t (3º) e RS 18,6 mi t (4º). A BA (9,4 mi t, 6ª) teve o maior rendimento entre os grandes produtores, 4.260 kg/ha, MG colheu 9,2 mi t, e a fronteira do MATOPIBA, TO (6,1 mi t), MA (5,5 mi t) e PI (4,4 mi t), segue a que mais cresce no país.",
    factEn:
      "In the 2025/26 season (CONAB, 10th survey, Jul/2026), MT harvested 51.6 M t of soybeans (the leader for 26 years), PR 22.0 M t (2nd), GO 20.1 M t (3rd) and RS 18.6 M t (4th). BA (9.4 M t, 6th) had the highest yield among the big producers, 4,260 kg/ha, MG harvested 9.2 M t, and the MATOPIBA frontier, TO (6.1 M t), MA (5.5 M t) and PI (4.4 M t), remains the country's fastest-growing.",
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
    factPt:
      "MT responde por ~70% do algodão nacional (69% da pluma na safra 2025/26); BA é o 2º polo, com 21% (CONAB, 10º levantamento 2025/26).",
    factEn:
      "MT accounts for ~70% of national cotton (69% of lint in the 2025/26 season); BA is the 2nd hub, with 21% (CONAB, 10th survey of 2025/26).",
  },
  cafe: {
    ufs: ["MG", "ES", "SP", "BA", "RO"],
    factPt:
      "Na safra recorde de 2026 (66,7 mi de sacas), MG lidera com 33,4 mi e o ES é o 2º, com 18,0 mi (13,6 mi de conilon, maior do país na variedade); SP produz 5,9 mi, 100% arábica. A BA é a 4ª produtora e a maior do Nordeste: 4,7 mi de sacas, com arábica no Planalto (Vitória da Conquista, Chapada Diamantina) e conilon no Sul, onde é a 2ª do país na variedade (3,5 mi); e RO é a 5ª, com 2,8 mi de sacas 100% conilon e a IG 'Matas de Rondônia' (CONAB, 2º levantamento 2026; pela PAM 2024, RO é o 2º volume de canephora e a BA o 3º).",
    factEn:
      "In the record 2026 season (66.7 M bags), MG leads with 33.4 M and ES is 2nd with 18.0 M (13.6 M of conilon, the country's largest in the variety); SP grows 5.9 M bags, 100% arabica. BA is the 4th producer and the Northeast's biggest: 4.7 M bags, arabica on the Planalto highlands (Vitória da Conquista, Chapada Diamantina) and conilon in the south, where it ranks 2nd nationally in the variety (3.5 M); and RO is 5th, with 2.8 M bags of pure conilon under the 'Matas de Rondônia' GI (CONAB, 2nd survey of 2026; by the PAM 2024 yardstick, RO holds the 2nd canephora volume and BA the 3rd).",
  },
  citros: {
    ufs: ["SP", "MG"],
    factPt:
      "O cinturão citrícola de SP e do Triângulo/Sudoeste de MG é o maior polo de laranja para suco do mundo e responde por ~82% da laranja do Brasil (IBGE PAM 2024); a safra 2026/27 do cinturão está estimada em 255 mi de caixas (Fundecitrus, mai/2026).",
    factEn:
      "The citrus belt of SP and the Triângulo/Southwest of MG is the world's largest juice-orange hub and accounts for ~82% of Brazil's oranges (IBGE PAM 2024); the belt's 2026/27 crop is estimated at 255 M boxes (Fundecitrus, May/2026).",
  },
  cacau: {
    ufs: ["BA", "PA", "RO"],
    factPt:
      "BA é a referência histórica do cacau e o PA lidera em produtividade: os dois praticamente empatam em volume (46% cada); RO é o 4º produtor nacional, em expansão (IBGE PAM 2024/CEPLAC).",
    factEn:
      "BA is the historic cocoa reference and PA leads in yield: the two are virtually tied in volume (46% each); RO is the 4th-largest national producer, and expanding (IBGE PAM 2024/CEPLAC).",
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
      "BA (46%) e PE (29%), o Vale do São Francisco, lideram a manga nacional e de exportação; MG é o 4º produtor, com o polo irrigado de Jaíba/Janaúba, e o RN o 6º, no polo Açu-Mossoró (IBGE PAM 2024/Embrapa).",
    factEn:
      "BA (46%) and PE (29%), the São Francisco Valley, lead national and export mango; MG is the 4th producer, with the irrigated Jaíba/Janaúba hub, and RN the 6th, in the Açu-Mossoró hub (IBGE PAM 2024/Embrapa).",
  },
  uva: {
    ufs: ["PE", "BA", "RS", "SC"],
    factPt:
      "PE é o maior produtor de uva do país (755 mil t na PAM 2024) e, com a BA, forma o Vale do São Francisco: Petrolina, Lagoa Grande, Juazeiro e Casa Nova respondem por ~95% da uva exportada pelo Brasil (Valexport/ComexStat 2024); o RS, 2º produtor, lidera o vinho no Sul e SC, 6ª produtora (2,1%), destaca-se com os vinhos de altitude de São Joaquim (IBGE PAM 2024/Epagri).",
    factEn:
      "PE is Brazil's largest grape producer (755k t in PAM 2024) and, with BA, forms the São Francisco Valley: Petrolina, Lagoa Grande, Juazeiro and Casa Nova ship ~95% of Brazil's exported grapes (Valexport/ComexStat 2024); RS, the 2nd producer, leads Southern wine and SC, the 6th-largest (2.1%), stands out with São Joaquim's high-altitude wines (IBGE PAM 2024/Epagri).",
  },
  melao: {
    ufs: ["RN", "PE", "BA", "CE"],
    factPt:
      "RN responde por ~62% do melão nacional: o polo Mossoró/Açu lidera a exportação; PE é o 2º produtor (12%), a BA a 3ª (11%) e o CE o 4º (8,7%) (IBGE PAM 2024).",
    factEn:
      "RN accounts for ~62% of Brazil's melon: the Mossoró/Açu hub leads exports; PE is the 2nd producer (12%), BA 3rd (11%) and CE 4th (8.7%) (IBGE PAM 2024).",
  },
  mamao: {
    ufs: ["BA", "ES", "CE", "RN", "MG"],
    factPt:
      "ES é o maior produtor de mamão (34,6% do volume) e a BA a 2ª (27,1%); CE (11,1%) e RN (8,8%) vêm a seguir e MG é o 5º (6%), com o mamão irrigado do Norte de Minas. Os cinco somam ~88% do país (IBGE PAM 2024).",
    factEn:
      "ES is the largest papaya producer (34.6% of volume) and BA is 2nd (27.1%); CE (11.1%) and RN (8.8%) follow and MG is 5th (6%), with the irrigated papaya of northern Minas. Together the five hold ~88% of Brazil's papaya (IBGE PAM 2024).",
  },
  maracuja: {
    ufs: ["BA", "CE"],
    factPt:
      "BA é a maior produtora de maracujá do país em volume (36%); o CE é o 2º, com quase o dobro da produtividade baiana e o maior valor de produção nacional na PAM 2024 (IBGE).",
    factEn:
      "BA is Brazil's largest passion-fruit producer by volume (36%); CE is 2nd, with nearly twice Bahia's yield and the country's highest production value in PAM 2024 (IBGE).",
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
    factPt:
      "PA responde por ~90% do açaí nacional, somando cultivo e extrativismo; AM é o 2º produtor (IBGE PAM/PEVS 2024).",
    factEn:
      "PA accounts for ~90% of Brazil's açaí, adding cultivation and wild harvest; AM is the 2nd producer (IBGE PAM/PEVS 2024).",
  },
  caju: {
    ufs: ["CE", "PI", "RN"],
    factPt:
      "CE lidera a castanha de caju do país (55% da safra 2026 prevista); com PI (23%) e RN, concentra ~93% da produção nacional in natura (CONAB/BNB-ETENE 2026).",
    factEn:
      "CE leads Brazil's cashew-nut output (55% of the projected 2026 crop); with PI (23%) and RN, it holds ~93% of national raw production (CONAB/BNB-ETENE 2026).",
  },
  mandioca: {
    ufs: ["PA", "PR", "SP", "BA"],
    factPt:
      "PA lidera a mandioca nacional (20,8%), o PR é o 2º (19,4%) e SP o 3º. PR e SP têm as maiores produtividades, 26,8 e 21,7 t/ha; no Nordeste, CE e BA são as maiores produtoras, e na BA polos tradicionais de sequeiro como Irecê mantêm a cultura no semiárido (IBGE PAM 2024).",
    factEn:
      "PA leads Brazil's cassava (20.8%), PR is 2nd (19.4%) and SP 3rd. PR and SP have the highest yields, 26.8 and 21.7 t/ha; in the Northeast, CE and BA are the largest producers, and in BA traditional rainfed hubs like Irecê keep the crop alive in the semi-arid (IBGE PAM 2024).",
  },
  melancia: {
    ufs: ["BA", "GO", "RS", "RN", "PE"],
    factPt:
      "GO assumiu a liderança da melancia em 2024 (13,7% do país, com Uruana à frente); a BA é a 2ª (11,7%; Teixeira de Freitas colhe 59–71 t/ha), o RS é o 4º (8,7%), PE o 5º (7,7%) e o RN o 6º (7,2%), com a melancia irrigada do polo Açu-Mossoró; no semiárido, a melancia de sequeiro plantada na quadra chuvosa é tradição da agricultura familiar (IBGE PAM 2024/CEPEA/Embrapa Semiárido).",
    factEn:
      "GO took the watermelon lead in 2024 (13.7% of Brazil, with Uruana out front); BA is 2nd (11.7%; Teixeira de Freitas harvests 59–71 t/ha), RS is 4th (8.7%), PE 5th (7.7%) and RN 6th (7.2%), with the irrigated watermelon of the Açu-Mossoró hub; in the semi-arid, rainy-season rainfed watermelon is a family-farming tradition (IBGE PAM 2024/CEPEA/Embrapa Semiárido).",
  },
  abacaxi: {
    ufs: ["PB", "PA", "SP", "MG"],
    factPt:
      "PB é a maior produtora de abacaxi em volume (300,9 mi de frutos em 2024); o PA é o 2º e lidera em valor (R$1,08 bi, com Floresta do Araguaia à frente), MG é o 3º e SP tem o maior rendimento: R$128 mil/ha (IBGE).",
    factEn:
      "PB is Brazil's largest pineapple producer by volume (300.9 M fruits in 2024); PA is 2nd and leads in value (R$1.08 bn, with Floresta do Araguaia out front), MG is 3rd and SP has the highest returns: R$128k/ha (IBGE).",
  },
  ovinos: {
    ufs: ["BA", "PE", "RS", "CE", "PB"],
    factPt:
      "BA tem o maior rebanho ovino do Brasil (23,5%, 5,1 mi de cabeças), PE é o 2º (18%), RS o 3º e CE o 4º; o Nordeste concentra 73,5% dos ovinos do país (IBGE PPM 2024).",
    factEn:
      "BA has Brazil's largest sheep flock (23.5%, 5.1 M head), PE is 2nd (18%), RS 3rd and CE 4th; the Northeast holds 73.5% of the country's sheep (IBGE PPM 2024).",
  },
  caprinos: {
    ufs: ["BA", "PE", "PI", "CE", "PB"],
    factPt:
      "BA lidera a caprinocultura nacional (31,6% do rebanho, 4,2 mi de cabeças); PE é a 2ª (25,7%) e o PI o 3º (15,5%). O Nordeste concentra 96,3% dos caprinos do país (IBGE PPM 2024).",
    factEn:
      "BA leads Brazil's goat farming (31.6% of the herd, 4.2 M head); PE is 2nd (25.7%) and PI 3rd (15.5%). The Northeast holds 96.3% of the country's goats (IBGE PPM 2024).",
  },
  suinos: {
    ufs: ["SC", "PR", "RS"],
    factPt:
      "SC lidera o abate nacional de suínos (28,2% em 2025), seguida de PR (21,2%) e RS (17,9%). O Sul concentra 67% do abate do país; o Oeste Catarinense é o coração da integração (IBGE, abate 2025).",
    factEn:
      "SC leads Brazil's hog slaughter (28.2% in 2025), followed by PR (21.2%) and RS (17.9%). The South holds 67% of the national total; western Santa Catarina is the heart of the integration system (IBGE, 2025 slaughter).",
  },
  frango_corte: {
    ufs: ["PR", "SC", "RS"],
    factPt:
      "PR lidera o abate de frangos do país (34,4% em 2025); SC (13,7%) e RS (11,4%) completam o tripé do Sul, que responde por ~60% do abate nacional (IBGE, abate 2025).",
    factEn:
      "PR leads Brazil's chicken slaughter (34.4% in 2025); SC (13.7%) and RS (11.4%) complete the Southern tripod, which accounts for ~60% of the national total (IBGE, 2025 slaughter).",
  },
  tilapia: {
    ufs: ["PR", "SP", "MG", "SC"],
    factPt:
      "PR lidera a tilápia com 38,6% da produção nacional (273 mil das 707,5 mil t); SP (88,5 mil t), MG (73,5 mil t) e SC (52,7 mil t) completam o top 4 (Anuário Peixe BR 2026, dados 2025).",
    factEn:
      "PR leads Brazil's tilapia with 38.6% of national output (273k of 707.5k t); SP (88.5k t), MG (73.5k t) and SC (52.7k t) complete the top 4 (Peixe BR 2026 yearbook, 2025 data).",
  },
  camarao: {
    ufs: ["CE", "RN", "PB", "PE"],
    factPt:
      "CE lidera a carcinicultura com 110 mil das 210 mil t de camarão cultivado no país; com RN, PB e PE, os quatro somam 88,3% da produção nacional. Aracati/CE é o maior município produtor (ABCC/BNB-ETENE, dez/2025).",
    factEn:
      "CE leads shrimp farming with 110k of Brazil's 210k t of farmed shrimp; with RN, PB and PE, the four hold 88.3% of national output. Aracati/CE is the top producing municipality (ABCC/BNB-ETENE, Dec/2025).",
  },
  carnauba: {
    ufs: ["PI", "CE"],
    factPt:
      "PI e CE concentram ~95% do pó de carnaúba do Brasil: a produção é 100% nordestina (IBGE PEVS 2024).",
    factEn:
      "PI and CE hold ~95% of Brazil's carnauba powder: production is 100% Northeastern (IBGE PEVS 2024).",
  },
  babacu: {
    ufs: ["MA", "PI"],
    factPt:
      "MA responde por ~84% das amêndoas de babaçu do país; PI é o 2º, com ~10% (IBGE PEVS 2024).",
    factEn:
      "MA accounts for ~84% of Brazil's babassu kernels; PI is 2nd, with ~10% (IBGE PEVS 2024).",
  },
  pinhao: {
    ufs: ["PR", "SC", "RS"],
    factPt:
      "PR (35%) e SC (28%) lideram o pinhão nacional e o RS está no top 4: o Sul concentra ~70% da colheita, com MG hoje em 3º entre os estados (IBGE PEVS 2024). Renda em pé das araucárias nativas.",
    factEn:
      "PR (35%) and SC (28%) lead Brazil's pine nuts and RS is in the top 4: the South holds ~70% of the harvest, with MG now 3rd among states (IBGE PEVS 2024). Standing income from native araucarias.",
  },
  castanha_amazonia: {
    ufs: ["AC", "AM", "PA"],
    factPt:
      "AM lidera a castanha-da-amazônia (33%), com AC (28,5%) e PA (25%) no pódio (IBGE PEVS 2024).",
    factEn:
      "AM leads Brazil-nut output (33%), with AC (28.5%) and PA (25%) on the podium (IBGE PEVS 2024).",
  },
  piacava: {
    ufs: ["BA"],
    factPt:
      "BA é a referência histórica da piaçava: quase metade da produção nacional (49%), no litoral de Ilhéus, Nilo Peçanha e Cairu; e hoje divide a liderança com o AM (IBGE PEVS 2024, resultado preliminar).",
    factEn:
      "BA is the historic piassava reference: nearly half of national output (49%), along the Ilhéus, Nilo Peçanha and Cairu coast; and today shares the lead with AM (IBGE PEVS 2024, preliminary).",
  },
  goiaba: {
    ufs: ["PE", "SP", "BA", "PR", "CE"],
    factPt:
      "PE é o maior produtor de goiaba do país (34% do volume, com a maior área plantada), SP é o 2º e a BA a 3ª (8,6%). O Nordeste responde por quase metade da produção nacional; PR e PE dividem a maior produtividade, ~30 t/ha (IBGE PAM 2024).",
    factEn:
      "PE is Brazil's largest guava producer (34% of volume, with the largest planted area), SP is 2nd and BA 3rd (8.6%). The Northeast grows nearly half the national crop; PR and PE share the highest yield, ~30 t/ha (IBGE PAM 2024).",
  },
  abacate: {
    ufs: ["SP", "MG"],
    factPt:
      "SP lidera o abacate nacional; com MG, concentra 61% do valor da produção (IBGE PAM 2024), puxado pelo avocado de exportação.",
    factEn:
      "SP leads Brazil's avocado; with MG it holds 61% of production value (IBGE PAM 2024), driven by export Hass.",
  },
  maca: {
    ufs: ["SC", "RS", "PR"],
    factPt:
      "A maçã é praticamente toda do Sul (~99% do valor): o RS lidera em volume (49,5%) e SC em valor (50,2%; São Joaquim/SC sozinho colhe 25% do país), com o PR completando o trio (IBGE PAM 2024/Epagri).",
    factEn:
      "Apples are almost entirely Southern (~99% of value): RS leads in volume (49.5%) and SC in value (50.2%; São Joaquim/SC alone grows 25% of Brazil's crop), with PR completing the trio (IBGE PAM 2024/Epagri).",
  },
  pessego: {
    ufs: ["RS", "SP", "SC"],
    factPt:
      "RS concentra ~64% do pêssego nacional (polo de Pelotas); SP é o 2º, com 17%, e lidera em produtividade (~22 t/ha); SC é o 3º maior produtor (IBGE PAM 2024/Epagri).",
    factEn:
      "RS holds ~64% of Brazil's peaches (the Pelotas hub); SP is 2nd with 17% and leads in yield (~22 t/ha); SC is the 3rd largest producer (IBGE PAM 2024/Epagri).",
  },
  fumo: {
    ufs: ["RS", "SC", "PR"],
    factPt:
      "RS, SC e PR concentram 96% do tabaco nacional (IBGE PAM 2024); renda média ao produtor: ~R$46 mil/ha (Afubra/CONAB; safra 24/25 fechada em 719,9 mil t).",
    factEn:
      "RS, SC and PR hold 96% of Brazil's tobacco (IBGE PAM 2024); average producer income: ~R$46k/ha (Afubra/CONAB; the 24/25 season closed at 719.9k t).",
  },
  // ── NOVAS VANTAGENS (reauditoria jul/2026 — backlog do guarda) ──
  feijao: {
    ufs: ["PR", "MG", "GO", "MT", "SP", "BA"],
    factPt:
      "PR é o maior produtor de feijão do país (28,5%), seguido de MG (17,6%), GO (12,1%), MT (9,5%) e SP (6,6%); a BA é a 6ª e a maior do Nordeste (163 mil t), hoje puxada pelo cerrado do Oeste, com o polo de Irecê como referência histórica do feijão de sequeiro do semiárido (IBGE PAM 2024; CONAB 2025/26).",
    factEn:
      "PR is Brazil's largest bean producer (28.5%), followed by MG (17.6%), GO (12.1%), MT (9.5%) and SP (6.6%); BA is 6th and the Northeast's largest (163k t), driven today by the western Cerrado, with the Irecê hub as the historic reference for rainfed beans in the semi-arid (IBGE PAM 2024; CONAB 2025/26).",
  },
  cebola: {
    ufs: ["SC", "BA", "MG", "GO", "SP"],
    factPt:
      "SC lidera a cebola nacional com 31,8% (Alto Vale do Itajaí); a BA é a 2ª (17,6%), com o polo de Irecê (Cafarnaum, João Dourado e Canarana), ao lado da cebola irrigada do São Francisco (Sento Sé, Casa Nova) e da Chapada Diamantina; MG (12,4%), GO (11,9%) e SP (9,9%) completam o top 5 (IBGE PAM 2024).",
    factEn:
      "SC leads Brazil's onions with 31.8% (Alto Vale do Itajaí); BA is 2nd (17.6%), with the Irecê hub (Cafarnaum, João Dourado and Canarana), alongside the irrigated onions of the São Francisco (Sento Sé, Casa Nova) and the Chapada Diamantina; MG (12.4%), GO (11.9%) and SP (9.9%) complete the top 5 (IBGE PAM 2024).",
  },
  trigo: {
    ufs: ["RS", "PR", "SC", "SP", "MG"],
    factPt:
      "RS é o maior produtor de trigo do país (48%) e o PR o 2º (32%). O Sul concentra 86% da safra, com as Missões e o Noroeste gaúcho (São Luiz Gonzaga, Giruá) entre os maiores polos; SC, SP e MG respondem por ~5,5% cada (IBGE PAM 2024; CONAB projeta 6,0 mi t na 25/26).",
    factEn:
      "RS is Brazil's largest wheat producer (48%) and PR is 2nd (32%). The South holds 86% of the crop, with the Missões and the RS Northwest (São Luiz Gonzaga, Giruá) among the biggest hubs; SC, SP and MG account for ~5.5% each (IBGE PAM 2024; CONAB projects 6.0 M t in 25/26).",
  },
  pecuaria_leite: {
    ufs: ["MG", "PR", "RS", "SC", "GO"],
    factPt:
      "MG lidera o leite com 27% da produção nacional (9,8 bi de litros na PPM 2024); PR (12,9%), RS (11,3%), SC (9,2%) e GO (8,2%) completam o top 5. Castro/PR é o maior município produtor do país e o Noroeste gaúcho é a maior bacia leiteira nacional: cerca de dois terços do leite do RS (IBGE PPM 2024; Embrapa, Anuário Leite 2025).",
    factEn:
      "MG leads milk with 27% of national output (9.8 B litres in PPM 2024); PR (12.9%), RS (11.3%), SC (9.2%) and GO (8.2%) complete the top 5. Castro/PR is the country's largest producing municipality and the RS Northwest is Brazil's biggest dairy basin: about two-thirds of the state's milk (IBGE PPM 2024; Embrapa, Anuário Leite 2025).",
  },
  arroz: {
    ufs: ["RS", "SC", "TO", "MT", "MA", "PI"],
    factPt:
      "RS concentra ~67–70% do arroz do país (Uruguaiana, Santa Vitória do Palmar e Itaqui, na Fronteira Oeste e Metade Sul, são os maiores municípios) e SC é o 2º produtor (10,6%); o TO é o 3º (7,3%), com as várzeas tropicais de Lagoa da Confusão e Formoso do Araguaia, e MT e o MATOPIBA de MA e PI completam o quadro com o arroz de terras altas (IBGE PAM 2024; CONAB 2025/26).",
    factEn:
      "RS holds ~67–70% of Brazil's rice (Uruguaiana, Santa Vitória do Palmar and Itaqui, in the western frontier and southern half, are the biggest municipalities) and SC is the 2nd producer (10.6%); TO ranks 3rd (7.3%), with the tropical floodplains of Lagoa da Confusão and Formoso do Araguaia, while MT and the MA/PI MATOPIBA round it out with upland rice (IBGE PAM 2024; CONAB 2025/26).",
  },
  batata: {
    ufs: ["MG", "PR", "SP", "BA", "RS"],
    factPt:
      "MG lidera a batata com 34% da produção nacional; PR (16,7%) e SP (15,5%) vêm a seguir e o RS é o 5º (10,6%). A BA é a 4ª (12,2%), e praticamente toda a batata baiana sai de dois municípios da Chapada Diamantina, Ibicoara (290 mil t) e Mucugê (221 mil t), sob pivô central em altitude (IBGE PAM 2024).",
    factEn:
      "MG leads potatoes with 34% of national output; PR (16.7%) and SP (15.5%) follow and RS is 5th (10.6%). BA ranks 4th (12.2%), and virtually all of Bahia's potatoes come from two Chapada Diamantina municipalities, Ibicoara (290k t) and Mucugê (221k t), under center-pivot irrigation at altitude (IBGE PAM 2024).",
  },
  tomate: {
    ufs: ["GO", "SP", "MG", "BA", "PR"],
    factPt:
      "GO lidera o tomate com 33% da produção nacional (o cerrado goiano domina o tomate industrial), à frente de SP (19%) e MG (13,5%); o PR é o 5º. A BA é a 4ª (7,6%), puxada pelo polo irrigado da Chapada Diamantina: Ibicoara, Mucugê e Barra da Estiva fazem mais da metade do tomate baiano (IBGE PAM 2024).",
    factEn:
      "GO leads tomatoes with 33% of national output (the Goiás Cerrado dominates processing tomatoes), ahead of SP (19%) and MG (13.5%); PR is 5th. BA ranks 4th (7.6%), driven by the irrigated Chapada Diamantina hub: Ibicoara, Mucugê and Barra da Estiva grow over half of Bahia's tomatoes (IBGE PAM 2024).",
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
