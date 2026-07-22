---
name: fix-retrato-crash
description: Corrige o crash "Cannot access 'X' before initialization" no modo "Não sei / me recomende" (retrato regional).
---

Você conserta um crash de RUNTIME (não de compilação) introduzido pelo retrato regional. Leia o CLAUDE.md.

## Diagnóstico (confirmado por eliminação)
- Calcular uma CULTURA ESPECÍFICA funciona perfeitamente em produção.
- Escolher "Não sei / me recomende" e clicar Calcular quebra a página com "This page couldn't load".
- Console mostra: Uncaught ReferenceError: Cannot access 'c' before initialization / at Array.map
- Portanto o bug está SÓ no caminho do retrato: components/RegionalPortrait.tsx e/ou o ramo "me recomende" de components/Appraiser.tsx.
- "Cannot access X before initialization" = temporal dead zone: uma const/let usada ANTES de ser declarada. Causas típicas: (a) dentro de um .map() que referencia uma const definida depois; (b) referência circular entre dois const; (c) ordem de declaração trocada; (d) variável usada no inicializador de um useMemo/useState antes de existir.
- Passou no tsc/lint porque TDZ é erro de runtime, não de tipo.

## Missão
1. Em RegionalPortrait.tsx e no ramo "me recomende" de Appraiser.tsx, localizar todo .map() e toda referência às variáveis do retrato (retorno de retratoPorMunicipio, listas de regiões/vocações, o ranking) e achar a que é USADA ANTES DE SER DECLARADA. Corrigir a ORDEM (mover a const para antes do uso) ou desfazer a referência circular.
2. Blindar contra dado ausente: se o retrato ou qualquer campo (vocacoes, retratoPt, fonte) vier undefined/null, renderizar nada (ou só o ranking) SEM quebrar — guard clauses e optional chaining. O retrato é extra; jamais pode derrubar a calculadora.
3. Confirmar que a chamada à API do IBGE está em try/catch com timeout curto e que qualquer falha degrada para estático→bioma→sem-retrato, nunca lançando erro que suba para a página. Se o .map estiver iterando o retorno da API antes de checar se veio, esse é provavelmente o bug.
4. NÃO alterar o caminho da cultura específica (funciona). NÃO tocar em dados, feature-flags nem dark launch.

## Aceite
- tsc e lint limpos.
- Testar NO NAVEGADOR (obrigatório), rodando build de produção local (npm run build && npm start), não só dev:
  - "me recomende" + Mutuípe/BA + água=Não + Calcular → retrato do cacau acima do ranking, SEM erro. Idem Sorriso/MT, São Joaquim/SC, Granja/CE.
  - Município sem região curada → bioma ou nada, SEM erro.
  - Cultura específica (Café) continua normal.
  - Console com ZERO "Cannot access ... before initialization".
- Relatar qual era a variável e o arquivo, e parar (sem git).