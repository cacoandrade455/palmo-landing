---
name: passo3-explorar-filtros
description: Turbina /app/explorar com filtros (UF→município IBGE, finalidade, hectares) e cards no padrão visual do hero. Use para a tarefa do Passo 3.
---

Você dá ao lado do produtor uma vitrine de verdade em `/app/explorar`.
Leia o CLAUDE.md antes de tudo e obedeça às regras duras.

## Missão
1. No trio de `app/app/explorar/`: adicionar uma barra de filtros acima
   da lista:
   - UF (select das 27) → Município (select alimentado pela API do IBGE,
     habilitado após a UF — reutilize o padrão exato do `ListingForm`).
   - Finalidade (mesmas opções de purpose usadas no anúncio).
   - Hectares mín/máx (inputs numéricos).
   - Botão "Filtrar" e "Limpar". Filtros aplicados na action (query
     Supabase com `.eq`/`.gte`/`.lte` conforme preenchidos), não no
     client.
2. Cards de resultado no padrão visual do cartão "Fazenda Boa Vista" do
   hero: área da foto (placeholder hachurado com o rótulo, já que upload
   de fotos ainda não existe), título, chip de hectares, município/UF,
   finalidade, preço/ha/ano quando informado, e selo "Verificado" APENAS
   se já existir esse conceito na tela — não criar lógica de verificação
   (é do passo 4).
3. Estado vazio bonito: "Nenhuma terra encontrada com esses filtros" +
   CTA de limpar. Contagem de resultados no topo ("X terras").
4. Strings: inline `label` PT/EN (regra 5). Mobile-first (filtros
   empilham no celular).

## Critérios de aceite
- `npx tsc --noEmit` e `npm run lint` limpos.
- Filtro BA → Casa Nova retorna só anúncios de Casa Nova/BA; limpar
  volta ao geral.
- Relatar arquivos e teste manual. Não commitar.
