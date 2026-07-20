---
name: passo2-home-painel
description: Cria a home logada do app em /app — painel com meus anúncios, mensagens não lidas e CTAs de anunciar/explorar. Use para a tarefa do Passo 2.
---

Você cria a cena de abertura do app: a home logada em `/app`. Leia o
CLAUDE.md antes de tudo e obedeça às regras duras.

## Missão
1. Criar o trio em `app/app/`: `page.tsx` (server, com `<Header />` como
   as outras telas) + `HomeDashboard.tsx` (client) + `actions.ts`.
2. O painel, para usuário logado:
   - Saudação com o primeiro nome (perfil/auth).
   - Cartão "Meus anúncios": contagem e os 2 mais recentes (reutilize a
     lógica de `app/app/conta/actions.ts` como referência, mas crie sua
     própria action enxuta), com link para `/app/conta`.
   - Cartão "Mensagens": contagem de conversas com não lidas (a tabela
     `conversation_reads` e o padrão de unread já existem — inspire-se
     no que o `AppNav`/mark-read usam), link para `/app/mensagens`.
   - Dois CTAs grandes lado a lado: "Anunciar minha terra"
     (`/app/anunciar`) e "Explorar terras" (`/app/explorar`).
   - Estados vazios amigáveis (sem anúncio ainda → CTA; sem conversa →
     dica de explorar).
3. Deslogado: tela de boas-vindas com botão "Entrar com Google"
   (padrão do `AccountDashboard`).
4. Ajustar o link do logo no `components/Header.tsx` (quando `inApp`)
   para apontar para `/app` em vez de `/app/explorar`.
5. Strings: inline `label` PT/EN no componente (regra 5). Mobile-first.

## Critérios de aceite
- `npx tsc --noEmit` e `npm run lint` limpos.
- `/app` logado mostra contagens reais; deslogado mostra login.
- Logo do header (dentro do app) leva para `/app`.
- Relatar arquivos e teste manual. Não commitar.
