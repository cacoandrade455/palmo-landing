# Contratos padrão Palmo — pacote v0.1 (MINUTAS)

> ⚠️ **MINUTAS DE TRABALHO.** Redigidas para estruturar o produto.
> **Revisão obrigatória por advogado(a) agrarista (OAB) antes de qualquer
> uso real.** O Estatuto da Terra (Lei 4.504/64) e o Decreto 59.566/66
> contêm normas cogentes que prevalecem sobre qualquer cláusula.

## Arquivos
- `arrendamento-padrao.md` — aluguel da terra por preço certo (fixo)
- `parceria-padrao.md` — partilha percentual de frutos/resultados
- `clausula-icc-internacional.md` — módulo de arbitragem ICC (só para
  contratos internacionais de grande porte)

## Política de foro (decisão de produto)
- **Contratos domésticos:** foro da **comarca de situação do imóvel**
  (regra natural das ações sobre imóvel, CPC art. 47) — acessível às
  duas partes.
- **Contratos internacionais de grande porte** (limiar sugerido:
  valor total do contrato ≥ `{{LIMIAR_ICC}}` — definir com o jurídico;
  ponto de partida: R$ 5.000.000): arbitragem **ICC**, sede e idioma
  definidos no módulo próprio. Lei aplicável ao imóvel: sempre a
  brasileira (norma de ordem pública para direitos reais no Brasil).

## Sistema de placeholders (auto-preenchimento)
Todo campo `{{ASSIM}}` mapeia 1:1 para dados que a plataforma já tem:

| Placeholder | Origem no banco |
|---|---|
| `{{PROPRIETARIO_*}}` / `{{PRODUTOR_*}}` | `profiles` (nome, CPF/CNPJ, endereço) |
| `{{IMOVEL_*}}` | `listings` (título, município/UF, hectares, CAR, matrícula*) |
| `{{FINALIDADE}}`, `{{CULTURA}}`, `{{VARIEDADE}}` | `listings` + oferta |
| `{{PRECO_*}}`, `{{PERCENTUAL_*}}`, `{{PRAZO_ANOS}}`, `{{INICIO}}` | `offers` aceita |
| `{{DATA}}`, `{{COMARCA}}` | derivados |

\* matrícula ainda não é campo do anúncio — entra no Lote B.

## Mecanismo de negociação (para o Lote B dos agentes)
1. Oferta aceita → gera **minuta v1** auto-preenchida.
2. Cláusulas renderizadas em **blocos**; cada parte pode comentar e
   propor alteração por bloco; a outra aceita/contrapropõe; a minuta
   **versiona** (v2, v3…) com histórico visível = "pactuação clara".
3. Duplo "Aprovar minuta" → congela texto → PDF → **assinatura
   eletrônica** (Lei 14.063/2020; integração Clicksign/ZapSign na v1)
   com **2 testemunhas** (título executivo extrajudicial, CPC 784, III).
4. Pós-assinatura: orientar registro no CRI (eficácia contra terceiros)
   e agendar o **laudo de vistoria de entrada** (núcleo anti-uso
   predatório — FAEB).

## Travas legais embutidas nas minutas (não remover)
- **Prazos mínimos** (Dec. 59.566/66, art. 13): 3 anos (lavoura
  temporária/pecuária de pequeno-médio porte), 5 (lavoura permanente/
  pecuária de grande porte), 7 (florestal). A UI valida antes de gerar.
- **Teto de preço do arrendamento** (Estatuto, art. 95, XII): flag de
  conformidade a validar com o jurídico.
- **Quotas máximas do proprietário na parceria** (Estatuto, art. 96,
  VI): 20% a 75% conforme o que ele fornece. A UI valida o percentual.
- **Direito de preferência** do arrendatário na venda (art. 92) e
  regras de renovação/notificação (aviso com 6 meses).
