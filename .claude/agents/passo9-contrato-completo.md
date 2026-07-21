---
name: passo9-contrato-completo
description: Adiciona a visão "Ver contrato completo" — os blocos da versão atual concatenados num documento contínuo de leitura, sem controles de edição, com botão de imprimir. Micro-lote.
---

Você adiciona a leitura contínua do contrato. Leia o CLAUDE.md (regras
duras + sistema de design). Trabalho pequeno e cirúrgico: NÃO alterar a
lógica de versionamento, aprovação, travas ou o banco. Só uma tela nova
de LEITURA que reusa dados que já existem.

## Missão
1. Na Sala do Contrato (`app/app/contrato/[id]/ContractRoom.tsx`),
   adicionar um botão "Ver contrato completo" (receita canônica de
   botão secundário), perto do topo/cabeçalho da minuta.
2. Criar a rota `app/app/contrato/[id]/completo/` (page + client, ou um
   modal na própria sala — o que for mais limpo no padrão atual):
   - Renderiza os blocos da VERSÃO ATUAL (`current_version`) do
     contrato, em ordem, como um documento contínuo: título de cada
     cláusula (numerado, ex.: "1. Partes", "2. Objeto"…) seguido do
     corpo do bloco em prosa. Placeholders ainda não preenchidos
     permanecem como {{CAMPO}} visíveis (é uma minuta).
   - Cabeçalho do documento: tipo do contrato (Arrendamento/Parceria),
     imóvel (título · município/UF · hectares), partes (proprietário e
     produtor), e o número da versão.
   - Banner no topo: "Minuta sujeita a revisão jurídica" (mesma copy da
     sala, PT/EN inline).
   - SEM nenhum controle de edição, comentário, proposta, input de
     placeholder ou aprovação — esta tela é somente leitura.
   - Botão "Imprimir" que chama `window.print()`; incluir um bloco de
     `@media print` simples (esconder header/nav do app, o próprio
     botão e qualquer cromo — só o documento sai no papel/PDF do
     navegador). É assim que o usuário "baixa" o contrato na v1.
   - "Voltar à sala" retorna ao `/app/contrato/[id]`.
3. Reuso obrigatório: pegar os blocos da mesma fonte que a sala usa
   (a versão atual em `contract_versions.blocks`) via uma action de
   leitura; NÃO reconstruir o texto de outro jeito, para nunca divergir
   do que foi negociado. `blocksFor`/`fillBlocks` de
   `lib/contract-templates.ts` são SOMENTE LEITURA.
4. Strings inline PT/EN (regra 5). Mobile-first; no print, largura de
   documento legível.

## Fronteiras
Dono apenas de: a rota `completo/` nova e um botão + (se necessário)
uma action de leitura em `app/app/contrato/[id]/actions.ts`. Não tocar
em mais nada do Lote B, nem em schema/dados.

## Aceite
- tsc e lint limpos. Abrir uma minuta existente → "Ver contrato
  completo" mostra todas as cláusulas em sequência, numeradas, com as
  partes e o imóvel no topo e o banner de revisão. "Imprimir" gera um
  PDF do navegador só com o documento. Relatar e parar (sem git).
