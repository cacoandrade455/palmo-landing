# Proposta de classificação mesorregião → região (FASE 1)

Gerado por `scripts/gera-meso-classificacao.mjs` a partir de `scripts/out/pam-mesorregiao.json`.
Nada foi escrito em `lib/regioes-agricolas.ts` — este documento e a
planilha `meso-classificacao-proposta.xlsx` existem para revisão humana.

## Contagem por balde

| balde | mesorregiões | municípios cobertos |
| --- | ---: | ---: |
| ALTA_CONFIANCA | 39 | 2058 |
| BIOMA | 76 | 2506 |
| CANDIDATA_NOVA_REGIAO | 22 | 1006 |
| **total** | **137** | **5570** |

## ALTA_CONFIANCA — mesorregião → região curada

- **1102 — Leste Rondoniense (RO)** → `ro-cafe-robusta` (confiança alta) — líder: Soja (em grão) 36.2%
- **1502 — Marajó (PA)** → `pa-nordeste-acai` (confiança media) — líder: Açaí 81.1%
- **1503 — Metropolitana de Belém (PA)** → `pa-nordeste-acai` (confiança alta) — líder: Açaí 64.8%
- **1504 — Nordeste Paraense (PA)** → `pa-nordeste-acai` (confiança alta) — líder: Açaí 41.9%
- **1701 — Ocidental do Tocantins (TO)** → `matopiba-fronteira` (confiança alta) — líder: Soja (em grão) 54%
- **1702 — Oriental do Tocantins (TO)** → `matopiba-fronteira` (confiança alta) — líder: Soja (em grão) 63.9%
- **2104 — Leste Maranhense (MA)** → `matopiba-fronteira` (confiança media) — líder: Soja (em grão) 84.4%
- **2105 — Sul Maranhense (MA)** → `matopiba-fronteira` (confiança alta) — líder: Soja (em grão) 59.8%
- **2203 — Sudoeste Piauiense (PI)** → `matopiba-fronteira` (confiança alta) — líder: Soja (em grão) 79.3%
- **2305 — Jaguaribe (CE)** → `ce-baixo-jaguaribe` (confiança alta) — líder: Banana (cacho) 29.5%
- **2401 — Oeste Potiguar (RN)** → `rn-assu-mossoro` (confiança alta) — líder: Melão 51.4%
- **2504 — Mata Paraibana (PB)** → `pe-zona-mata-cana` (confiança alta) — líder: Cana-de-açúcar 57.2%
- **2602 — São Francisco Pernambucano (PE)** → `ba-vale-sao-francisco` (confiança alta) — líder: Uva 67.2%
- **2604 — Mata Pernambucana (PE)** → `pe-zona-mata-cana` (confiança alta) — líder: Cana-de-açúcar 76%
- **2605 — Metropolitana de Recife (PE)** → `pe-zona-mata-cana` (confiança alta) — líder: Cana-de-açúcar 91.1%
- **2703 — Leste Alagoano (AL)** → `pe-zona-mata-cana` (confiança alta) — líder: Cana-de-açúcar 69.9%
- **2901 — Extremo Oeste Baiano (BA)** → `ba-extremo-oeste` (confiança alta) — líder: Soja (em grão) 61.3%
- **2902 — Vale São-Franciscano da Bahia (BA)** → `ba-vale-sao-francisco` (confiança alta) — líder: Manga 42.6%
- **2903 — Centro Norte Baiano (BA)** → `ba-centro-norte` (confiança alta) — líder: Cebola 35.3%
- **2904 — Nordeste Baiano (BA)** → `ba-sertao-nordeste` (confiança media, **verificar**) — líder: Milho (em grão) 39.6%
- **2907 — Sul Baiano (BA)** → `ba-sul-recôncavo` (confiança alta) — líder: Cacau (em amêndoa) 56.4%
- **3105 — Triângulo Mineiro/Alto Paranaíba (MG)** → `mg-cerrado-mineiro` (confiança alta) — líder: Cana-de-açúcar 27.7%
- **3108 — Vale do Rio Doce (MG)** → `mg-matas-de-minas` (confiança media) — líder: Café (em grão) Total 84.1%
- **3109 — Oeste de Minas (MG)** → `mg-sul-de-minas` (confiança media, **verificar**) — líder: Café (em grão) Total 60.2%
- **3110 — Sul/Sudoeste de Minas (MG)** → `mg-sul-de-minas` (confiança alta) — líder: Café (em grão) Total 71.1%
- **3112 — Zona da Mata (MG)** → `mg-matas-de-minas` (confiança alta) — líder: Café (em grão) Total 88.5%
- **3501 — São José do Rio Preto (SP)** → `sp-ribeirao-cana` (confiança media, **verificar**) — líder: Cana-de-açúcar 63%
- **3502 — Ribeirão Preto (SP)** → `sp-ribeirao-cana` (confiança alta) — líder: Cana-de-açúcar 57.4%
- **3503 — Araçatuba (SP)** → `sp-ribeirao-cana` (confiança media, **verificar**) — líder: Cana-de-açúcar 82.2%
- **3504 — Bauru (SP)** → `sp-citricola` (confiança media) — líder: Laranja 41.1%
- **3505 — Araraquara (SP)** → `sp-citricola` (confiança media, **verificar**) — líder: Cana-de-açúcar 57.9%
- **3506 — Piracicaba (SP)** → `sp-ribeirao-cana` (confiança media, **verificar**) — líder: Cana-de-açúcar 65%
- **3508 — Presidente Prudente (SP)** → `sp-ribeirao-cana` (confiança media, **verificar**) — líder: Cana-de-açúcar 73.8%
- **4203 — Serrana (SC)** → `sc-planalto-serrano` (confiança alta) — líder: Maçã 38.4%
- **4305 — Metropolitana de Porto Alegre (RS)** → `rs-metade-sul-arroz` (confiança media, **verificar**) — líder: Arroz (em casca) 51.5%
- **4306 — Sudoeste Rio-grandense (RS)** → `rs-metade-sul-arroz` (confiança alta) — líder: Arroz (em casca) 55.6%
- **4307 — Sudeste Rio-grandense (RS)** → `rs-metade-sul-arroz` (confiança media) — líder: Arroz (em casca) 46.1%
- **5101 — Norte Mato-grossense (MT)** → `mt-medio-norte` (confiança media, **verificar**) — líder: Soja (em grão) 50.3%
- **5205 — Sul Goiano (GO)** → `go-sudoeste` (confiança alta) — líder: Soja (em grão) 50.2%

