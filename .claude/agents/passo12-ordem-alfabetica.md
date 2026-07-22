---
name: passo12-ordem-alfabetica
description: Ordena alfabeticamente todos os dropdowns de seleção da calculadora e do formulário — finalidades e culturas — pelo texto exibido, sem alterar values nem lógica. Roda depois do passo11.
---

Você ordena alfabeticamente os dropdowns de seleção. Leia o CLAUDE.md.
Isto é puramente ORDEM DE EXIBIÇÃO — não é o ranking de recomendação
(esse é por retorno, não mexer). Regra 5 e zonas de dados valem.

## O que ordenar (ordem alfabética pt-BR, crescente)
1. **Dropdown de finalidade/uso** (`purposeOptions` em content.ts):
   Grãos, Cana, Lavoura permanente, Fruticultura, Pecuária... → exibir
   em ordem alfabética pelo label. EXCEÇÃO: se existir uma opção
   "Outro"/"Outra", ela vai SEMPRE por último, fora da ordem alfabética
   (convenção de UX).
2. **Listas de cultura dentro de cada finalidade** (`crops` por
   finalidade em content.ts): cada grupo (grãos, permanentes, frutas,
   etc.) exibido em ordem alfabética pelo label, independentemente.
3. **Sub-variedades** (`cropVariants`: café arábica/conilon, uva de
   mesa/vinho, banana prata/nanica/da terra): também alfabéticas.

## Como implementar (crítico — não quebrar nada)
- **NÃO reordenar os arrays de dados no content.ts editando-os à mão**
  (regra 5 proíbe editar content.ts, e reordenar manualmente é
  frágil). Em vez disso, ordenar **no ponto de renderização**: onde o
  componente monta as `<option>` (ou o dropdown customizado), aplicar
  uma ordenação da cópia da lista antes de exibir. Ex.:
  `[...options].sort((a,b) => a.label.localeCompare(b.label, "pt-BR"))`,
  com o "Outro" tratado à parte para ir ao fim.
- Se já existe um helper de render de dropdown compartilhado, centralizar
  a ordenação nele; senão, aplicar em cada dropdown (finalidade,
  cultura, variedade) na calculadora E no ListingForm de anunciar (os
  dois usam as mesmas listas).
- **NUNCA alterar o `value`** de nenhuma opção — só a ordem em que os
  labels aparecem. O `value` continua ligado ao motor de preços,
  vantagens e modelos exatamente como está.
- `localeCompare(…, "pt-BR")` é obrigatório para acentos e cedilha
  ordenarem certo (Açaí, Café, Cacau, Cana na ordem correta).

## Onde aplicar
Calculadora (`components/Appraiser.tsx` e afins) e formulário de anúncio
(`app/app/anunciar/ListingForm.tsx`) — todo dropdown que liste
finalidade, cultura ou variedade. Se o recomendador (pós-passo11) também
listar culturas num dropdown, incluir.

## Aceite
- tsc e lint limpos. O dropdown de finalidade aparece em ordem
  alfabética com "Outro" por último; dentro de cada finalidade as
  culturas estão alfabéticas; variedades idem. Nenhum value mudou (o
  cálculo de qualquer cultura continua idêntico ao anterior). Testar na
  calculadora e no formulário de anunciar. Relatar e parar (sem git).
