/**
 * Retratos estratégicos regionais — vocação agrícola por mesorregião.
 * Fonte da verdade: docs/regioes/vocacoes-microrregionais.md (curado e
 * fonteado). Retratos das regiões fortes validados com produtor de campo.
 *
 * ARQUITETURA (decisão 22/jul):
 * - Resolução município→mesorregião: a UI tenta a API do IBGE primeiro
 *   (dado fresco); se falhar, usa o mapa estático MUNI_TO_MESO abaixo
 *   como fallback. O script scripts/ingest-mesorregioes.mjs (rodar local,
 *   mensal) regenera MUNI_TO_MESO a partir da malha oficial do IBGE.
 * - Retrato: RICO nas regiões curadas (REGIOES); onde a mesorregião não
 *   tem retrato próprio, cai no retrato geral por bioma (BIOMA_FALLBACK).
 *
 * Arquivo mantido por humano — agentes: SOMENTE LEITURA.
 */

export type RegiaoRetrato = {
  /** chave estável da região (slug) */
  key: string;
  /** nome amigável exibido */
  nome: string;
  /** o retrato: 1-2 frases densas, com número e fonte. Tom consultor. */
  retratoPt: string;
  retratoEn: string;
  /** vocações principais (values de cultura/finalidade que o motor conhece) */
  vocacoes: string[];
  /** condição hídrica típica: "humid" | "dry" | "irrigado" | "mista" */
  agua: "humid" | "dry" | "irrigado" | "mista";
  fonte: string;
};

