/**
 * gera-meso-classificacao.mjs — RODAR LOCALMENTE, depois do ingest.
 *
 * FASE 1 — PROPOSTA. Este script NÃO escreve em lib/. Ele só lê
 * lib/regioes-agricolas.ts (somente leitura) e produz dois artefatos para
 * revisão humana:
 *   - scripts/out/meso-classificacao-proposta.xlsx  (1 linha por mesorregião)
 *   - scripts/out/meso-classificacao-RESUMO.md
 *
 * A ideia: hoje só ~77 municípios-âncora alcançam uma região curada; os
 * outros ~5.500 caem direto no retrato genérico de bioma. Uma camada
 * intermediária mesorregião→região resolveria boa parte disso. Aqui está
 * a proposta de para onde cada uma das 137 mesorregiões deveria apontar.
 *
 * Como a classificação foi montada (doutrina, aplicada linha a linha):
 *   A) A mesorregião contém âncora(s) de MUNI_TO_REGIAO E o dado da PAM é
 *      compatível com as vocações daquela região  → ALTA_CONFIANCA.
 *   B) Contém âncora mas o dado da PAM contradiz a vocação da região →
 *      NÃO usa ALTA_CONFIANCA; vai para BIOMA e entra em "verificar". As
 *      âncoras não são afetadas: elas continuam resolvendo pelo mapa
 *      município→região, que é consultado antes da camada mesorregional.
 *   C) Sem âncora, mas o produto líder e o top 3 batem inequivocamente com
 *      UMA região curada (ou o retrato dela cita a área nominalmente) →
 *      ALTA_CONFIANCA, em geral com confiança "media".
 *   D) Vocação forte e nítida sem região curada correspondente →
 *      CANDIDATA_NOVA_REGIAO (destino vazio, de propósito).
 *   E) Resto → BIOMA: o fallback honesto. Produto líder em valor NÃO vira
 *      vocação automaticamente; onde a dominância é pecuária e não existe
 *      região de pecuária compatível, o destino é bioma.
 *
 * A tabela CURADORIA abaixo é o julgamento (balde, destino, confiança e a
 * frase da justificativa). Nenhum número é digitado nela: os percentuais,
 * o produto líder, o top 3, as UFs, a contagem de municípios e as âncoras
 * são interpolados a partir de scripts/out/pam-mesorregiao.json e da malha
 * oficial. Assim a planilha não tem como citar um dado que não existe.
 *
 * Uso:  node scripts/gera-meso-classificacao.mjs
 */

import { readFile, writeFile } from "node:fs/promises";
import { escreverXlsx } from "./xlsx-min.mjs";

const LIB = "lib/regioes-agricolas.ts"; // SOMENTE LEITURA
const PAM = "scripts/out/pam-mesorregiao.json";
const MUNI = "scripts/out/muni-mesorregiao.json";
const XLSX = "scripts/out/meso-classificacao-proposta.xlsx";
const RESUMO = "scripts/out/meso-classificacao-RESUMO.md";

const FONTE_BASE =
  "IBGE PAM 2024 (SIDRA t5457) + Censo Agro 2017 (SIDRA t6897)";

/** Açúcar sintático para a tabela ficar legível. */
const alta = (destino, confianca, nota, verificar = false) => ({
  balde: "ALTA_CONFIANCA",
  destino,
  confianca,
  nota,
  verificar,
});
const bioma = (destino, confianca, nota, verificar = false) => ({
  balde: "BIOMA",
  destino,
  confianca,
  nota,
  verificar,
});
const candidata = (confianca, nota, verificar = false) => ({
  balde: "CANDIDATA_NOVA_REGIAO",
  destino: "",
  confianca,
  nota,
  verificar,
});