## CANDIDATA_NOVA_REGIAO — vocação observada sem região correspondente

- **1505 — Sudoeste Paraense (PA)** — top 3: Cacau (em amêndoa) 77.8%; Banana (cacho) 9.1%; Mandioca 4.6%. O cacau concentra quase todo o valor da mesorregião (Transamazônica/Medicilândia); ba-sul-recôncavo é cacau-cabruca de Mata Atlântica e descreveria errado esta região.
- **3103 — Jequitinhonha (MG)** — top 3: Café (em grão) Total 68.7%; Banana (cacho) 10.6%; Mandioca 3.8%. O café arábica concentra a maior parte do valor no Jequitinhonha e nenhuma das três regiões cafeeiras curadas (Sul de Minas, Cerrado Mineiro, Matas de Minas) cobre o vale.
- **3201 — Noroeste Espírito-santense (ES)** — top 3: Café (em grão) Total 82.6%; Pimenta-do-reino 10.9%; Banana (cacho) 1.8%. O café concentra a maior parte do valor com predominância canephora e pimenta-do-reino em seguida; nenhuma região curada cobre o conilon capixaba (ro-cafe-robusta é Rondônia).
- **3202 — Litoral Norte Espírito-santense (ES)** — top 3: Café (em grão) Total 55.6%; Pimenta-do-reino 19.9%; Mamão 9.5%. Café canephora lidera com pimenta-do-reino e mamão atrás — mesmo polo de conilon do norte capixaba, sem região curada.
- **3203 — Central Espírito-santense (ES)** — top 3: Café (em grão) Total 69.7%; Banana (cacho) 13.9%; Tomate 6.8%. Café lidera no centro capixaba com as duas variedades presentes; sem região curada e com dominância dividida entre lavoura e pecuária.
- **3204 — Sul Espírito-santense (ES)** — top 3: Café (em grão) Total 89.7%; Abacaxi* 3.2%; Tomate 2.1%. O café responde por quase todo o valor com predominância arábica — as montanhas do sul capixaba, sem região curada correspondente.
- **3514 — Litoral Sul Paulista (SP)** — top 3: Banana (cacho) 87.3%; Palmito 5.7%; Tangerina 2.8%. A banana concentra quase todo o valor do Vale do Ribeira, maior polo bananicultor do país, e nenhuma região curada o representa.
- **4102 — Centro Ocidental Paranaense (PR)** — top 3: Soja (em grão) 59%; Milho (em grão) 32.9%; Trigo (em grão) 2.7%. Soja e milho concentram quase todo o valor; nenhuma região curada cobre o cinturão de grãos do Paraná e o fallback de Mata Atlântica falaria de café, cacau e banana.
- **4103 — Norte Central Paranaense (PR)** — top 3: Soja (em grão) 46.2%; Milho (em grão) 27.8%; Cana-de-açúcar 12.5%. Soja e milho lideram com a cana atrás; mesmo cinturão de grãos paranaense, sem região curada.
- **4104 — Norte Pioneiro Paranaense (PR)** — top 3: Soja (em grão) 38.9%; Milho (em grão) 20.5%; Cana-de-açúcar 10.5%. Soja, milho e cana dividem o valor no Norte Pioneiro, historicamente cafeeiro; hoje o perfil é de grãos e não há região curada.
- **4105 — Centro Oriental Paranaense (PR)** — top 3: Soja (em grão) 61.1%; Milho (em grão) 13.1%; Feijão (em grão) 6.7%. Soja lidera com folga nos Campos Gerais, grãos de alta tecnologia sem região curada correspondente.
- **4106 — Oeste Paranaense (PR)** — top 3: Soja (em grão) 56.1%; Milho (em grão) 35.9%; Trigo (em grão) 3.9%. Soja e milho concentram o valor no oeste paranaense, com a agroindústria de aves e suínos ao lado; sem região curada.
- **4107 — Sudoeste Paranaense (PR)** — top 3: Soja (em grão) 62.1%; Feijão (em grão) 12.8%; Trigo (em grão) 10.3%. Soja lidera com feijão e trigo atrás no sudoeste paranaense; sem região curada e com dominância dividida.
- **4108 — Centro-Sul Paranaense (PR)** — top 3: Soja (em grão) 55.8%; Feijão (em grão) 11.9%; Batata-inglesa 10.7%. Soja lidera com feijão e batata atrás no centro-sul paranaense; sem região curada correspondente.
- **4109 — Sudeste Paranaense (PR)** — top 3: Soja (em grão) 39.5%; Fumo (em folha) 31.7%; Feijão (em grão) 8.8%. Soja lidera com o fumo logo atrás — grãos e tabaco no sudeste paranaense, sem região curada.
- **4201 — Oeste Catarinense (SC)** — top 3: Soja (em grão) 46.9%; Milho (em grão) 16.3%; Trigo (em grão) 5.7%. Soja e milho lideram e a dominância é pecuária: é o polo de aves e suínos do oeste catarinense. As âncoras de maçã (Fraiburgo e Caçador) caem neste recorte, mas herdar sc-planalto-serrano descreveria errado a maioria dos municípios.
- **4202 — Norte Catarinense (SC)** — top 3: Fumo (em folha) 30.5%; Soja (em grão) 27.3%; Banana (cacho) 17.9%. O fumo lidera com soja e banana atrás — norte catarinense no cinturão do tabaco do Sul, sem região curada.
- **4204 — Vale do Itajaí (SC)** — top 3: Fumo (em folha) 32.8%; Banana (cacho) 20.6%; Arroz (em casca) 16%. O fumo lidera no Vale do Itajaí, com banana e arroz atrás; mesmo cinturão do tabaco, sem região curada.
- **4206 — Sul Catarinense (SC)** — top 3: Arroz (em casca) 51.1%; Fumo (em folha) 23.4%; Banana (cacho) 7.5%. O arroz irrigado lidera no sul catarinense, segundo maior polo do país; rs-metade-sul-arroz é recorte gaúcho e não serve.
- **4301 — Noroeste Rio-grandense (RS)** — top 3: Soja (em grão) 71.8%; Trigo (em grão) 9.8%; Milho (em grão) 8.2%. Soja e trigo concentram o valor no planalto gaúcho, o maior conjunto de municípios do país neste recorte; nenhuma região curada cobre e o fallback de Mata Atlântica erraria a vocação.
- **4303 — Centro Ocidental Rio-grandense (RS)** — top 3: Soja (em grão) 67.4%; Arroz (em casca) 16%; Fumo (em folha) 4.7%. Soja lidera com arroz atrás no centro gaúcho; mesmo cinturão de grãos, sem região curada.
- **4304 — Centro Oriental Rio-grandense (RS)** — top 3: Fumo (em folha) 45.3%; Soja (em grão) 27.1%; Arroz (em casca) 13.3%. O fumo lidera com folga no Vale do Rio Pardo, maior polo de tabaco do país, e não há região curada correspondente.