/** Retratos ricos das regiões de vocação forte. BAHIA validada célula a célula. */
export const REGIOES: Record<string, RegiaoRetrato> = {
  // ── BAHIA (validada) ──
  "ba-extremo-oeste": {
    key: "ba-extremo-oeste",
    nome: "Extremo Oeste Baiano",
    retratoPt:
      "Você está no Extremo Oeste Baiano, fronteira agrícola do MATOPIBA — chapadões de Cerrado com solo fértil e produção de grãos em larga escala. São Desidério é o 2º maior produtor agrícola do Brasil (56% soja). Vocação de soja, milho e algodão com alta tecnologia.",
    retratoEn:
      "You're in Western Bahia, the MATOPIBA agricultural frontier — fertile Cerrado plateaus with large-scale grain farming. São Desidério is Brazil's 2nd-largest agricultural producer (56% soybeans). Vocation for soybeans, maize and cotton with advanced technology.",
    vocacoes: ["graos", "algodao"],
    agua: "mista",
    fonte: "IBGE PAM / MAPA",
  },
  "ba-vale-sao-francisco": {
    key: "ba-vale-sao-francisco",
    nome: "Vale do São Francisco (BA)",
    retratoPt:
      "Você está no Vale do São Francisco baiano — semiárido irrigado pelo Velho Chico, um dos maiores polos de fruticultura de exportação do país. Com Petrolina/PE, lidera a exportação nacional de manga e uva; também goiaba, banana e coco. A água transforma o valor da terra aqui.",
    retratoEn:
      "You're in Bahia's São Francisco Valley — semi-arid land irrigated by the river, one of Brazil's largest export-fruit hubs. With Petrolina/PE it leads national mango and grape exports; also guava, banana and coconut. Water transforms land value here.",
    vocacoes: ["fruticultura", "manga", "uva"],
    agua: "irrigado",
    fonte: "Embrapa Semiárido / IBGE",
  },
  "ba-sul-recôncavo": {
    key: "ba-sul-recôncavo",
    nome: "Sul Baiano / Recôncavo",
    retratoPt:
      "Você está na zona cacaueira do Sul da Bahia — clima quente e úmido de Mata Atlântica, berço do cacau-cabruca (cultivado sob a sombra da mata nativa). A chuva farta dispensa irrigação; a região diversifica com café robusta e banana. Cadeia de beneficiamento consolidada.",
    retratoEn:
      "You're in the cocoa zone of Southern Bahia — warm, humid Atlantic Forest climate, home of cabruca cocoa (grown under native forest shade). Ample rainfall removes the need for irrigation; the region diversifies with robusta coffee and banana. Consolidated processing chain.",
    vocacoes: ["lavoura_permanente", "cacau", "cafe", "banana"],
    agua: "humid",
    fonte: "CEPLAC / IBGE",
  },
  "ba-sertao-nordeste": {
    key: "ba-sertao-nordeste",
    nome: "Sertão Nordeste Baiano (Semiárido)",
    retratoPt:
      "Você está no sertão semiárido baiano — Polígono das Secas, chuva abaixo de 800mm/ano. A vocação consolidada é a pecuária de caprinos e ovinos (a Bahia lidera o rebanho nacional), com sequeiro de milho e feijão e palma forrageira. Onde há irrigação, a fruticultura muda o jogo.",
    retratoEn:
      "You're in Bahia's semi-arid backlands — the Drought Polygon, under 800mm of rain a year. The established vocation is goat and sheep ranching (Bahia leads the national herd), with rainfed maize and beans and forage cactus. Where there's irrigation, fruit growing changes everything.",
    vocacoes: ["pecuaria_corte", "extrativismo"],
    agua: "dry",
    fonte: "IBGE / SUDENE",
  },
  "ba-centro-norte": {
    key: "ba-centro-norte",
    nome: "Centro-Norte Baiano",
    retratoPt:
      "Você está no Centro-Norte baiano — polo de feijão, mandioca e cebola de sequeiro, com bacias leiteiras em pontos. Irecê é referência em feijão e mandioca no semiárido.",
    retratoEn:
      "You're in North-Central Bahia — a hub for rainfed beans, cassava and onion, with dairy basins in places. Irecê is a benchmark for beans and cassava in the semi-arid.",
    vocacoes: ["graos", "pecuaria_leite"],
    agua: "dry",
    fonte: "IBGE PAM",
  },

  // ── MINAS GERAIS (macrorregiões cafeeiras IMA 2000) ──
  "mg-sul-de-minas": {
    key: "mg-sul-de-minas",
    nome: "Sul de Minas",
    retratoPt:
      "Você está no Sul de Minas — a maior região cafeeira do Brasil, com 30% do café nacional e 55% do mineiro. Predominam pequenas e médias propriedades (95% com menos de 50 ha) de café arábica de qualidade. A sub-região Mantiqueira de Minas é celeiro de cafés premiados.",
    retratoEn:
      "You're in South Minas — Brazil's largest coffee region, with 30% of national and 55% of state coffee. Small and mid-sized farms dominate (95% under 50 ha) growing quality arabica. The Mantiqueira de Minas sub-region yields award-winning coffees.",
    vocacoes: ["lavoura_permanente", "cafe"],
    agua: "humid",
    fonte: "IMA / CECAFÉ / IBGE",
  },
  "mg-cerrado-mineiro": {
    key: "mg-cerrado-mineiro",
    nome: "Cerrado Mineiro (Alto Paranaíba/Triângulo)",
    retratoPt:
      "Você está no Cerrado Mineiro — planaltos planos que permitem colheita mecanizada e irrigação, primeira Indicação Geográfica de café do Brasil, com arábica encorpado. O Triângulo soma grãos, cana e a pecuária zebuína de Uberaba/Uberlândia.",
    retratoEn:
      "You're in the Cerrado Mineiro — flat plateaus allowing mechanized harvest and irrigation, Brazil's first coffee Geographical Indication, with full-bodied arabica. The Triângulo adds grains, sugarcane and the zebu cattle of Uberaba/Uberlândia.",
    vocacoes: ["lavoura_permanente", "cafe", "graos"],
    agua: "irrigado",
    fonte: "IMA / CONAB / IBGE",
  },
  "mg-matas-de-minas": {
    key: "mg-matas-de-minas",
    nome: "Matas de Minas (Zona da Mata)",
    retratoPt:
      "Você está nas Matas de Minas, leste do estado — relevo acidentado que impede máquinas, agricultura familiar e colheita manual de cafés especiais doces, com notas de chocolate e caramelo. Mais de 60 municípios produtores.",
    retratoEn:
      "You're in Matas de Minas, eastern Minas — rugged terrain that rules out machinery, family farming and hand-picked sweet specialty coffees with chocolate and caramel notes. Over 60 producing municipalities.",
    vocacoes: ["lavoura_permanente", "cafe"],
    agua: "humid",
    fonte: "IMA / Embrapa Café",
  },

  // ── SÃO PAULO ──
  "sp-ribeirao-cana": {
    key: "sp-ribeirao-cana",
    nome: "Nordeste Paulista (Ribeirão Preto)",
    retratoPt:
      "Você está no coração canavieiro de São Paulo — Ribeirão Preto e região concentram a maior produção de cana e etanol do país (SP faz cerca de metade da cana nacional). Terra de usina, com forte cadeia sucroenergética.",
    retratoEn:
      "You're in São Paulo's sugarcane heartland — Ribeirão Preto and region hold Brazil's largest cane and ethanol output (SP grows about half the national crop). Mill country, with a strong sugar-energy chain.",
    vocacoes: ["cana"],
    agua: "mista",
    fonte: "CONAB / UNICA",
  },
  "sp-citricola": {
    key: "sp-citricola",
    nome: "Cinturão Citrícola Paulista",
    retratoPt:
      "Você está no cinturão citrícola paulista (Bebedouro, Matão, Araraquara) — a maior produção de laranja e suco do mundo. Cadeia de exportação de suco consolidada.",
    retratoEn:
      "You're in São Paulo's citrus belt (Bebedouro, Matão, Araraquara) — the world's largest orange and juice production. A consolidated juice-export chain.",
    vocacoes: ["fruticultura", "citros"],
    agua: "mista",
    fonte: "Fundecitrus / IBGE",
  },

  // ── CENTRO-OESTE ──
  "mt-medio-norte": {
    key: "mt-medio-norte",
    nome: "Médio-Norte de Mato Grosso",
    retratoPt:
      "Você está no Médio-Norte de Mato Grosso — Sorriso, o maior produtor agrícola do Brasil (R$3,9 bi), Sinop e Lucas do Rio Verde. Soja e milho safrinha em larga escala com agricultura de precisão. MT responde por 28% da soja nacional.",
    retratoEn:
      "You're in Mid-Northern Mato Grosso — Sorriso, Brazil's largest agricultural producer (R$3.9bn), Sinop and Lucas do Rio Verde. Large-scale soybeans and second-crop maize with precision farming. MT accounts for 28% of national soy.",
    vocacoes: ["graos"],
    agua: "mista",
    fonte: "CONAB / IBGE PAM / MAPA",
  },
  "mt-parecis": {
    key: "mt-parecis",
    nome: "Chapada dos Parecis (MT)",
    retratoPt:
      "Você está na Chapada dos Parecis — Campo Novo do Parecis, Sapezal e Diamantino, um dos maiores polos de algodão do país, com soja, milho e etanol de milho em áreas irrigadas de alta tecnologia.",
    retratoEn:
      "You're on the Parecis Plateau — Campo Novo do Parecis, Sapezal and Diamantino, one of Brazil's top cotton hubs, with soybeans, maize and corn ethanol in high-tech irrigated areas.",
    vocacoes: ["algodao", "graos"],
    agua: "irrigado",
    fonte: "CONAB / IBGE",
  },
  "go-sudoeste": {
    key: "go-sudoeste",
    nome: "Sudoeste de Goiás",
    retratoPt:
      "Você está no Sudoeste Goiano — Rio Verde (2º maior produtor de soja do Brasil), Jataí e Mineiros. Grãos, pecuária intensiva e forte agroindústria cooperativa.",
    retratoEn:
      "You're in Southwestern Goiás — Rio Verde (Brazil's 2nd-largest soy producer), Jataí and Mineiros. Grains, intensive livestock and a strong cooperative agroindustry.",
    vocacoes: ["graos", "pecuaria_corte"],
    agua: "mista",
    fonte: "IBGE PAM / CONAB",
  },

  // ── SUL ──
  "rs-serra-gaucha": {
    key: "rs-serra-gaucha",
    nome: "Serra Gaúcha",
    retratoPt:
      "Você está na Serra Gaúcha — Caxias do Sul, Bento Gonçalves e Farroupilha, herança da colonização italiana. Faz 90% do vinho, 85% do espumante e 90% do suco de uva do Brasil. Terra de uva e vinho por excelência.",
    retratoEn:
      "You're in the Serra Gaúcha — Caxias do Sul, Bento Gonçalves and Farroupilha, an Italian-immigrant legacy. It makes 90% of Brazil's wine, 85% of its sparkling wine and 90% of its grape juice. Grape and wine country par excellence.",
    vocacoes: ["fruticultura", "uva"],
    agua: "humid",
    fonte: "Ibravin / IBGE",
  },
  "rs-campos-cima-serra": {
    key: "rs-campos-cima-serra",
    nome: "Campos de Cima da Serra (Vacaria)",
    retratoPt:
      "Você está nos Campos de Cima da Serra — Vacaria, Bom Jesus e Muitos Capões, o grande polo de maçã do Rio Grande do Sul (88% da maçã gaúcha, 37% da nacional). Clima frio ideal para a fruticultura de clima temperado.",
    retratoEn:
      "You're in the Campos de Cima da Serra — Vacaria, Bom Jesus and Muitos Capões, Rio Grande do Sul's main apple hub (88% of state apples, 37% of national). Cold climate ideal for temperate fruit.",
    vocacoes: ["fruticultura", "maca"],
    agua: "humid",
    fonte: "Atlas RS / IBGE PAM",
  },
  "sc-planalto-serrano": {
    key: "sc-planalto-serrano",
    nome: "Planalto Serrano Catarinense (São Joaquim)",
    retratoPt:
      "Você está no Planalto Serrano de Santa Catarina — São Joaquim, entre 900 e 1400m de altitude, responde por 35% do plantio nacional de maçã e produz vinhos de altitude premium. O clima mais frio do Brasil dá à fruta e à uva um ciclo longo e nobre.",
    retratoEn:
      "You're in Santa Catarina's Highland Plateau — São Joaquim, at 900–1400m, grows 35% of Brazil's apple planting and produces premium high-altitude wines. Brazil's coldest climate gives fruit and grapes a long, refined cycle.",
    vocacoes: ["fruticultura", "maca", "uva"],
    agua: "humid",
    fonte: "Epagri / IBGE / Ibravin",
  },
  "rs-metade-sul-arroz": {
    key: "rs-metade-sul-arroz",
    nome: "Metade Sul do RS / Campanha",
    retratoPt:
      "Você está na Metade Sul gaúcha — Uruguaiana, Itaqui e a planície costeira, maior polo de arroz irrigado do Brasil, com pecuária de corte extensiva no pampa e vinhos finos da Campanha (Sant'Ana do Livramento, Bagé).",
    retratoEn:
      "You're in the southern half of Rio Grande do Sul — Uruguaiana, Itaqui and the coastal plain, Brazil's largest irrigated-rice hub, with extensive beef ranching on the pampa and fine Campanha wines (Sant'Ana do Livramento, Bagé).",
    vocacoes: ["graos", "pecuaria_corte"],
    agua: "irrigado",
    fonte: "IRGA / IBGE",
  },

  // ── NORDESTE (fora BA) ──
  "rn-assu-mossoro": {
    key: "rn-assu-mossoro",
    nome: "Assu-Mossoró / Chapada do Apodi (RN)",
    retratoPt:
      "Você está no polo Assu-Mossoró, no Rio Grande do Norte — o maior produtor e exportador de melão do Brasil (RN faz 71,5% do melão nacional). Um aquífero sob a Chapada do Apodi garante a irrigação; também melancia, manga e mamão para exportação.",
    retratoEn:
      "You're in the Assu-Mossoró hub of Rio Grande do Norte — Brazil's largest melon producer and exporter (RN grows 71.5% of national melon). An aquifer under the Apodi Plateau ensures irrigation; also watermelon, mango and papaya for export.",
    vocacoes: ["fruticultura", "manga"],
    agua: "irrigado",
    fonte: "BNB/ETENE / IBGE",
  },
  "ce-baixo-jaguaribe": {
    key: "ce-baixo-jaguaribe",
    nome: "Baixo Jaguaribe / Litoral (CE)",
    retratoPt:
      "Você está no litoral leste do Ceará (Aracati, Icapuí, Limoeiro) — fruticultura irrigada de exportação (melão e melancia em larga escala) e carcinicultura no litoral. O Ceará concentra parcela expressiva do maracujá e do coco do Nordeste.",
    retratoEn:
      "You're on Ceará's eastern coast (Aracati, Icapuí, Limoeiro) — export irrigated fruit (large-scale melon and watermelon) and coastal shrimp farming. Ceará holds a major share of the Northeast's passion fruit and coconut.",
    vocacoes: ["fruticultura", "aquicultura"],
    agua: "irrigado",
    fonte: "BNB/ETENE / ABRAFRUTAS",
  },
  "ce-rn-sertao-caju": {
    key: "ce-rn-sertao-caju",
    nome: "Sertão do Caju (CE/RN)",
    retratoPt:
      "Você está no sertão do cajueiro — o Ceará tem 279 mil hectares e o Rio Grande do Norte 58 mil de caju de sequeiro, base da castanha. A carnaúba (renda em pé, como em Granja/CE) complementa a economia da caatinga.",
    retratoEn:
      "You're in cashew backlands — Ceará has 279,000 hectares and Rio Grande do Norte 58,000 of rainfed cashew, the base for cashew nuts. Carnauba wax (standing income, as in Granja/CE) rounds out the caatinga economy.",
    vocacoes: ["lavoura_permanente", "extrativismo"],
    agua: "dry",
    fonte: "BNB / IBGE PEVS",
  },
  "pe-zona-mata-cana": {
    key: "pe-zona-mata-cana",
    nome: "Zona da Mata (PE/AL/PB)",
    retratoPt:
      "Você está na Zona da Mata nordestina — o litoral úmido histórico da cana-de-açúcar, que moldou a economia de Pernambuco, Alagoas e Paraíba por séculos. O coco também marca presença no litoral.",
    retratoEn:
      "You're in the Northeast's Zona da Mata — the humid coast historically defined by sugarcane, which shaped the economy of Pernambuco, Alagoas and Paraíba for centuries. Coconut is also present along the coast.",
    vocacoes: ["cana"],
    agua: "humid",
    fonte: "CONAB / IBGE",
  },

  // ── NORTE ──
  "pa-nordeste-acai": {
    key: "pa-nordeste-acai",
    nome: "Nordeste do Pará / Ilhas",
    retratoPt:
      "Você está no nordeste do Pará (Belém, Tomé-Açu, Igarapé-Miri) — o maior polo de açaí do Brasil, com dendê agroflorestal em Tomé-Açu, pimenta-do-reino e cacau. Economia de floresta e várzea.",
    retratoEn:
      "You're in northeastern Pará (Belém, Tomé-Açu, Igarapé-Miri) — Brazil's largest açaí hub, with agroforestry oil palm in Tomé-Açu, black pepper and cocoa. A forest-and-floodplain economy.",
    vocacoes: ["extrativismo", "lavoura_permanente", "cacau"],
    agua: "humid",
    fonte: "IBGE PAM",
  },
  "ro-cafe-robusta": {
    key: "ro-cafe-robusta",
    nome: "Rondônia (Matas de Rondônia)",
    retratoPt:
      "Você está em Rondônia (Ji-Paraná, Cacoal, Cone Sul) — polo de café robusta/conilon com Indicação Geográfica 'Matas de Rondônia', pecuária de leite e corte e cacau em expansão.",
    retratoEn:
      "You're in Rondônia (Ji-Paraná, Cacoal, southern cone) — a robusta/conilon coffee hub with the 'Matas de Rondônia' Geographical Indication, dairy and beef cattle, and expanding cocoa.",
    vocacoes: ["lavoura_permanente", "cafe", "pecuaria_corte"],
    agua: "humid",
    fonte: "CONAB / IBGE",
  },
  "matopiba-fronteira": {
    key: "matopiba-fronteira",
    nome: "MATOPIBA (TO/MA/PI)",
    retratoPt:
      "Você está na fronteira do MATOPIBA em Tocantins, sul do Maranhão ou Piauí — a última grande fronteira de grãos do Brasil, com soja e arroz em expansão acelerada (Balsas/MA e Uruçuí/PI como polos).",
    retratoEn:
      "You're on the MATOPIBA frontier in Tocantins, southern Maranhão or Piauí — Brazil's last great grain frontier, with rapidly expanding soybeans and rice (Balsas/MA and Uruçuí/PI as hubs).",
    vocacoes: ["graos"],
    agua: "mista",
    fonte: "CONAB",
  },
};

