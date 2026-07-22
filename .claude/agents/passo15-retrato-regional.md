---
name: passo15-retrato-regional
description: Pluga o retrato estratégico regional no modo "Não sei/me recomende" da calculadora. Resolve município→região via API do IBGE (primária) com fallback na tabela estática, e exibe o retrato acima do ranking de culturas.
---

Você conecta o retrato estratégico regional à calculadora. Leia o
CLAUDE.md. O motor de dados já existe e é SOMENTE LEITURA:
`lib/regioes-agricolas.ts` (retratos curados REGIOES, BIOMA_FALLBACK,
MUNI_TO_REGIAO, e a função `retratoPorMunicipio(nomeUf, biomaHint)`).
Fonte humana: docs/regioes/vocacoes-microrregionais.md. NÃO editar esses
arquivos de dados nem os de preço/vantagem.

## Arquitetura de resolução município→região (decisão do Carlos)
1. **Primária — API do IBGE em tempo real:** quando o usuário escolhe o
   município no modo "me recomende", buscar a mesorregião dele na API do
   IBGE (endpoint de municípios/localidades — o mesmo domínio
   servicodados.ibge.gov.br já usado no dropdown). Com a mesorregião (ou
   direto pelo código IBGE do município), tentar casar com uma região
   curada.
2. **Fallback — tabela estática:** se a API falhar (timeout/erro/offline),
   usar `retratoPorMunicipio("NOME/UF")` que consulta o MUNI_TO_REGIAO
   estático. Nunca quebrar por causa da API: sempre degrada para o
   estático e, se nada casar, para o retrato de bioma; se nem isso, o
   modo "me recomende" segue funcionando sem o retrato (só o ranking).
3. A associação mesorregião→região curada pode ser feita por um pequeno
   mapa auxiliar no componente (mesorregiaoId ou nome → key de REGIOES),
   OU resolvida pelo nome do município via MUNI_TO_REGIAO. Escolha o
   caminho mais robusto; o importante é: API primeiro, estático depois,
   bioma por último, e nunca travar.

## UI — o retrato acima do ranking
No resultado do modo "Não sei / me recomende" (a rota/calculadora já
existe pós-passo14), ANTES da lista "Melhores usos para sua terra",
renderizar um bloco de retrato:
- Um card destacado (receita canônica) com: o nome da região
  (`retrato.nome`), o texto do retrato (`retratoPt`/`retratoEn` conforme
  idioma), e a fonte em letra miúda (`retrato.fonte`).
- Ícone/tom de "consultor regional", discreto, no padrão visual atual.
- Logo abaixo, o ranking de culturas que já existe (não mexer na lógica
  do ranking, só posicioná-lo depois do retrato).
- Se `retratoPorMunicipio` devolver null (sem região e sem bioma), não
  renderizar o card — mostrar só o ranking, como hoje.
- Ressalva já embutida no fim do bloco de recomendações ("vocação
  registrada; a decisão final é sua e do seu agrônomo") permanece.

## Regras
- Números, R$, fontes e nomes no retrato vêm PRONTOS do dado — nunca
  reescrever, traduzir valores ou inventar. Só exibir.
- Bilíngue: usar retratoPt/retratoEn conforme o idioma (o dado já traz os
  dois). Strings de UI próprias (rótulos) inline PT/EN (regra 5).
- Não tocar em feature-flags/dark launch nem nas zonas de dados.
- A chamada à API do IBGE deve ter timeout curto e try/catch — se
  demorar, cai no fallback sem travar a tela.

## Aceite
- tsc e lint limpos. Testes no modo "me recomende" (com município):
  - Mutuípe/BA → retrato "Sul Baiano / Recôncavo" (cacau-cabruca) acima
    do ranking.
  - Sorriso/MT → retrato "Médio-Norte de Mato Grosso" (grãos, maior
    produtor do Brasil).
  - São Joaquim/SC → retrato "Planalto Serrano" (maçã de altitude).
  - Um município sem região curada mas em bioma conhecido → retrato de
    bioma (ex.: Caatinga) — honesto, mais geral.
  - Simular API do IBGE indisponível → o retrato ainda aparece via
    fallback estático (para os municípios-âncora) e a tela não quebra.
- Relatar arquivos e testes; não commitar.