## BIOMA — fallback honesto

- **1101 — Madeira-Guaporé (RO)** → `amazonia` (confiança media, **verificar**)
- **1201 — Vale do Juruá (AC)** → `amazonia` (confiança alta)
- **1202 — Vale do Acre (AC)** → `amazonia` (confiança media)
- **1301 — Norte Amazonense (AM)** → `amazonia` (confiança alta)
- **1302 — Sudoeste Amazonense (AM)** → `amazonia` (confiança alta)
- **1303 — Centro Amazonense (AM)** → `amazonia` (confiança media)
- **1304 — Sul Amazonense (AM)** → `amazonia` (confiança media)
- **1401 — Norte de Roraima (RR)** → `amazonia` (confiança baixa, **verificar**)
- **1402 — Sul de Roraima (RR)** → `amazonia` (confiança media)
- **1501 — Baixo Amazonas (PA)** → `amazonia` (confiança media, **verificar**)
- **1506 — Sudeste Paraense (PA)** → `amazonia` (confiança media, **verificar**)
- **1601 — Norte do Amapá (AP)** → `amazonia` (confiança media)
- **1602 — Sul do Amapá (AP)** → `amazonia` (confiança media)
- **2101 — Norte Maranhense (MA)** → `amazonia` (confiança baixa, **verificar**)
- **2102 — Oeste Maranhense (MA)** → `amazonia` (confiança baixa, **verificar**)
- **2103 — Centro Maranhense (MA)** → `cerrado` (confiança baixa, **verificar**)
- **2201 — Norte Piauiense (PI)** → `caatinga` (confiança baixa, **verificar**)
- **2202 — Centro-Norte Piauiense (PI)** → `cerrado` (confiança baixa, **verificar**)
- **2204 — Sudeste Piauiense (PI)** → `caatinga` (confiança alta)
- **2301 — Noroeste Cearense (CE)** → `caatinga` (confiança baixa, **verificar**)
- **2302 — Norte Cearense (CE)** → `caatinga` (confiança media, **verificar**)
- **2303 — Metropolitana de Fortaleza (CE)** → `caatinga` (confiança baixa, **verificar**)
- **2304 — Sertões Cearenses (CE)** → `caatinga` (confiança alta)
- **2306 — Centro-Sul Cearense (CE)** → `caatinga` (confiança media)
- **2307 — Sul Cearense (CE)** → `caatinga` (confiança media, **verificar**)
- **2402 — Central Potiguar (RN)** → `caatinga` (confiança media)
- **2403 — Agreste Potiguar (RN)** → `caatinga` (confiança baixa, **verificar**)
- **2404 — Leste Potiguar (RN)** → `mata_atlantica` (confiança media, **verificar**)
- **2501 — Sertão Paraibano (PB)** → `caatinga` (confiança alta)
- **2502 — Borborema (PB)** → `caatinga` (confiança media)
- **2503 — Agreste Paraibano (PB)** → `caatinga` (confiança baixa, **verificar**)
- **2601 — Sertão Pernambucano (PE)** → `caatinga` (confiança alta)
- **2603 — Agreste Pernambucano (PE)** → `caatinga` (confiança baixa, **verificar**)
- **2701 — Sertão Alagoano (AL)** → `caatinga` (confiança alta)
- **2702 — Agreste Alagoano (AL)** → `caatinga` (confiança baixa, **verificar**)
- **2801 — Sertão Sergipano (SE)** → `caatinga` (confiança media)
- **2802 — Agreste Sergipano (SE)** → `caatinga` (confiança baixa, **verificar**)
- **2803 — Leste Sergipano (SE)** → `mata_atlantica` (confiança media, **verificar**)
- **2905 — Metropolitana de Salvador (BA)** → `mata_atlantica` (confiança media)
- **2906 — Centro Sul Baiano (BA)** → `caatinga` (confiança baixa, **verificar**)
- **3101 — Noroeste de Minas (MG)** → `cerrado` (confiança alta)
- **3102 — Norte de Minas (MG)** → `cerrado` (confiança baixa, **verificar**)
- **3104 — Vale do Mucuri (MG)** → `mata_atlantica` (confiança media, **verificar**)
- **3106 — Central Mineira (MG)** → `cerrado` (confiança media)
- **3107 — Metropolitana de Belo Horizonte (MG)** → `cerrado` (confiança baixa, **verificar**)
- **3111 — Campo das Vertentes (MG)** → `mata_atlantica` (confiança media, **verificar**)
- **3301 — Noroeste Fluminense (RJ)** → `mata_atlantica` (confiança media, **verificar**)
- **3302 — Norte Fluminense (RJ)** → `mata_atlantica` (confiança media)
- **3303 — Centro Fluminense (RJ)** → `mata_atlantica` (confiança media)
- **3304 — Baixadas (RJ)** → `mata_atlantica` (confiança media)
- **3305 — Sul Fluminense (RJ)** → `mata_atlantica` (confiança media)
- **3306 — Metropolitana do Rio de Janeiro (RJ)** → `mata_atlantica` (confiança media)
- **3507 — Campinas (SP)** → `mata_atlantica` (confiança baixa, **verificar**)
- **3509 — Marília (SP)** → `mata_atlantica` (confiança media, **verificar**)
- **3510 — Assis (SP)** → `mata_atlantica` (confiança media, **verificar**)
- **3511 — Itapetininga (SP)** → `mata_atlantica` (confiança media)
- **3512 — Macro Metropolitana Paulista (SP)** → `mata_atlantica` (confiança media, **verificar**)
- **3513 — Vale do Paraíba Paulista (SP)** → `mata_atlantica` (confiança media)
- **3515 — Metropolitana de São Paulo (SP)** → `mata_atlantica` (confiança media)
- **4101 — Noroeste Paranaense (PR)** → `mata_atlantica` (confiança media, **verificar**)
- **4110 — Metropolitana de Curitiba (PR)** → `mata_atlantica` (confiança media, **verificar**)
- **4205 — Grande Florianópolis (SC)** → `mata_atlantica` (confiança media, **verificar**)
- **4302 — Nordeste Rio-grandense (RS)** → `mata_atlantica` (confiança baixa, **verificar**)
- **5001 — Pantanais Sul Mato-grossense (MS)** → `cerrado` (confiança baixa, **verificar**)
- **5002 — Centro Norte de Mato Grosso do Sul (MS)** → `cerrado` (confiança alta)
- **5003 — Leste de Mato Grosso do Sul (MS)** → `cerrado` (confiança alta)
- **5004 — Sudoeste de Mato Grosso do Sul (MS)** → `cerrado` (confiança alta)
- **5102 — Nordeste Mato-grossense (MT)** → `cerrado` (confiança alta)
- **5103 — Sudoeste Mato-grossense (MT)** → `cerrado` (confiança baixa, **verificar**)
- **5104 — Centro-Sul Mato-grossense (MT)** → `cerrado` (confiança alta)
- **5105 — Sudeste Mato-grossense (MT)** → `cerrado` (confiança alta)
- **5201 — Noroeste Goiano (GO)** → `cerrado` (confiança alta)
- **5202 — Norte Goiano (GO)** → `cerrado` (confiança alta)
- **5203 — Centro Goiano (GO)** → `cerrado` (confiança alta)
- **5204 — Leste Goiano (GO)** → `cerrado` (confiança media, **verificar**)
- **5301 — Distrito Federal (DF)** → `cerrado` (confiança alta)

