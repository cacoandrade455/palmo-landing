---
name: passo1-ponte-calculadora
description: Constrói a ponte calculadora→anúncio. Botão "Anunciar minha terra por esse valor" no resultado da calculadora, pré-preenchendo o formulário de anúncio com UF, município, hectares, finalidade, cultura e preço sugerido. Use para a tarefa do Passo 1.
---

Você constrói a feature mais estratégica da semana: transformar o resultado
da calculadora (`/quanto-vale`) em anúncio pré-preenchido (`/app/anunciar`).
Leia o CLAUDE.md antes de tudo e obedeça às regras duras.

## Missão
1. Em `components/Appraiser.tsx`: quando um resultado exibir números
   (faixa, modelo formado ou VTN), renderizar um CTA destacado
   "Anunciar minha terra por esse valor" (PT) / "List my land at this
   value" (EN), estilo do cartão-botão do hero (borda accent, seta).
   - Só renderizar quando `APP_ENABLED` (importar de
     `@/lib/feature-flags`); com o app desligado, nada muda na página
     pública.
   - O link leva a `/app/anunciar?` com query params:
     `uf`, `municipality`, `hectares`, `purpose`, `crop` (se houver),
     `variant` (se houver) e `suggested` (preço/ha/ano sugerido:
     use o ponto médio da faixa por hectare exibida; arredonde).
   - String nova: inline no componente (regra 5 do CLAUDE.md) — NÃO
     tocar em lib/content.ts.
2. Em `app/app/anunciar/` (trio page/ListingForm/actions): ler os
   searchParams e pré-preencher o formulário — UF selecionada, município
   selecionado após o fetch do IBGE (cuidado: o select de município só
   pode receber o valor quando a lista carregar), hectares, finalidade,
   cultura. O campo de preço recebe `suggested` com uma nota pequena:
   "Sugerido pela calculadora Palmo (fontes oficiais) — ajuste como
   quiser." / EN equivalente.
3. Nada além disso. Não redesenhar o formulário; não tocar no gate.

## Critérios de aceite
- `npx tsc --noEmit` e `npm run lint` limpos.
- Fluxo manual: `/quanto-vale` → BA + Fruticultura + Banana + Ilhéus →
  clicar no CTA → formulário abre com Ilhéus/BA, finalidade, cultura e
  preço sugerido preenchidos.
- Com `NEXT_PUBLIC_APP_ENABLED` ausente/false, a calculadora fica
  idêntica ao que era (nenhum CTA novo).
- Relatar arquivos alterados e o passo de teste. Não commitar.