/**
 * Retrato geral por bioma — fallback quando a mesorregião do usuário não
 * tem retrato curado. Honesto: descreve a tendência do bioma, sem fingir
 * precisão local.
 */
export const BIOMA_FALLBACK: Record<string, RegiaoRetrato> = {
  caatinga: {
    key: "caatinga",
    nome: "Semiárido / Caatinga",
    retratoPt:
      "Sua região fica no domínio da Caatinga (semiárido). Sem irrigação, a vocação típica é a pecuária de caprinos e ovinos, o sequeiro de milho e feijão e o extrativismo (caju, carnaúba, licuri). Com água, a fruticultura irrigada muda o patamar.",
    retratoEn:
      "Your region lies in the Caatinga (semi-arid). Without irrigation, the typical vocation is goat and sheep ranching, rainfed maize and beans, and extractivism (cashew, carnauba, licuri). With water, irrigated fruit changes the scale.",
    vocacoes: ["pecuaria_corte", "extrativismo"],
    agua: "dry",
    fonte: "Embrapa Semiárido / IBGE",
  },
  cerrado: {
    key: "cerrado",
    nome: "Cerrado",
    retratoPt:
      "Sua região fica no Cerrado, o grande bioma de expansão agrícola do Brasil. A vocação predominante é a de grãos (soja e milho) em larga escala, com pecuária e, em áreas específicas, café e algodão.",
    retratoEn:
      "Your region lies in the Cerrado, Brazil's great agricultural-expansion biome. The dominant vocation is large-scale grains (soybeans and maize), with cattle and, in specific areas, coffee and cotton.",
    vocacoes: ["graos", "pecuaria_corte"],
    agua: "mista",
    fonte: "CONAB / Embrapa Cerrados",
  },
  mata_atlantica: {
    key: "mata_atlantica",
    nome: "Mata Atlântica",
    retratoPt:
      "Sua região fica no domínio da Mata Atlântica — clima úmido que favorece culturas perenes como café, cacau, banana e citros, além de olericultura e pecuária de leite, conforme a altitude e o relevo.",
    retratoEn:
      "Your region lies in the Atlantic Forest — a humid climate favoring perennial crops like coffee, cocoa, banana and citrus, plus horticulture and dairy, depending on altitude and terrain.",
    vocacoes: ["lavoura_permanente", "cafe"],
    agua: "humid",
    fonte: "Embrapa / IBGE",
  },
  amazonia: {
    key: "amazonia",
    nome: "Amazônia",
    retratoPt:
      "Sua região fica no bioma Amazônico — vocação para sistemas agroflorestais, açaí, cacau, dendê e café robusta, além de pecuária nas áreas de fronteira. Manejo sustentável é fator central.",
    retratoEn:
      "Your region lies in the Amazon biome — a vocation for agroforestry systems, açaí, cocoa, oil palm and robusta coffee, plus cattle in frontier areas. Sustainable management is a central factor.",
    vocacoes: ["extrativismo", "lavoura_permanente"],
    agua: "humid",
    fonte: "Embrapa / IBGE",
  },
  pampa: {
    key: "pampa",
    nome: "Pampa",
    retratoPt:
      "Sua região fica no Pampa gaúcho — vocação histórica para a pecuária de corte extensiva e o arroz irrigado nas várzeas, com vitivinicultura crescente na Campanha.",
    retratoEn:
      "Your region lies in the Gaúcho Pampa — a historical vocation for extensive beef ranching and irrigated rice in the lowlands, with growing viticulture in the Campanha.",
    vocacoes: ["pecuaria_corte", "graos"],
    agua: "mista",
    fonte: "IBGE / IRGA",
  },
};

