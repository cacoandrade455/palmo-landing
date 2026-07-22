---
name: auditoria-dados-receita-retratos
description: Auditoria factual profunda de duas camadas de dados — os modelos de receita (appraisal-data.ts) e os retratos regionais (regioes-agricolas.ts) — conferindo cada número contra fonte atual (2024/2025), sinalizando o que envelheceu ou não bate, e corrigindo só com fonte real. Nunca inventa.
---

Você faz uma auditoria factual PROFUNDA de duas camadas de dados da
calculadora. Leia o CLAUDE.md. Estes arquivos estão na lista de dados
intocáveis (regra 4) — Carlos AUTORIZOU explicitamente esta auditoria e
vai revisar tudo antes de mergear; correções só entram com FONTE REAL,
jamais um número inventado. Se um dado não puder ser confirmado por
fonte, SINALIZE como "não confirmado" em vez de alterar.

## Camada 1 — Modelos de receita (lib/appraisal-data.ts)
É a camada do DINHEIRO: os R$/ha que a calculadora mostra como "renda
estimada". Um número errado aqui faz o produtor decidir com base falsa.
Contém ~14 modelos de cultura formada (formedCropRefs), cada um com
revMin/revMax e um sourceNote citando fonte e ano. Alguns são valores
fixos (ex.: cacau 35-45k), outros calculados por produtividade × preço
vivo (manga, coco, açaí).

Para CADA modelo (cacau, banana, café, citros, manga, uva, mamão,
maracujá, coco, açaí, goiaba, abacate, maçã, e os demais presentes):
1. Conferir o número contra fonte ATUAL (2024/2025): a produtividade
   (t/ha) e o preço/rendimento (R$/ha) ainda batem? Pesquisar IBGE PAM
   (mais recente), CONAB, Embrapa, CEPEA, BNB/ETENE, painéis estaduais.
2. Verificar se o sourceNote está correto e se o ANO citado ainda é o
   mais recente disponível. Se houver dado mais novo, atualizar o número
   E a fonte.
3. Sinalizar qualquer modelo cujo valor esteja DESATUALIZADO (fonte
   antiga com dado novo disponível) ou INCONSISTENTE com a realidade de
   mercado.
4. Onde o modelo usa preço vivo (price("kg_manga") etc.), NÃO alterar a
   lógica de cálculo nem o prices.json — só conferir se a produtividade
   base e a fonte citada estão corretas.

## Camada 2 — Retratos regionais (lib/regioes-agricolas.ts)
São os 23 retratos de vocação por região (REGIOES) + 5 de bioma. Os 5
BAIANOS já foram validados por Carlos célula a célula — NÃO mexer neles
(ba-extremo-oeste, ba-vale-sao-francisco, ba-sul-recôncavo,
ba-sertao-nordeste, ba-centro-norte). Auditar os DEMAIS 18 + os de bioma:

Para cada retrato não-baiano (MG, SP, Centro-Oeste, Sul, NE fora BA,
Norte):
1. Conferir cada AFIRMAÇÃO NUMÉRICA no retratoPt/retratoEn contra fonte
   atual. Ex.: "Serra Gaúcha faz 90% do vinho", "São Joaquim 35% da
   maçã", "Sorriso maior produtor do Brasil", "RN 71,5% do melão", "São
   Desidério 2º maior produtor agrícola". Cada número precisa bater com
   IBGE/CONAB/Embrapa/fonte oficial.
2. Verificar se a `fonte` citada sustenta a afirmação.
3. Conferir se as vocações listadas e os municípios-âncora (MUNI_TO_REGIAO)
   estão corretos — um município no mapa de região errada gera retrato
   errado.
4. Sinalizar e corrigir (com fonte) qualquer número desatualizado ou
   afirmação sem lastro.

## Regras invioláveis
- Número, share, ranking, produtividade: SÓ com fonte verificável e
  atual. Pesquisar SEMPRE antes de escrever. Nunca inventar.
- Se um dado não puder ser confirmado, SINALIZAR como "não confirmado —
  requer revisão do Carlos", não alterar às cegas.
- Bilíngue: corrigir PT e EN juntos, mesmo conteúdo.
- NÃO tocar nos 5 retratos baianos (já validados). NÃO tocar em
  prices.json/pevs.json nem na lógica de cálculo. NÃO tocar em
  feature-flags/dark launch.
- Preservar estrutura e TODAS as entradas; alterar só valores/fontes com
  descompasso comprovado.

## Aceite (o relatório é o entregável mais importante)
- Relatar, em tabela, TUDO que foi auditado: para cada modelo de receita
  e cada retrato, dizer "confirmado" (com a fonte que confirma) OU
  "corrigido: antes → depois (fonte)" OU "não confirmado — requer
  revisão".
- Listar explicitamente quais dados estavam DESATUALIZADOS e foram
  trazidos para 2024/2025.
- tsc e lint limpos.
- Não commitar — Carlos revisa o relatório e mergeia.