## Verificar — dado ambíguo ou recorte grosso demais

- **1101 — Madeira-Guaporé (RO)** — O café canephora tem peso relevante e sugere parentesco com ro-cafe-robusta, mas a soja lidera e a dominância é pecuária — o retrato do bioma é a leitura honesta.
- **1401 — Norte de Roraima (RR)** — A soja lidera (frente de grãos do lavrado), mas nenhuma região curada cobre Roraima e o retrato do bioma amazônico não fala de grãos.
- **1501 — Baixo Amazonas (PA)** — Mandioca lidera com soja e cacau logo atrás — mesorregião de perfil misto (Santarém), sem vocação única.
- **1506 — Sudeste Paraense (PA)** — A soja lidera e a dominância é pecuária (frente de grãos e boi de Carajás); nenhuma região curada cobre o sudeste paraense.
- **2101 — Norte Maranhense (MA)** — Arroz e mandioca empatam na liderança; a mesorregião fica na transição Amazônia/Cerrado (Mata dos Cocais) e o bioma precisa de conferência humana.
- **2102 — Oeste Maranhense (MA)** — A soja lidera, mas o recorte é de pré-Amazônia maranhense e a dominância é pecuária; conferir o bioma e se a mesorregião entra na delimitação do MATOPIBA.
- **2103 — Centro Maranhense (MA)** — A soja lidera na transição cerrado/cocais; bioma a conferir e sem região curada que descreva o centro maranhense.
- **2201 — Norte Piauiense (PI)** — Mandioca e arroz lideram no litoral e nos cocais piauienses; bioma de transição, a conferir.
- **2202 — Centro-Norte Piauiense (PI)** — Cana e soja lideram na região de Teresina, transição caatinga/cerrado; bioma a conferir.
- **2301 — Noroeste Cearense (CE)** — Contém a âncora de Granja (ce-rn-sertao-caju), mas o valor é liderado por maracujá e olerícolas da Serra da Ibiapaba; herdar a região do caju pintaria errado a mesorregião inteira.
- **2302 — Norte Cearense (CE)** — Coco lidera com a castanha de caju logo atrás — há parentesco com ce-rn-sertao-caju, mas o líder não é o caju e a região curada não fala de coco.
- **2303 — Metropolitana de Fortaleza (CE)** — Contém a âncora de Pacajus (ce-rn-sertao-caju), mas o valor é pequeno e pulverizado entre mandioca, banana e coco.
- **2307 — Sul Cearense (CE)** — Mandioca e banana lideram no Cariri; sem região curada correspondente.
- **2403 — Agreste Potiguar (RN)** — Agreste potiguar, transição caatinga/Mata Atlântica; mandioca e abacaxi lideram, bioma a conferir.
- **2404 — Leste Potiguar (RN)** — A cana lidera, perfil de Zona da Mata, mas pe-zona-mata-cana hoje cobre só PE/AL/PB — avaliar estender a região curada ao RN em vez de forçar o encaixe.
- **2503 — Agreste Paraibano (PB)** — Agreste paraibano, transição caatinga/Mata Atlântica; bioma a conferir.
- **2603 — Agreste Pernambucano (PE)** — Agreste pernambucano, transição caatinga/Mata Atlântica, com valor pulverizado; bioma a conferir.
- **2702 — Agreste Alagoano (AL)** — Agreste alagoano, transição caatinga/Mata Atlântica; bioma a conferir.
- **2802 — Agreste Sergipano (SE)** — Agreste sergipano em transição; milho lidera e a dominância é pecuária.
- **2803 — Leste Sergipano (SE)** — A laranja lidera (citricultura sergipana) com coco atrás; o retrato do bioma cita citros, mas o polo mereceria região própria — sp-citricola é recorte paulista.
- **2904 — Nordeste Baiano (BA)** — Contém as âncoras de Jeremoabo e Euclides da Cunha e o milho de sequeiro lidera; ressalva: a laranja do litoral norte (Rio Real) pesa no segundo lugar e não está no retrato.
- **2906 — Centro Sul Baiano (BA)** — Recorte muito heterogêneo: café do planalto de Vitória da Conquista, batata da Chapada Diamantina e cacau do vale do Jiquiriçá; as âncoras de Mutuípe e Jiquiriçá seguem em ba-sul-recôncavo e o resto não cabe numa região só.
- **3102 — Norte de Minas (MG)** — A banana dos perímetros irrigados do Jaíba lidera no semiárido mineiro; conferir o bioma (cerrado/caatinga) e avaliar região própria de fruticultura irrigada.
- **3104 — Vale do Mucuri (MG)** — O café lidera no Mucuri, mas fora do recorte das Matas de Minas; o retrato do bioma já cita café como vocação úmida.
- **3107 — Metropolitana de Belo Horizonte (MG)** — Valor pulverizado em fruticultura e olericultura de cinturão verde; transição cerrado/Mata Atlântica, bioma a conferir.
- **3109 — Oeste de Minas (MG)** — O café arábica lidera com folga e a região é contígua ao Sul de Minas; conferir se o Oeste de Minas não merece recorte próprio.
- **3111 — Campo das Vertentes (MG)** — Café divide espaço com milho e soja em Campo das Vertentes, bacia leiteira; nenhuma região cafeeira curada cobre o recorte.
- **3301 — Noroeste Fluminense (RJ)** — O café arábica lidera no noroeste fluminense, mas nenhuma região cafeeira curada cobre o RJ; o retrato do bioma já cita café.
- **3501 — São José do Rio Preto (SP)** — A cana lidera com folga, perfil sucroenergético igual ao do retrato; ressalva: o texto cita Ribeirão Preto nominalmente e leria estranho em São José do Rio Preto.
- **3503 — Araçatuba (SP)** — A cana responde por mais de quatro quintos do valor; mesma ressalva do nome da região, que cita Ribeirão Preto.
- **3505 — Araraquara (SP)** — Contém as âncoras de Matão e Araraquara e a laranja é o segundo produto; ressalva: a cana lidera, o recorte mistura usina e citros.
- **3506 — Piracicaba (SP)** — A cana lidera com folga em Piracicaba, berço da agroindústria canavieira; mesma ressalva do nome da região.
- **3507 — Campinas (SP)** — Laranja, cana e café da Mogiana dividem o valor sem um vencedor claro; nenhuma região curada descreve o conjunto.
- **3508 — Presidente Prudente (SP)** — A cana responde por quase três quartos do valor no oeste paulista; mesma ressalva do nome da região.
- **3509 — Marília (SP)** — O amendoim lidera em Marília, com cana e café atrás; nenhuma região curada cobre a vocação do amendoim.
- **3510 — Assis (SP)** — A cana lidera, mas com menos da metade do valor, e soja e milho pesam — não é o perfil de usina puro do retrato de sp-ribeirao-cana.
- **3512 — Macro Metropolitana Paulista (SP)** — A uva de Jundiaí/São Roque lidera, mas rs-serra-gaucha é recorte gaúcho e não descreve a viticultura paulista.
- **4101 — Noroeste Paranaense (PR)** — Cana e mandioca lideram no arenito do noroeste paranaense; nenhuma região curada cobre a vocação da mandioca industrial.
- **4110 — Metropolitana de Curitiba (PR)** — Soja, batata e fumo dividem o valor no entorno de Curitiba, com forte olericultura de abastecimento; sem região curada.
- **4201 — Oeste Catarinense (SC)** — Soja e milho lideram e a dominância é pecuária: é o polo de aves e suínos do oeste catarinense. As âncoras de maçã (Fraiburgo e Caçador) caem neste recorte, mas herdar sc-planalto-serrano descreveria errado a maioria dos municípios.
- **4205 — Grande Florianópolis (SC)** — A cebola lidera na Grande Florianópolis (Ituporanga e entorno); nenhuma região curada cobre a vocação da cebola.
- **4302 — Nordeste Rio-grandense (RS)** — O recorte reúne DUAS regiões curadas distintas — Serra Gaúcha (uva) e Campos de Cima da Serra (maçã) — e ainda tem soja liderando; a camada mesorregional é grossa demais aqui e o caso pede microrregião.
- **4305 — Metropolitana de Porto Alegre (RS)** — O arroz irrigado lidera e o retrato cita a planície costeira; ressalva: a região se chama 'Metade Sul' e este recorte é metropolitano.
- **5001 — Pantanais Sul Mato-grossense (MS)** — O Pantanal não tem retrato próprio em BIOMA_FALLBACK e a dominância aqui é pecuária extensiva; o cerrado é o vizinho mais próximo, mas o certo seria criar o fallback do Pantanal.
- **5101 — Norte Mato-grossense (MT)** — Contém as quatro âncoras do Médio-Norte (Sorriso, Sinop, Lucas do Rio Verde e Nova Mutum) e soja, milho e algodão lideram; ressalva: as âncoras dos Parecis caem no mesmo recorte e separá-las exige microrregião.
- **5103 — Sudoeste Mato-grossense (MT)** — Soja e cana lideram com dominância pecuária e parte do recorte é Pantanal, que não tem fallback próprio.
- **5204 — Leste Goiano (GO)** — Soja lidera com batata irrigada por pivô atrás (Cristalina); o retrato do bioma cobre os grãos, mas não a agricultura irrigada de alto valor.

