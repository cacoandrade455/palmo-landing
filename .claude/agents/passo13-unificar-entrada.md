---
name: passo13-unificar-entrada
description: Remove o card de entrada duplicado do recomendador (uma ferramenta só) e renomeia "outros usos na região" para "melhores usos", com o porquê de cada um. Ajuste sobre o passo11.
---

Você elimina a última duplicação da fusão calculadora+recomendador e
melhora o bloco de usos alternativos. Leia o CLAUDE.md. Dados SOMENTE
LEITURA; regra 5 (strings inline PT/EN); dark launch intocável.

## Ajuste 1 — Um único ponto de entrada
Hoje existem DOIS cards de entrada (ex.: "Quanto vale minha terra?" e
"Descubra o melhor uso da sua terra"), resquício de quando eram duas
ferramentas. Agora é UMA ferramenta só (a calculadora com as abas "Não
sei o que plantar" / "Já sei a cultura").
- **Remover** o card "Descubra o melhor uso da sua terra" (e qualquer
  CTA/link separado que leve a uma ferramenta de recomendação isolada),
  onde quer que apareça: home pública, topo da /quanto-vale, etc.
- **Manter apenas** o card "Quanto vale minha terra?" como único ponto
  de entrada. A descoberta do melhor uso já está DENTRO dele (aba). Não
  precisa mudar o texto desse card.
- Garantir que não sobra nenhuma referência visual sugerindo duas
  ferramentas distintas.

## Ajuste 2 — "Melhores usos", com o porquê
No resultado do modo "Já sei a cultura" (quando o usuário calcula uma
cultura específica), existe hoje um bloco intitulado "OUTROS USOS NA SUA
REGIÃO" que lista culturas ordenadas por retorno com um insight de
comparação. O nome não bate com a função (já mostra os MELHORES, não
"outros").
- Renomear o título para **"MELHORES USOS PARA SUA TERRA"** (PT) /
  "BEST USES FOR YOUR LAND" (EN).
- Para cada linha da lista, além da faixa de renda, adicionar o
  **porquê** — a justificativa regional que já existe no motor do
  recomendador (o `factPt/En` de state-advantage, ou a `sourceNote`).
  Uma linha curta por uso: ex. "Grãos — R$800–R$2.000/ha/ano · MT, PR,
  RS e GO lideram (CONAB)". Reusar EXATAMENTE os fatos/fontes do motor
  `lib/land-recommender.ts`; não inventar justificativa.
- Manter o selo "sua escolha" na cultura que o usuário calculou e o
  insight de comparação ("na sua região, X arrenda por até N× o valor
  da sua escolha") — só corrigir o título e enriquecer com o porquê.
- Ordenação continua por retorno (revMax decrescente), como no passo11.

## Regras
- Números, R$, unidades, fontes, nomes de cultura: NUNCA alterar.
- Não tocar em zonas de dados nem em feature-flags.

## Aceite
- tsc e lint limpos. Na home/entrada há UM só card da ferramenta (o de
  valor); o card separado de "melhor uso" sumiu. No resultado de uma
  cultura, o bloco se chama "Melhores usos para sua terra" e cada linha
  mostra a faixa E o porquê (fato/fonte regional do motor). Ordem por
  retorno mantida. Testar com um município (ex.: Anori/AM e um de UF
  forte). Relatar e parar (sem git).
