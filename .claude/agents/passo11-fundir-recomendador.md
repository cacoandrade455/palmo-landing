---
name: passo11-fundir-recomendador
description: Funde o recomendador de uso da terra dentro da calculadora /quanto-vale (uma ferramenta só) e corrige a ordenação do ranking para maior retorno primeiro. Ajuste sobre o passo10.
---

Você funde o recomendador na calculadora e corrige a ordem do ranking.
Leia o CLAUDE.md (regras duras + sistema de design). O motor
`lib/land-recommender.ts` e a rota `/recomendar` já existem (passo10);
os dados continuam SOMENTE LEITURA (state-advantage, appraisal-data,
content).

## Correção 1 — Ordenação por maior retorno (renda decrescente)
No `lib/land-recommender.ts`, a ordenação final do ranking deve ser:
1. **Chave primária: `revMax` decrescente** (a cultura com maior teto de
   renda por hectare/ano no topo). Empate → `revMin` decrescente.
2. Culturas SEM faixa de renda modelada (sem revMin/revMax) vão para o
   FIM da lista, em ordem alfabética entre si (não têm retorno para
   comparar).
3. A vocação regional **deixa de mudar a ORDEM** — vira apenas um selo
   de destaque no card (ver Correção 3). O ranking é por retorno.
4. Manter a trava anti-invenção e o filtro de água exatamente como estão
   (água só REMOVE/rebaixa o inviável; não altera a regra de ordenação
   entre os viáveis).

## Correção 2 — Fundir na calculadora /quanto-vale (uma ferramenta só)
O recomendador deixa de ser página isolada e passa a viver DENTRO do
fluxo da calculadora (`components/Appraiser.tsx` + a página
`/quanto-vale`). Desenho:
- A calculadora ganha DOIS modos no mesmo lugar:
  - **"Não sei o que plantar"** (modo descoberta): usuário informa UF,
    município e água → aparece o RANKING de vocações (os cards que o
    recomendador já renderiza), ordenado por retorno.
  - **"Já sei a cultura"** (modo cálculo): o fluxo atual da calculadora,
    escolhendo a cultura e vendo o valor exato.
- Transição natural: cada card do ranking tem o botão "Calcular o valor
  exato" que já leva ao modo cálculo pré-preenchido (a ponte de query
  params já existe — reutilizar).
- Implementação: pode ser um seletor/aba no topo da calculadora, ou o
  ranking aparecendo automaticamente assim que município+água são
  preenchidos e ainda não se escolheu cultura. Escolha o que ficar mais
  limpo no padrão visual atual, mobile-first.
- A rota `/recomendar` deve REDIRECIONAR para `/quanto-vale` (ou montar
  a calculadora já no modo descoberta) para não haver duas ferramentas.
  Não deletar dados; só unificar a experiência.

## Correção 3 — Selo de vocação regional (já que não ordena mais)
No card do ranking, quando a cultura tem vantagem regional para a UF,
mostrar um selo/badge discreto "★ Forte na sua região" (receita canônica
de chip), além do fato regional que já aparece. Assim o dono vê a
cultura mais rentável primeiro E identifica de relance as que a região
domina.

## Regras que continuam valendo
- Números, R$, unidades, fontes e nomes de cultura: NUNCA alterar
  (regras da calculadora). Strings novas inline PT/EN (regra 5).
- Não tocar em zonas de dados nem em feature-flags/dark launch.

## Aceite
- tsc e lint limpos. Testes (com município):
  - O ranking sai em ordem de `revMax` decrescente (a cultura de maior
    teto no topo; as sem faixa, no fim).
  - `/quanto-vale` oferece descoberta (ranking) e cálculo (valor exato)
    na MESMA ferramenta; `/recomendar` não é mais uma página paralela.
  - Card de cultura com vantagem regional mostra o selo "Forte na sua
    região" sem alterar a posição no ranking.
  - "Calcular o valor exato" continua abrindo o modo cálculo
    pré-preenchido.
- Relatar arquivos e testes; não commitar.