const CURADORIA = {
  // ── NORTE ──
  1101: bioma(
    "amazonia",
    "media",
    "O café canephora tem peso relevante e sugere parentesco com ro-cafe-robusta, mas a soja lidera e a dominância é pecuária — o retrato do bioma é a leitura honesta",
    true,
  ),
  1102: alta(
    "ro-cafe-robusta",
    "alta",
    "Contém as âncoras de Rondônia e o café aparece entre os líderes de valor com predominância canephora, exatamente a vocação da região curada",
  ),
  1201: bioma(
    "amazonia",
    "alta",
    "Mandioca e banana de subsistência lideram; nenhuma região curada representa o Vale do Juruá",
  ),
  1202: bioma(
    "amazonia",
    "media",
    "Mandioca, soja e milho dividem o valor e a dominância é pecuária; nenhuma região curada cobre o Vale do Acre",
  ),
  1301: bioma(
    "amazonia",
    "alta",
    "Mandioca e banana de várzea; sem região curada correspondente",
  ),
  1302: bioma(
    "amazonia",
    "alta",
    "Mandioca, banana e açaí em economia de floresta e rio; sem região curada correspondente",
  ),
  1303: bioma(
    "amazonia",
    "media",
    "Mandioca lidera com cana e banana atrás, perfil misto sem região curada",
  ),
  1304: bioma(
    "amazonia",
    "media",
    "Mandioca e banana lideram, com soja entrando pela frente sul; perfil misto",
  ),
  1401: bioma(
    "amazonia",
    "baixa",
    "A soja lidera (frente de grãos do lavrado), mas nenhuma região curada cobre Roraima e o retrato do bioma amazônico não fala de grãos",
    true,
  ),
  1402: bioma(
    "amazonia",
    "media",
    "Banana e soja dividem o valor; sem região curada correspondente",
  ),
  1501: bioma(
    "amazonia",
    "media",
    "Mandioca lidera com soja e cacau logo atrás — mesorregião de perfil misto (Santarém), sem vocação única",
    true,
  ),
  1502: alta(
    "pa-nordeste-acai",
    "media",
    "O açaí concentra quase todo o valor e a região curada se chama 'Nordeste do Pará / Ilhas', tendo o açaí como vocação principal",
  ),
  1503: alta(
    "pa-nordeste-acai",
    "alta",
    "O açaí lidera com folga e o retrato de pa-nordeste-acai cita Belém nominalmente",
  ),
  1504: alta(
    "pa-nordeste-acai",
    "alta",
    "Contém as âncoras de Tomé-Açu e Igarapé-Miri; açaí e dendê, os dois produtos do retrato, lideram o valor",
  ),
  1505: candidata(
    "alta",
    "O cacau concentra quase todo o valor da mesorregião (Transamazônica/Medicilândia); ba-sul-recôncavo é cacau-cabruca de Mata Atlântica e descreveria errado esta região",
  ),
  1506: bioma(
    "amazonia",
    "media",
    "A soja lidera e a dominância é pecuária (frente de grãos e boi de Carajás); nenhuma região curada cobre o sudeste paraense",
    true,
  ),
  1601: bioma(
    "amazonia",
    "media",
    "Açaí e mandioca em economia de várzea; sem região curada correspondente",
  ),
  1602: bioma(
    "amazonia",
    "media",
    "Mandioca, soja e açaí dividem um valor pequeno; sem região curada correspondente",
  ),
  1701: alta(
    "matopiba-fronteira",
    "alta",
    "Contém a âncora de Lagoa da Confusão; soja lidera e o arroz vem em seguida, exatamente o 'soja e arroz em expansão' do retrato",
  ),
  1702: alta(
    "matopiba-fronteira",
    "alta",
    "Contém as âncoras de Campos Lindos e Porto Nacional; a soja lidera com folga",
  ),

  // ── NORDESTE ──
  2101: bioma(
    "amazonia",
    "baixa",
    "Arroz e mandioca empatam na liderança; a mesorregião fica na transição Amazônia/Cerrado (Mata dos Cocais) e o bioma precisa de conferência humana",
    true,
  ),
  2102: bioma(
    "amazonia",
    "baixa",
    "A soja lidera, mas o recorte é de pré-Amazônia maranhense e a dominância é pecuária; conferir o bioma e se a mesorregião entra na delimitação do MATOPIBA",
    true,
  ),
  2103: bioma(
    "cerrado",
    "baixa",
    "A soja lidera na transição cerrado/cocais; bioma a conferir e sem região curada que descreva o centro maranhense",
    true,
  ),
  2104: alta(
    "matopiba-fronteira",
    "media",
    "A soja concentra quase todo o valor e a mesorregião está na delimitação oficial do MATOPIBA (Decreto 8.447/2015)",
  ),
  2105: alta(
    "matopiba-fronteira",
    "alta",
    "Contém a âncora de Balsas, polo citado no retrato, e a soja lidera",
  ),
  2201: bioma(
    "caatinga",
    "baixa",
    "Mandioca e arroz lideram no litoral e nos cocais piauienses; bioma de transição, a conferir",
    true,
  ),
  2202: bioma(
    "cerrado",
    "baixa",
    "Cana e soja lideram na região de Teresina, transição caatinga/cerrado; bioma a conferir",
    true,
  ),
  2203: alta(
    "matopiba-fronteira",
    "alta",
    "Contém a âncora de Uruçuí, polo citado no retrato, e a soja concentra a maior parte do valor",
  ),
  2204: bioma(
    "caatinga",
    "alta",
    "Mandioca, milho e feijão de sequeiro no semiárido de Picos — exatamente o retrato do bioma",
  ),
  2301: bioma(
    "caatinga",
    "baixa",
    "Contém a âncora de Granja (ce-rn-sertao-caju), mas o valor é liderado por maracujá e olerícolas da Serra da Ibiapaba; herdar a região do caju pintaria errado a mesorregião inteira",
    true,
  ),
  2302: bioma(
    "caatinga",
    "media",
    "Coco lidera com a castanha de caju logo atrás — há parentesco com ce-rn-sertao-caju, mas o líder não é o caju e a região curada não fala de coco",
    true,
  ),
  2303: bioma(
    "caatinga",
    "baixa",
    "Contém a âncora de Pacajus (ce-rn-sertao-caju), mas o valor é pequeno e pulverizado entre mandioca, banana e coco",
    true,
  ),
  2304: bioma(
    "caatinga",
    "alta",
    "Milho e feijão de sequeiro dominam os Sertões Cearenses, o retrato do bioma",
  ),
  2305: alta(
    "ce-baixo-jaguaribe",
    "alta",
    "Contém as âncoras de Aracati, Icapuí e Limoeiro do Norte; banana e melão irrigados da Chapada do Apodi lideram, a fruticultura irrigada do retrato",
  ),
  2306: bioma(
    "caatinga",
    "media",
    "Banana e milho dividem o valor no centro-sul cearense; sem região curada correspondente",
  ),
  2307: bioma(
    "caatinga",
    "media",
    "Mandioca e banana lideram no Cariri; sem região curada correspondente",
    true,
  ),
  2401: alta(
    "rn-assu-mossoro",
    "alta",
    "Contém as âncoras de Mossoró, Apodi e Baraúna, e o melão — produto que dá nome ao polo no retrato — lidera o valor",
  ),
  2402: bioma(
    "caatinga",
    "media",
    "Maracujá e melão em escala pequena no semiárido central; sem região curada correspondente",
  ),
  2403: bioma(
    "caatinga",
    "baixa",
    "Agreste potiguar, transição caatinga/Mata Atlântica; mandioca e abacaxi lideram, bioma a conferir",
    true,
  ),
  2404: bioma(
    "mata_atlantica",
    "media",
    "A cana lidera, perfil de Zona da Mata, mas pe-zona-mata-cana hoje cobre só PE/AL/PB — avaliar estender a região curada ao RN em vez de forçar o encaixe",
    true,
  ),
  2501: bioma(
    "caatinga",
    "alta",
    "Feijão e milho de sequeiro no sertão paraibano, com valor total pequeno",
  ),
  2502: bioma(
    "caatinga",
    "media",
    "Tomate e cebola irrigados em pequena escala na Borborema; sem região curada correspondente",
  ),
  2503: bioma(
    "caatinga",
    "baixa",
    "Agreste paraibano, transição caatinga/Mata Atlântica; bioma a conferir",
    true,
  ),
  2504: alta(
    "pe-zona-mata-cana",
    "alta",
    "Contém a âncora de Santa Rita e a cana lidera o valor — a Zona da Mata do retrato",
  ),
  2601: bioma(
    "caatinga",
    "alta",
    "Mandioca, milho e feijão de sequeiro no sertão pernambucano",
  ),
  2602: alta(
    "ba-vale-sao-francisco",
    "alta",
    "Uva e manga lideram o valor e o retrato de ba-vale-sao-francisco cita Petrolina nominalmente; vale renomear a região para BA/PE se ela passar a cobrir este recorte",
  ),
  2603: bioma(
    "caatinga",
    "baixa",
    "Agreste pernambucano, transição caatinga/Mata Atlântica, com valor pulverizado; bioma a conferir",
    true,
  ),
  2604: alta(
    "pe-zona-mata-cana",
    "alta",
    "Contém a âncora de Escada e a cana lidera com folga",
  ),
  2605: alta(
    "pe-zona-mata-cana",
    "alta",
    "Contém a âncora de Ipojuca e a cana responde por quase todo o valor",
  ),
  2701: bioma(
    "caatinga",
    "alta",
    "Tomate, milho e mandioca em escala pequena no sertão alagoano",
  ),
  2702: bioma(
    "caatinga",
    "baixa",
    "Agreste alagoano, transição caatinga/Mata Atlântica; bioma a conferir",
    true,
  ),
  2703: alta(
    "pe-zona-mata-cana",
    "alta",
    "Contém as âncoras de Rio Largo e Coruripe e a cana lidera com folga",
  ),
  2801: bioma(
    "caatinga",
    "media",
    "O milho de sequeiro domina o sertão sergipano; sem região curada correspondente",
  ),
  2802: bioma(
    "caatinga",
    "baixa",
    "Agreste sergipano em transição; milho lidera e a dominância é pecuária",
    true,
  ),
  2803: bioma(
    "mata_atlantica",
    "media",
    "A laranja lidera (citricultura sergipana) com coco atrás; o retrato do bioma cita citros, mas o polo mereceria região própria — sp-citricola é recorte paulista",
    true,
  ),
  2901: alta(
    "ba-extremo-oeste",
    "alta",
    "Contém cinco âncoras do oeste baiano e soja e algodão lideram o valor, as duas vocações do retrato",
  ),
  2902: alta(
    "ba-vale-sao-francisco",
    "alta",
    "Contém as âncoras de Juazeiro, Casa Nova, Curaçá e Sobradinho e manga e uva lideram; a âncora de Paulo Afonso, no mesmo recorte, segue apontando para ba-sertao-nordeste",
  ),
  2903: alta(
    "ba-centro-norte",
    "alta",
    "Contém as âncoras de Irecê, Feira de Santana e Jacobina e a cebola de sequeiro lidera, produto citado no retrato",
  ),
  2904: alta(
    "ba-sertao-nordeste",
    "media",
    "Contém as âncoras de Jeremoabo e Euclides da Cunha e o milho de sequeiro lidera; ressalva: a laranja do litoral norte (Rio Real) pesa no segundo lugar e não está no retrato",
    true,
  ),
  2905: bioma(
    "mata_atlantica",
    "media",
    "Mandioca, laranja e cacau dividem um valor pequeno no recôncavo metropolitano; as âncoras do recôncavo cacaueiro ficam em outros recortes",
  ),
  2906: bioma(
    "caatinga",
    "baixa",
    "Recorte muito heterogêneo: café do planalto de Vitória da Conquista, batata da Chapada Diamantina e cacau do vale do Jiquiriçá; as âncoras de Mutuípe e Jiquiriçá seguem em ba-sul-recôncavo e o resto não cabe numa região só",
    true,
  ),
  2907: alta(
    "ba-sul-recôncavo",
    "alta",
    "Contém as âncoras de Ilhéus, Itabuna e Valença; cacau lidera e café vem em seguida, os dois produtos do retrato",
  ),

  // ── SUDESTE ──
  3101: bioma(
    "cerrado",
    "alta",
    "Soja no cerrado de Unaí/Paracatu; mg-cerrado-mineiro é nominalmente Triângulo/Alto Paranaíba e o retrato do bioma descreve bem os grãos daqui",
  ),
  3102: bioma(
    "cerrado",
    "baixa",
    "A banana dos perímetros irrigados do Jaíba lidera no semiárido mineiro; conferir o bioma (cerrado/caatinga) e avaliar região própria de fruticultura irrigada",
    true,
  ),
  3103: candidata(
    "media",
    "O café arábica concentra a maior parte do valor no Jequitinhonha e nenhuma das três regiões cafeeiras curadas (Sul de Minas, Cerrado Mineiro, Matas de Minas) cobre o vale",
  ),
  3104: bioma(
    "mata_atlantica",
    "media",
    "O café lidera no Mucuri, mas fora do recorte das Matas de Minas; o retrato do bioma já cita café como vocação úmida",
    true,
  ),
  3105: alta(
    "mg-cerrado-mineiro",
    "alta",
    "Contém as âncoras de Patrocínio, Araguari, Monte Carmelo e Uberaba; cana, soja e café arábica dividem o valor, exatamente o retrato",
  ),
  3106: bioma(
    "cerrado",
    "media",
    "Cana e soja lideram com dominância pecuária na Central Mineira; sem região curada correspondente",
  ),
  3107: bioma(
    "cerrado",
    "baixa",
    "Valor pulverizado em fruticultura e olericultura de cinturão verde; transição cerrado/Mata Atlântica, bioma a conferir",
    true,
  ),
  3108: alta(
    "mg-matas-de-minas",
    "media",
    "O café arábica concentra quase todo o valor no leste mineiro (Caratinga/Manhuaçu), que é o recorte descrito pelas Matas de Minas",
  ),
  3109: alta(
    "mg-sul-de-minas",
    "media",
    "O café arábica lidera com folga e a região é contígua ao Sul de Minas; conferir se o Oeste de Minas não merece recorte próprio",
    true,
  ),
  3110: alta(
    "mg-sul-de-minas",
    "alta",
    "Contém as âncoras de Varginha, Guaxupé e Carmo de Minas e o café arábica concentra a maior parte do valor",
  ),
  3111: bioma(
    "mata_atlantica",
    "media",
    "Café divide espaço com milho e soja em Campo das Vertentes, bacia leiteira; nenhuma região cafeeira curada cobre o recorte",
    true,
  ),
  3112: alta(
    "mg-matas-de-minas",
    "alta",
    "Contém as âncoras de Manhuaçu e Viçosa e o café arábica responde por quase todo o valor",
  ),
  3201: candidata(
    "alta",
    "O café concentra a maior parte do valor com predominância canephora e pimenta-do-reino em seguida; nenhuma região curada cobre o conilon capixaba (ro-cafe-robusta é Rondônia)",
  ),
  3202: candidata(
    "alta",
    "Café canephora lidera com pimenta-do-reino e mamão atrás — mesmo polo de conilon do norte capixaba, sem região curada",
  ),
  3203: candidata(
    "media",
    "Café lidera no centro capixaba com as duas variedades presentes; sem região curada e com dominância dividida entre lavoura e pecuária",
  ),
  3204: candidata(
    "alta",
    "O café responde por quase todo o valor com predominância arábica — as montanhas do sul capixaba, sem região curada correspondente",
  ),
  3301: bioma(
    "mata_atlantica",
    "media",
    "O café arábica lidera no noroeste fluminense, mas nenhuma região cafeeira curada cobre o RJ; o retrato do bioma já cita café",
    true,
  ),
  3302: bioma(
    "mata_atlantica",
    "media",
    "Abacaxi e cana dividem o valor no norte fluminense; sem região curada correspondente",
  ),
  3303: bioma(
    "mata_atlantica",
    "media",
    "Tomate de olericultura lidera na região serrana fluminense; sem região curada correspondente",
  ),
  3304: bioma(
    "mata_atlantica",
    "media",
    "Laranja e cana em escala pequena nas Baixadas; sem região curada correspondente",
  ),
  3305: bioma(
    "mata_atlantica",
    "media",
    "Valor muito pequeno e dominância pecuária no sul fluminense; bioma é a leitura honesta",
  ),
  3306: bioma(
    "mata_atlantica",
    "media",
    "Laranja, tomate e mandioca de cinturão verde metropolitano; sem região curada correspondente",
  ),
  3501: alta(
    "sp-ribeirao-cana",
    "media",
    "A cana lidera com folga, perfil sucroenergético igual ao do retrato; ressalva: o texto cita Ribeirão Preto nominalmente e leria estranho em São José do Rio Preto",
    true,
  ),
  3502: alta(
    "sp-ribeirao-cana",
    "alta",
    "Contém a âncora de Ribeirão Preto e a cana lidera; a âncora de Bebedouro, no mesmo recorte, segue apontando para sp-citricola",
  ),
  3503: alta(
    "sp-ribeirao-cana",
    "media",
    "A cana responde por mais de quatro quintos do valor; mesma ressalva do nome da região, que cita Ribeirão Preto",
    true,
  ),
  3504: alta(
    "sp-citricola",
    "media",
    "A laranja lidera o valor, acima da cana — perfil de cinturão citrícola, ainda que as âncoras de citros estejam em recortes vizinhos",
  ),
  3505: alta(
    "sp-citricola",
    "media",
    "Contém as âncoras de Matão e Araraquara e a laranja é o segundo produto; ressalva: a cana lidera, o recorte mistura usina e citros",
    true,
  ),
  3506: alta(
    "sp-ribeirao-cana",
    "media",
    "A cana lidera com folga em Piracicaba, berço da agroindústria canavieira; mesma ressalva do nome da região",
    true,
  ),
  3507: bioma(
    "mata_atlantica",
    "baixa",
    "Laranja, cana e café da Mogiana dividem o valor sem um vencedor claro; nenhuma região curada descreve o conjunto",
    true,
  ),
  3508: alta(
    "sp-ribeirao-cana",
    "media",
    "A cana responde por quase três quartos do valor no oeste paulista; mesma ressalva do nome da região",
    true,
  ),
  3509: bioma(
    "mata_atlantica",
    "media",
    "O amendoim lidera em Marília, com cana e café atrás; nenhuma região curada cobre a vocação do amendoim",
    true,
  ),
  3510: bioma(
    "mata_atlantica",
    "media",
    "A cana lidera, mas com menos da metade do valor, e soja e milho pesam — não é o perfil de usina puro do retrato de sp-ribeirao-cana",
    true,
  ),
  3511: bioma(
    "mata_atlantica",
    "media",
    "Soja, tomate e laranja dividem o valor no sudoeste paulista; sem região curada correspondente",
  ),
  3512: bioma(
    "mata_atlantica",
    "media",
    "A uva de Jundiaí/São Roque lidera, mas rs-serra-gaucha é recorte gaúcho e não descreve a viticultura paulista",
    true,
  ),
  3513: bioma(
    "mata_atlantica",
    "media",
    "Arroz, cana e banana em escala pequena com dominância pecuária no Vale do Paraíba",
  ),
  3514: candidata(
    "alta",
    "A banana concentra quase todo o valor do Vale do Ribeira, maior polo bananicultor do país, e nenhuma região curada o representa",
  ),
  3515: bioma(
    "mata_atlantica",
    "media",
    "Caqui, tomate e mandioca de cinturão verde metropolitano, com valor total muito pequeno",
  ),

  // ── SUL ──
  4101: bioma(
    "mata_atlantica",
    "media",
    "Cana e mandioca lideram no arenito do noroeste paranaense; nenhuma região curada cobre a vocação da mandioca industrial",
    true,
  ),
  4102: candidata(
    "alta",
    "Soja e milho concentram quase todo o valor; nenhuma região curada cobre o cinturão de grãos do Paraná e o fallback de Mata Atlântica falaria de café, cacau e banana",
  ),
  4103: candidata(
    "alta",
    "Soja e milho lideram com a cana atrás; mesmo cinturão de grãos paranaense, sem região curada",
  ),
  4104: candidata(
    "media",
    "Soja, milho e cana dividem o valor no Norte Pioneiro, historicamente cafeeiro; hoje o perfil é de grãos e não há região curada",
  ),
  4105: candidata(
    "alta",
    "Soja lidera com folga nos Campos Gerais, grãos de alta tecnologia sem região curada correspondente",
  ),
  4106: candidata(
    "alta",
    "Soja e milho concentram o valor no oeste paranaense, com a agroindústria de aves e suínos ao lado; sem região curada",
  ),
  4107: candidata(
    "alta",
    "Soja lidera com feijão e trigo atrás no sudoeste paranaense; sem região curada e com dominância dividida",
  ),
  4108: candidata(
    "alta",
    "Soja lidera com feijão e batata atrás no centro-sul paranaense; sem região curada correspondente",
  ),
  4109: candidata(
    "media",
    "Soja lidera com o fumo logo atrás — grãos e tabaco no sudeste paranaense, sem região curada",
  ),
  4110: bioma(
    "mata_atlantica",
    "media",
    "Soja, batata e fumo dividem o valor no entorno de Curitiba, com forte olericultura de abastecimento; sem região curada",
    true,
  ),
  4201: candidata(
    "alta",
    "Soja e milho lideram e a dominância é pecuária: é o polo de aves e suínos do oeste catarinense. As âncoras de maçã (Fraiburgo e Caçador) caem neste recorte, mas herdar sc-planalto-serrano descreveria errado a maioria dos municípios",
    true,
  ),
  4202: candidata(
    "media",
    "O fumo lidera com soja e banana atrás — norte catarinense no cinturão do tabaco do Sul, sem região curada",
  ),
  4203: alta(
    "sc-planalto-serrano",
    "alta",
    "Contém a âncora de São Joaquim e a maçã lidera o valor, a vocação exata do retrato",
  ),
  4204: candidata(
    "media",
    "O fumo lidera no Vale do Itajaí, com banana e arroz atrás; mesmo cinturão do tabaco, sem região curada",
  ),
  4205: bioma(
    "mata_atlantica",
    "media",
    "A cebola lidera na Grande Florianópolis (Ituporanga e entorno); nenhuma região curada cobre a vocação da cebola",
    true,
  ),
  4206: candidata(
    "media",
    "O arroz irrigado lidera no sul catarinense, segundo maior polo do país; rs-metade-sul-arroz é recorte gaúcho e não serve",
  ),
  4301: candidata(
    "alta",
    "Soja e trigo concentram o valor no planalto gaúcho, o maior conjunto de municípios do país neste recorte; nenhuma região curada cobre e o fallback de Mata Atlântica erraria a vocação",
  ),
  4302: bioma(
    "mata_atlantica",
    "baixa",
    "O recorte reúne DUAS regiões curadas distintas — Serra Gaúcha (uva) e Campos de Cima da Serra (maçã) — e ainda tem soja liderando; a camada mesorregional é grossa demais aqui e o caso pede microrregião",
    true,
  ),
  4303: candidata(
    "media",
    "Soja lidera com arroz atrás no centro gaúcho; mesmo cinturão de grãos, sem região curada",
  ),
  4304: candidata(
    "alta",
    "O fumo lidera com folga no Vale do Rio Pardo, maior polo de tabaco do país, e não há região curada correspondente",
  ),
  4305: alta(
    "rs-metade-sul-arroz",
    "media",
    "O arroz irrigado lidera e o retrato cita a planície costeira; ressalva: a região se chama 'Metade Sul' e este recorte é metropolitano",
    true,
  ),
  4306: alta(
    "rs-metade-sul-arroz",
    "alta",
    "Contém as âncoras de Uruguaiana e Itaqui e o arroz irrigado lidera, exatamente o retrato",
  ),
  4307: alta(
    "rs-metade-sul-arroz",
    "media",
    "O arroz lidera na metade sul gaúcha (Pelotas/Camaquã), com soja e fumo atrás",
  ),

  // ── CENTRO-OESTE ──
  5001: bioma(
    "cerrado",
    "baixa",
    "O Pantanal não tem retrato próprio em BIOMA_FALLBACK e a dominância aqui é pecuária extensiva; o cerrado é o vizinho mais próximo, mas o certo seria criar o fallback do Pantanal",
    true,
  ),
  5002: bioma(
    "cerrado",
    "alta",
    "Soja e milho em larga escala; o retrato do bioma cerrado descreve exatamente esta vocação",
  ),
  5003: bioma(
    "cerrado",
    "alta",
    "Soja e cana dividem o valor no leste sul-mato-grossense; o retrato do bioma cobre bem",
  ),
  5004: bioma(
    "cerrado",
    "alta",
    "Soja, cana e milho em larga escala; nenhuma região curada cobre MS e o retrato do bioma é fiel",
  ),
  5101: alta(
    "mt-medio-norte",
    "media",
    "Contém as quatro âncoras do Médio-Norte (Sorriso, Sinop, Lucas do Rio Verde e Nova Mutum) e soja, milho e algodão lideram; ressalva: as âncoras dos Parecis caem no mesmo recorte e separá-las exige microrregião",
    true,
  ),
  5102: bioma(
    "cerrado",
    "alta",
    "Soja, milho e algodão em larga escala no nordeste mato-grossense; o retrato do bioma cobre a vocação",
  ),
  5103: bioma(
    "cerrado",
    "baixa",
    "Soja e cana lideram com dominância pecuária e parte do recorte é Pantanal, que não tem fallback próprio",
    true,
  ),
  5104: bioma(
    "cerrado",
    "alta",
    "Soja e milho com dominância pecuária no entorno de Cuiabá; o retrato do bioma cita as duas coisas",
  ),
  5105: bioma(
    "cerrado",
    "alta",
    "Soja, milho e algodão no sudeste mato-grossense; retrato do bioma fiel, sem região curada para o recorte",
  ),
  5201: bioma(
    "cerrado",
    "alta",
    "Soja lidera com folga e a dominância é pecuária no noroeste goiano; o retrato do bioma cobre",
  ),
  5202: bioma(
    "cerrado",
    "alta",
    "Soja lidera no norte goiano; sem região curada e retrato do bioma fiel",
  ),
  5203: bioma(
    "cerrado",
    "alta",
    "Soja e cana com dominância pecuária no centro goiano; o retrato do bioma cobre",
  ),
  5204: bioma(
    "cerrado",
    "media",
    "Soja lidera com batata irrigada por pivô atrás (Cristalina); o retrato do bioma cobre os grãos, mas não a agricultura irrigada de alto valor",
    true,
  ),
  5205: alta(
    "go-sudoeste",
    "alta",
    "Contém as âncoras de Rio Verde, Jataí e Mineiros e soja, cana e milho lideram, com a pecuária intensiva do retrato",
  ),
  5301: bioma(
    "cerrado",
    "alta",
    "Soja, milho e feijão irrigado no Distrito Federal; sem região curada e retrato do bioma fiel",
  ),
};

