---
name: passo10-recomendador
description: Constrói o Recomendador de Uso da Terra — inverte o fluxo da calculadora (terra → ranking de vocações), ranqueando culturas pela vantagem regional + faixa de renda + condição de água, usando SÓ dados que já existem. Nunca inventa recomendação.
---

Você constrói o Recomendador de Uso da Terra: a inversão da calculadora.
Hoje o usuário escolhe a cultura e vê o valor. Aqui ele informa a TERRA
e recebe um RANKING de vocações. Leia o CLAUDE.md (regras duras +
sistema de design). Regra de ouro herdada da calculadora: **recomendação
sem base regional não entra** — o mesmo rigor de "número sem fonte não
entra".

## Zonas de dados (SOMENTE LEITURA — nunca editar, igual à calculadora)
- `lib/state-advantage.ts`: `stateAdvantages` (Record por cultura, com
  `ufs: string[]` e `factPt`/`factEn`). É o sinal de "a região é forte
  nisso".
- `lib/appraisal-data.ts`: as funções de referência de renda por cultura
  formada (ex.: `formedCropLeaseRef`) e os modelos com `revMin`/`revMax`
  e `sourceNote`. É a faixa de R$/ha e a procedência.
- `lib/content.ts`: as listas de culturas por finalidade
  (`crops` agrupadas em graos/lavoura_permanente/fruticultura/etc.) e os
  labels — SOMENTE para ler os `value`/`label` e as glosas. NÃO editar
  (regra 5).
NÃO tocar em nenhum arquivo de dados; o recomendador só LÊ e combina.

## Missão
1. Criar `lib/land-recommender.ts` (arquivo NOVO, motor puro, sem UI):
   - Função `recommendUses({ uf, municipality, water, hectares })` que
     retorna uma lista ORDENADA de `{ cropValue, cropLabel, purpose,
     scoreReasonPt/En, revMin?, revMax?, sourceNote?, regionalFactPt/En? }`.
   - **Lógica de score (transparente, sem caixa-preta):**
     a) Para cada cultura conhecida, verificar em `stateAdvantages` se a
        `uf` está no `ufs[]` daquela cultura → se sim, é uma "vocação
        regional" (peso alto) e anexa o `factPt/En` como justificativa.
     b) Anexar a faixa de renda (revMin/revMax + sourceNote) quando o
        modelo existir em appraisal-data para aquela cultura/uf.
     c) **Filtro de água (decisivo):** classificar cada cultura como
        `needsIrrigation` (ex.: manga, melão, uva, mamão de mesa em
        região seca), `rainfed_ok` (cacau, café, banana em região úmida)
        ou `neutral` (pecuária, extrativismo, grãos de sequeiro). Se
        `water === false`, REMOVER do topo as que precisam de irrigação
        (ou rebaixá-las com aviso "requer irrigação"); se `water === true`,
        as irrigadas de alto valor sobem.
     d) Ordenar por: vocação regional presente > faixa de renda > demais.
   - **Trava anti-invenção:** se, para aquela `uf`, NENHUMA cultura tem
     vantagem regional na base, NÃO fabricar um ranking forçado.
     Retornar um resultado do tipo `{ weakSignal: true, known: [...as
     poucas com algum dado...] }` para a UI mostrar a mensagem honesta.
   - O motor é SÓ dados existentes: não hardcodar novas culturas, preços
     ou fatos que não venham das três fontes acima.
2. Criar a rota `app/recomendar/` (page + client), pública como a
   calculadora (fora do app gate, é topo de funil):
   - Formulário curtíssimo: UF → município (dropdown IBGE, reutilizar o
     padrão do ListingForm/explorar) → "Tem fonte de água? sim/não" →
     hectares (opcional).
   - Resultado: cards ranqueados (1º, 2º, 3º…), cada um com a cultura,
     a faixa de renda por hectare/ano quando houver, o FATO regional que
     justifica ("Sua região: [factPt]"), e a procedência (sourceNote).
     Números, R$, fontes e nomes de cultura seguem as MESMAS regras da
     calculadora (nada de traduzir/alterar valor ou fonte).
   - Caso `weakSignal`: mensagem honesta — "A vocação mais registrada da
     sua região é [X]. Para outras culturas, vale conversar com um
     agrônomo." Nunca empurrar cultura sem base.
   - Banner de honestidade no topo: "Sugestões baseadas na vocação
     registrada da região (fontes oficiais). A decisão final é sua e do
     seu agrônomo." (PT/EN inline, regra 5.)
   - CTA que conecta ao produto: em cada cultura recomendada, botão
     "Calcular o valor exato" que leva a `/quanto-vale` com uf/município/
     cultura/purpose já preenchidos (reusar os query params que a ponte
     da calculadora já entende), e — se APP_ENABLED — "Anunciar minha
     terra". O recomendador vira a porta de entrada do funil.
3. Ligações leves: um card/link "Descubra o melhor uso da sua terra" na
   home pública e perto do topo da `/quanto-vale` (o recomendador é o
   passo ANTES da calculadora para quem não sabe o que plantar).

## Escopo consciente (não exceder)
NÃO é um agrônomo de IA: nada de pH, altitude, microclima, análise de
solo. É um RANQUEADOR DE VOCAÇÃO REGIONAL, honesto sobre o que é. A UI
deve deixar isso claro. Não prometer produtividade nem sucesso; só
"culturas que a sua região comprovadamente faz, ordenadas por
potencial".

## Aceite
- tsc e lint limpos. Testes manuais (com município, sempre):
  - BA + Ilhéus + água=não → cacau/banana no topo com o fato do sul da
    BA; manga NÃO deve liderar (precisa irrigação).
  - BA + Jeremoabo (semiárido) + água=não → pecuária/extrativismo/
    sequeiro; fruticultura irrigada rebaixada ou com aviso.
  - BA + Jeremoabo + água=sim → manga/fruticultura sobem.
  - Um município de UF sem vantagem forte na base → cai no `weakSignal`
    com a mensagem honesta (NÃO um ranking inventado).
  - CTA "Calcular o valor exato" abre a calculadora pré-preenchida.
- Relatar arquivos e testes; não commitar (a sessão principal faz o
  branch/PR).