/**
 * Mapa estático município(cod IBGE 7 díg ou nome+UF)→região, usado como
 * FALLBACK quando a API do IBGE não responde. Populado pelo script
 * scripts/ingest-mesorregioes.mjs (rodar local). Aqui vão os municípios-
 * âncora já conhecidos da pesquisa; o script completa os 5.570.
 * Chave: "NOME/UF" normalizado maiúsculo sem acento.
 */
export const MUNI_TO_REGIAO: Record<string, string> = {
  // Bahia
  "SAO DESIDERIO/BA": "ba-extremo-oeste",
  "BARREIRAS/BA": "ba-extremo-oeste",
  "LUIS EDUARDO MAGALHAES/BA": "ba-extremo-oeste",
  "FORMOSA DO RIO PRETO/BA": "ba-extremo-oeste",
  "CORRENTINA/BA": "ba-extremo-oeste",
  "JUAZEIRO/BA": "ba-vale-sao-francisco",
  "CASA NOVA/BA": "ba-vale-sao-francisco",
  "CURACA/BA": "ba-vale-sao-francisco",
  "SOBRADINHO/BA": "ba-vale-sao-francisco",
  "ILHEUS/BA": "ba-sul-recôncavo",
  "ITABUNA/BA": "ba-sul-recôncavo",
  "VALENCA/BA": "ba-sul-recôncavo",
  "MUTUIPE/BA": "ba-sul-recôncavo",
  "JIQUIRICA/BA": "ba-sul-recôncavo",
  "JEREMOABO/BA": "ba-sertao-nordeste",
  "PAULO AFONSO/BA": "ba-sertao-nordeste",
  "EUCLIDES DA CUNHA/BA": "ba-sertao-nordeste",
  "IRECE/BA": "ba-centro-norte",
  "FEIRA DE SANTANA/BA": "ba-centro-norte",
  "JACOBINA/BA": "ba-centro-norte",
  // Minas
  "VARGINHA/MG": "mg-sul-de-minas",
  "GUAXUPE/MG": "mg-sul-de-minas",
  "CARMO DE MINAS/MG": "mg-sul-de-minas",
  "PATROCINIO/MG": "mg-cerrado-mineiro",
  "ARAGUARI/MG": "mg-cerrado-mineiro",
  "MONTE CARMELO/MG": "mg-cerrado-mineiro",
  "UBERABA/MG": "mg-cerrado-mineiro",
  "MANHUACU/MG": "mg-matas-de-minas",
  "VICOSA/MG": "mg-matas-de-minas",
  // São Paulo
  "RIBEIRAO PRETO/SP": "sp-ribeirao-cana",
  "BEBEDOURO/SP": "sp-citricola",
  "MATAO/SP": "sp-citricola",
  "ARARAQUARA/SP": "sp-citricola",
  // Centro-Oeste
  "SORRISO/MT": "mt-medio-norte",
  "SINOP/MT": "mt-medio-norte",
  "LUCAS DO RIO VERDE/MT": "mt-medio-norte",
  "NOVA MUTUM/MT": "mt-medio-norte",
  "CAMPO NOVO DO PARECIS/MT": "mt-parecis",
  "SAPEZAL/MT": "mt-parecis",
  "DIAMANTINO/MT": "mt-parecis",
  "RIO VERDE/GO": "go-sudoeste",
  "JATAI/GO": "go-sudoeste",
  "MINEIROS/GO": "go-sudoeste",
  // Sul
  "CAXIAS DO SUL/RS": "rs-serra-gaucha",
  "BENTO GONCALVES/RS": "rs-serra-gaucha",
  "FARROUPILHA/RS": "rs-serra-gaucha",
  "VACARIA/RS": "rs-campos-cima-serra",
  "BOM JESUS/RS": "rs-campos-cima-serra",
  "SAO JOAQUIM/SC": "sc-planalto-serrano",
  "FRAIBURGO/SC": "sc-planalto-serrano",
  "CACADOR/SC": "sc-planalto-serrano",
  "URUGUAIANA/RS": "rs-metade-sul-arroz",
  "ITAQUI/RS": "rs-metade-sul-arroz",
  "SANTANA DO LIVRAMENTO/RS": "rs-metade-sul-arroz",
  // Nordeste
  "MOSSORO/RN": "rn-assu-mossoro",
  "ACU/RN": "rn-assu-mossoro",
  "APODI/RN": "rn-assu-mossoro",
  "BARAUNA/RN": "rn-assu-mossoro",
  "ARACATI/CE": "ce-baixo-jaguaribe",
  "ICAPUI/CE": "ce-baixo-jaguaribe",
  "LIMOEIRO DO NORTE/CE": "ce-baixo-jaguaribe",
  "GRANJA/CE": "ce-rn-sertao-caju",
  "PACAJUS/CE": "ce-rn-sertao-caju",
  // Norte
  "TOME-ACU/PA": "pa-nordeste-acai",
  "IGARAPE-MIRI/PA": "pa-nordeste-acai",
  "JI-PARANA/RO": "ro-cafe-robusta",
  "CACOAL/RO": "ro-cafe-robusta",
  "BALSAS/MA": "matopiba-fronteira",
  "URUCUI/PI": "matopiba-fronteira",
};

/** Resolve o retrato: 1) região curada por município; 2) bioma; 3) null. */
export function retratoPorMunicipio(
  nomeUf: string,
  biomaHint?: string,
): RegiaoRetrato | null {
  const key = nomeUf.trim().toUpperCase();
  const regKey = MUNI_TO_REGIAO[key];
  if (regKey && REGIOES[regKey]) return REGIOES[regKey];
  if (biomaHint && BIOMA_FALLBACK[biomaHint]) return BIOMA_FALLBACK[biomaHint];
  return null;
}