/** Lê blocos do arquivo de regiões — SOMENTE LEITURA. */
function extrairBloco(fonte, nomeConst) {
  const inicio = fonte.indexOf(`export const ${nomeConst}`);
  if (inicio < 0) throw new Error(`não achei ${nomeConst} em ${LIB}`);
  const fim = fonte.indexOf("\n};", inicio);
  return fonte.slice(inicio, fim);
}

function chavesDoRegistro(bloco) {
  const chaves = new Set();
  // As chaves aparecem com aspas ("ba-sul-recôncavo") ou sem (caatinga).
  const re = /^ {2}"?([^"\s:]+)"?:\s*\{/gm;
  let m;
  while ((m = re.exec(bloco))) chaves.add(m[1]);
  return chaves;
}

function paresMuniRegiao(bloco) {
  const pares = [];
  const re = /"([^"]+)":\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(bloco))) pares.push([m[1], m[2]]);
  return pares;
}

const pct = (x) => `${Math.round((x ?? 0) * 1000) / 10}%`;
const milReais = (x) => `R$ ${Math.round(x).toLocaleString("pt-BR")} mil`;

async function main() {
  const fonteLib = await readFile(LIB, "utf8");
  const regioes = chavesDoRegistro(extrairBloco(fonteLib, "REGIOES"));
  const biomas = chavesDoRegistro(extrairBloco(fonteLib, "BIOMA_FALLBACK"));
  const ancoras = paresMuniRegiao(extrairBloco(fonteLib, "MUNI_TO_REGIAO"));
  const pam = JSON.parse(await readFile(PAM, "utf8"));
  const malha = JSON.parse(await readFile(MUNI, "utf8"));

  console.log(
    `Lidos: ${regioes.size} regiões curadas, ${biomas.size} biomas, ` +
      `${ancoras.length} âncoras, ${pam.mesorregioes.length} mesorregiões.`,
  );

  // Âncoras por mesorregião + âncoras que não existem na malha oficial.
  const ancorasPorMeso = new Map();
  const ancorasOrfas = [];
  for (const [chave, regiao] of ancoras) {
    const info = malha[chave];
    if (!info) {
      ancorasOrfas.push(`${chave} → ${regiao}`);
      continue;
    }
    const id = String(info.mesorregiaoId);
    if (!ancorasPorMeso.has(id)) ancorasPorMeso.set(id, []);
    ancorasPorMeso.get(id).push({ municipio: chave.split("/")[0], regiao });
  }

  // Validação: a curadoria tem que cobrir exatamente as 137 mesorregiões.
  const idsDados = new Set(pam.mesorregioes.map((m) => String(m.mesorregiaoId)));
  const idsCuradoria = new Set(Object.keys(CURADORIA));
  const faltando = [...idsDados].filter((id) => !idsCuradoria.has(id));
  const sobrando = [...idsCuradoria].filter((id) => !idsDados.has(id));
  if (faltando.length || sobrando.length) {
    throw new Error(
      `curadoria fora de sincronia com os dados — faltando: ` +
        `${faltando.join(", ") || "nenhuma"}; sobrando: ` +
        `${sobrando.join(", ") || "nenhuma"}`,
    );
  }

  const linhas = [];
  const resumo = { ALTA_CONFIANCA: [], BIOMA: [], CANDIDATA_NOVA_REGIAO: [] };
  const verificar = [];

  for (const m of pam.mesorregioes) {
    const id = String(m.mesorregiaoId);
    const c = CURADORIA[id];

    if (c.balde === "ALTA_CONFIANCA" && !regioes.has(c.destino)) {
      throw new Error(`meso ${id}: destino "${c.destino}" não existe em REGIOES`);
    }
    if (c.balde === "BIOMA" && !biomas.has(c.destino)) {
      throw new Error(
        `meso ${id}: destino "${c.destino}" não existe em BIOMA_FALLBACK`,
      );
    }
    if (c.balde === "CANDIDATA_NOVA_REGIAO" && c.destino) {
      throw new Error(`meso ${id}: candidata não pode ter destino preenchido`);
    }

    const lider = m.produtoLider;
    const top3 = m.top3
      .map((p) => `${p.produto} ${pct(p.participacao)}`)
      .join("; ");
    const daMeso = ancorasPorMeso.get(id) ?? [];
    const textoAncoras = daMeso.length
      ? ` Âncoras no recorte: ${daMeso
          .map((a) => `${a.municipio}→${a.regiao}`)
          .join(", ")}.`
      : "";
    const textoLider = lider
      ? ` Líder PAM 2024: ${lider.produto}, ${pct(lider.participacao)} do valor ` +
        `(${milReais(lider.valorMilReais)}).`
      : " Sem valor de lavoura registrado na PAM 2024.";
    const justificativa = `${c.nota}.${textoLider}${textoAncoras}`;

    linhas.push([
      m.mesorregiaoId,
      m.mesorregiao,
      m.ufs.join(", "),
      m.qtdMunicipios,
      lider ? `${lider.produto} (${pct(lider.participacao)})` : "",
      top3,
      m.dominancia,
      c.balde,
      c.destino,
      c.confianca,
      justificativa,
      daMeso.length
        ? `${FONTE_BASE} + MUNI_TO_REGIAO (${LIB})`
        : FONTE_BASE,
    ]);

    resumo[c.balde].push({ id, m, c, lider, top3 });
    if (c.verificar) verificar.push({ id, m, c });
  }

  await escreverXlsx(XLSX, {
    aba: "proposta",
    colunas: [
      { titulo: "mesorregiaoId", largura: 14 },
      { titulo: "mesorregiao", largura: 32 },
      { titulo: "ufs", largura: 8 },
      { titulo: "qtd_municipios", largura: 15 },
      { titulo: "produto_lider_valor", largura: 32 },
      { titulo: "top3_valor", largura: 52, quebraLinha: true },
      { titulo: "dominancia", largura: 15 },
      { titulo: "balde_sugerido", largura: 22 },
      { titulo: "destino_sugerido", largura: 24 },
      { titulo: "confianca", largura: 11 },
      { titulo: "justificativa", largura: 96, quebraLinha: true },
      { titulo: "fonte", largura: 46, quebraLinha: true },
    ],
    linhas,
  });

  const linha = (r) =>
    `- **${r.id} — ${r.m.mesorregiao} (${r.m.ufs.join(", ")})**`;

  const md = [
    "# Proposta de classificação mesorregião → região (FASE 1)",
    "",
    `Gerado por \`scripts/gera-meso-classificacao.mjs\` a partir de \`${PAM}\`.`,
    "Nada foi escrito em `lib/regioes-agricolas.ts` — este documento e a",
    "planilha `meso-classificacao-proposta.xlsx` existem para revisão humana.",
    "",
    "## Contagem por balde",
    "",
    `| balde | mesorregiões | municípios cobertos |`,
    `| --- | ---: | ---: |`,
    ...["ALTA_CONFIANCA", "BIOMA", "CANDIDATA_NOVA_REGIAO"].map((b) => {
      const mun = resumo[b].reduce((s, r) => s + r.m.qtdMunicipios, 0);
      return `| ${b} | ${resumo[b].length} | ${mun} |`;
    }),
    `| **total** | **${pam.mesorregioes.length}** | **${pam.mesorregioes.reduce(
      (s, m) => s + m.qtdMunicipios,
      0,
    )}** |`,
    "",
    "## ALTA_CONFIANCA — mesorregião → região curada",
    "",
    ...resumo.ALTA_CONFIANCA.map(
      (r) =>
        `${linha(r)} → \`${r.c.destino}\` (confiança ${r.c.confianca}` +
        `${r.c.verificar ? ", **verificar**" : ""}) — líder: ` +
        `${r.lider ? `${r.lider.produto} ${pct(r.lider.participacao)}` : "sem dado"}`,
    ),
    "",
    "## CANDIDATA_NOVA_REGIAO — vocação observada sem região correspondente",
    "",
    ...resumo.CANDIDATA_NOVA_REGIAO.map(
      (r) => `${linha(r)} — top 3: ${r.top3}. ${r.c.nota}.`,
    ),
    "",
    "## BIOMA — fallback honesto",
    "",
    ...resumo.BIOMA.map(
      (r) =>
        `${linha(r)} → \`${r.c.destino}\` (confiança ${r.c.confianca}` +
        `${r.c.verificar ? ", **verificar**" : ""})`,
    ),
    "",
    "## Verificar — dado ambíguo ou recorte grosso demais",
    "",
    ...verificar.map((r) => `${linha(r)} — ${r.c.nota}.`),
    "",
    "## Achados que independem da classificação",
    "",
    ancorasOrfas.length
      ? "- **Âncoras que nunca casam com a malha oficial do IBGE** (o nome em " +
        "`MUNI_TO_REGIAO` não existe no dado do IBGE, então o município cai " +
        `direto no bioma hoje): ${ancorasOrfas.join("; ")}.`
      : "- Todas as âncoras de `MUNI_TO_REGIAO` casam com a malha do IBGE.",
    "- **O Pantanal não tem retrato em `BIOMA_FALLBACK`.** As mesorregiões " +
      "pantaneiras (5001 e parte da 5103) estão propostas como `cerrado` por " +
      "falta de opção melhor — vale criar o fallback do bioma.",
    "- **A mesorregião é grossa demais em três casos conhecidos:** 4302 " +
      "(Serra Gaúcha e Campos de Cima da Serra no mesmo recorte), 5101 " +
      "(Médio-Norte e Parecis) e 3502/3505 (cana de Ribeirão e citros de " +
      "Bebedouro/Matão). Nesses, o caminho é microrregião, não mesorregião.",
    "- **Nomes de região que ficariam estranhos se generalizados:** " +
      "`sp-ribeirao-cana` cita Ribeirão Preto nominalmente mas serviria a " +
      "todo o interior canavieiro; `ba-vale-sao-francisco` diz (BA) mas o " +
      "retrato já cita Petrolina/PE.",
    "- A camada mesorregional só age em município SEM âncora: " +
      "`retratoPorMunicipio` consulta `MUNI_TO_REGIAO` primeiro. Por isso " +
      "propor BIOMA numa mesorregião que contém âncora não rebaixa a âncora.",
    "",
    "## Como ler a planilha",
    "",
    "Toda justificativa termina com o dado que a sustenta, interpolado do " +
      "JSON da PAM (produto líder, participação no valor e valor em mil " +
      "reais) e com as âncoras encontradas no recorte. Nenhum número foi " +
      "digitado à mão.",
    "",
  ].join("\n");

  await writeFile(RESUMO, md, "utf8");

  console.log(`OK: ${XLSX} com ${linhas.length} linhas.`);
  console.log(`OK: ${RESUMO}`);
  console.log(
    `Baldes — ALTA: ${resumo.ALTA_CONFIANCA.length}, ` +
      `BIOMA: ${resumo.BIOMA.length}, ` +
      `CANDIDATA: ${resumo.CANDIDATA_NOVA_REGIAO.length}, ` +
      `verificar: ${verificar.length}.`,
  );
}

main().catch((erro) => {
  console.error("Falhou:", erro.message);
  process.exit(1);
});
