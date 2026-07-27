# Modelo hídrico da calculadora — diagnóstico e dossiê (reauditoria jul/2026)

> Fase 6 da reauditoria geral. Parte 1 = diagnóstico dos mecanismos vigentes
> (lido do código em 27/jul/2026, antes de qualquer edição desta branch).
> Parte 2 = dossiê hídrico por cultura, com fonte (preenchido nesta branch).

## Parte 1 — Diagnóstico dos mecanismos atuais

O motor (`lib/land-recommender.ts`) tinha QUATRO mecanismos hídricos, todos
binários e parcialmente sobrepostos:

1. **`NEEDS_IRRIGATION`** (set de 7 chaves: manga, melão, uva, mamão, coco,
   tilápia, camarão) — "fruticultura de semiárido": só viável com fonte de
   água, EXCETO quando a região curada tem `agua: "humid"` (aí vira sequeiro,
   conserto do PR #19 para a uva da Serra Gaúcha). Tilápia/camarão nunca são
   dispensados (`NEEDS_WATER_BODY`).
2. **`RAINFED_OK`** (set de 11 chaves: cacau, café, banana, citros, açaí,
   goiaba, maracujá, abacate, maçã, pêssego, abacaxi) — perenes "de chuva".
   O nome engana: em município do set `DRY`, uma cultura `RAINFED_OK` **sem
   água recebe score −700 e é rebaixada**. É por isso que goiaba, banana e
   maracujá aparecem rebaixadas no semiárido SEM estar no set de irrigação:
   o balde "sequeiro" pressupõe clima úmido, e no seco ele se converte em
   "exige irrigação" sem dizer isso em lugar nenhum.
3. **`neutral`** (todo o resto, por omissão) — melancia, mandioca, caprinos,
   feijão, algodão, soja... No clima seco, neutro ganha +250 ("a economia do
   sertão"). A melancia liderar em Xique-Xique era um ACIDENTE dessa omissão:
   ela não estava classificada em nenhum set, então caía no balde neutro e
   sobrevivia onde as demais frutas eram rebaixadas — o motor acertava o
   resultado (existe melancia de sequeiro no semiárido, ver Parte 2) pelo
   motivo errado (falta de classificação).
4. **`regionMoisture`** — lista curada de municípios `DRY` (semiárido SUDENE)
   e `HUMID` (litoral cacaueiro), não exaustiva; o resto é `unknown`.

Problemas estruturais que esta fase corrige:

- **Não existia o conceito "adaptada ao sequeiro do semiárido"**: caju e
  carnaúba só escapavam do rebaixamento por acaso (balde neutro), e a
  melancia idem. A distinção real tem três eixos (exige água sempre; exige
  água só no semiárido; prospera no semiárido sem água), não dois.
- **O blurb de "clima seco" era genérico**: dizia "adaptada ao clima seco"
  para qualquer cultura neutra — inclusive soja e cana, que de "caatinga"
  não têm nada. O texto agora é condicionado ao atributo hídrico real.
- **Cultura sem faixa de renda não tinha regra de ordenação declarada**: a
  melancia de Xique-Xique liderava por eliminação (todas as outras
  rebaixadas) e ficava SEM faixa de R$/ha, ordenada no bloco alfabético
  final. A regra agora é explícita no código e documentada.
- **Vocações de sequeiro ausentes nas regiões secas**: o retrato do Vale
  São-Franciscano (`ba-vale-sao-francisco`) só listava fruticultura irrigada;
  um dono de terra SEM água em Xique-Xique via só cards rebaixados + melancia.
  As vocações de sequeiro documentadas (Parte 2) entram nas regiões `dry` e
  `irrigado` do semiárido.

## Parte 2 — Dossiê hídrico por cultura (fonte por linha)

A tabela viva é `WATER_PROFILE` em `lib/land-recommender.ts` (cada linha com
comentário-fonte). Aqui, o caso-teste, os três casos que motivaram a fase e
as fontes primárias principais.

### Caso-teste: melancia — `sequeiro_semiarido_ok` (risco interanual)

As duas evidências são complementares, não contraditórias:

- **Sequeiro existe e é tradicional na caatinga**: "No Nordeste do Brasil, o
  cultivo da melancia ocorre sob condições de sequeiro, no período chuvoso
  [dez–mar], e sob irrigação" — Embrapa Semiárido, **Comunicado Técnico
  180/2020** (https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1128673/1/Recomendacao-de-cultivares-de-melancia-180.pdf).
  Método de captação de chuva para melancia de sequeiro em Massaroca,
  **Juazeiro-BA**: Embrapa Semi-Árido, **Instruções Técnicas 11/1999**
  (https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/131477/1/Aracao-em-faixas-Instrucoes-Tecnicas-11.pdf).
- **Os polos comerciais são irrigados** (Mossoró/Açu, Uruana) ou de clima
  úmido (Teixeira de Freitas): "no Semiárido é essencial o uso da irrigação
  para altas produtividades" — Embrapa, Sistemas de Produção 6 (2010).
- Leitura: a melancia não é xerófila — é **rápida o bastante (65–85 dias,
  300–550 mm) para caber dentro da quadra chuvosa**. O que separa sequeiro
  de irrigado é produtividade e risco, não viabilidade. Por isso o flag
  `riscoInteranual` e o aviso na UI.
- **Correção à hipótese inicial**: a cultivar BRS Opara NÃO é prova de
  sequeiro — herda da melancia nativa resistência a oídio, e foi ensaiada
  IRRIGADA em Petrolina. A prova é o CT 180 + IT 11.

### Os três casos que motivaram a fase

- **Goiaba** → `irrigacao_semiarido`. Embrapa (*Plantar Goiaba*, 2010):
  sequeiro comercial só com 800–1.000 mm bem distribuídos; **abaixo de
  600 mm perde as folhas e não produz**. A goiaba paulista de indústria é
  majoritariamente de sequeiro (IEA-SP); o polo do semiárido (Petrolina) é
  100% irrigado. Estava ERRADA em `RAINFED_OK`.
- **Banana** → `irrigacao_semiarido`. Exige ≥1.100 mm ("bem mais" no
  semiárido — Embrapa); o polo Jaíba/Janaúba é integralmente de perímetro
  irrigado (SEAPA-MG). O motor mandava banana de sequeiro para Jaíba.
- **Maracujá** → `irrigacao_semiarido`. *P. edulis* exige ≥70 mm/mês ou
  800–1.750 mm; o polo Livramento/Dom Basílio é irrigado por barragem
  (SEINFRA-BA). Nota de produto: o **maracujá-da-caatinga BRS Sertão Forte**
  (*P. cincinnata*, Embrapa Semiárido, 18–29 t/ha) é a única fruteira
  comercial registrada do bioma e candidata a entrada própria
  `sequeiro_semiarido_ok` num próximo lote.

### Decisões estruturais

- `umido_obrigatorio` significa "irrigação não compra o clima" (cacau, açaí,
  maçã, pêssego, pinhão, castanha, piaçava, trigo, abacate) — no semiárido a
  cultura é rebaixada MESMO com água. Em maçã/pêssego/trigo o limitante real
  é frio de inverno, registrado em comentário.
- `arroz` tem exceção regional (`REGIONAL_PROFILE_OVERRIDE`): default
  `agua_sempre` (RS/SC inundação, IRGA/Epagri), `neutro` no MATOPIBA
  (terras altas de sequeiro, Embrapa Arroz e Feijão).
- Contexto semiárido = município no set DRY **ou** região do conjunto
  `REGIOES_SEMIARIDAS` — o campo `agua: "irrigado"` sozinho é ambíguo (vale
  para o VSF e para a Metade Sul gaúcha). Isso corrige a lacuna nº 4 do
  PR #19: a uva da Campanha deixou de "pedir irrigação".
- Vocações de sequeiro adicionadas às regiões secas: caprinos/ovinos e
  melancia de sequeiro no Vale São-Franciscano; caju nos tabuleiros do
  Baixo Jaguaribe; o Sertão Paraibano já nasce com ovinos/caprinos.
- Regra de ordenação para cultura sem faixa de renda explicitada no motor
  (comentário do passo 4): sem faixa nunca ultrapassa quem tem faixa, mas
  pode liderar por eliminação — caso Xique-Xique sem água.
- Fumo mantido `neutro` (nenhum documento oficial de regime hídrico
  localizado — conservador); pecuária de leite idem.
- Guarda estendido cobre o modelo: H1 (blurb seco × fato "irrigad"),
  H2 (região seca × vocação-chave sem perfil), H3-INFO (frescor).
