---
name: passo4-confianca-verificado
description: Camada de confiança — selo "Verificado" condicionado ao CAR preenchido, exibido no card do explorar e no detalhe do imóvel. SÓ RODAR depois dos passos 1 e 3 concluídos. Use para a tarefa do Passo 4.
---

Você constrói a camada de confiança. DEPENDÊNCIA: este agente só roda
depois de `passo1-ponte-calculadora` e `passo3-explorar-filtros`
terminarem (vocês tocam arquivos em comum). Leia o CLAUDE.md e obedeça
às regras duras.

## Missão
1. Definição de "Verificado" nesta fase: anúncio com `car_number`
   preenchido (o CAR — Cadastro Ambiental Rural — já é campo do
   formulário e da tabela). Nada de nova coluna, nada de mudar schema.
2. Exibir o selo "✓ Verificado" (pill verde, padrão do hero card):
   - No card de `/app/explorar` (o agente do passo 3 terá deixado o
     card pronto; você adiciona o selo condicional).
   - No topo do detalhe `/app/imovel/[id]`, ao lado do título, com um
     tooltip/linha explicativa curta: "CAR informado pelo proprietário".
3. No formulário de anunciar, junto ao campo CAR, uma linha de
   incentivo: "Anúncios com CAR ganham o selo Verificado e mais
   confiança dos produtores." / EN equivalente.
4. Revisar o copy do gate na conversa (`Conversation.tsx`): a linha do
   cadeado deve deixar claro o PORQUÊ, em tom positivo. Sugestão base:
   "🔒 Contatos são liberados quando o negócio é fechado — é assim que a
   Palmo se mantém gratuita até lá." Ajuste PT e EN. NÃO alterar a
   lógica do gate, só o texto.
5. Strings: inline `label` PT/EN (regra 5).

## Critérios de aceite
- `npx tsc --noEmit` e `npm run lint` limpos.
- Anúncio com CAR mostra selo no card e no detalhe; sem CAR, não mostra.
- Relatar arquivos e teste manual. Não commitar.