## Achados que independem da classificação

- **Âncoras que nunca casam com a malha oficial do IBGE** (o nome em `MUNI_TO_REGIAO` não existe no dado do IBGE, então o município cai direto no bioma hoje): SANTANA DO LIVRAMENTO/RS → rs-metade-sul-arroz; ACU/RN → rn-assu-mossoro.
- **O Pantanal não tem retrato em `BIOMA_FALLBACK`.** As mesorregiões pantaneiras (5001 e parte da 5103) estão propostas como `cerrado` por falta de opção melhor — vale criar o fallback do bioma.
- **A mesorregião é grossa demais em três casos conhecidos:** 4302 (Serra Gaúcha e Campos de Cima da Serra no mesmo recorte), 5101 (Médio-Norte e Parecis) e 3502/3505 (cana de Ribeirão e citros de Bebedouro/Matão). Nesses, o caminho é microrregião, não mesorregião.
- **Nomes de região que ficariam estranhos se generalizados:** `sp-ribeirao-cana` cita Ribeirão Preto nominalmente mas serviria a todo o interior canavieiro; `ba-vale-sao-francisco` diz (BA) mas o retrato já cita Petrolina/PE.
- A camada mesorregional só age em município SEM âncora: `retratoPorMunicipio` consulta `MUNI_TO_REGIAO` primeiro. Por isso propor BIOMA numa mesorregião que contém âncora não rebaixa a âncora.

## Como ler a planilha

Toda justificativa termina com o dado que a sustenta, interpolado do JSON da PAM (produto líder, participação no valor e valor em mil reais) e com as âncoras encontradas no recorte. Nenhum número foi digitado à mão.
