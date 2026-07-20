# Palmo — instruções para agentes (Claude Code)

## O que é a Palmo
Marketplace brasileiro que conecta donos de terra parada a produtores que
querem expandir. O produto é a CONEXÃO (anúncio verificado → conversa →
oferta → negócio fechado → contato revelado). A calculadora pública em
`/quanto-vale` é o gancho de aquisição, não o produto.

Monetização: gratuito até fechar negócio; taxa de sucesso na assinatura.
Por isso o **gate de contato é sagrado**: contatos só aparecem quando
`deal_status = 'closed'`, garantido no banco (RLS + função
`get_counterparty_contact`). Nenhuma mudança pode enfraquecer isso.

## Stack
- Next.js 16 (App Router, Turbopack) + TypeScript estrito
- Tailwind v4 (CSS-first, sem tailwind.config)
- Supabase (auth Google + Postgres com RLS) — schema em `supabase/`
- lucide-react para ícones; Nunito ExtraBold self-hosted
- App real vive em `app/app/*` atrás do flag `NEXT_PUBLIC_APP_ENABLED`
  (`lib/feature-flags.ts`); em produção fica desligado (dark launch)

## REGRAS DURAS (invioláveis)
1. **A branch `main` é INTOCÁVEL.** Nunca commitar nela, nunca fazer push
   para ela, nunca mergear nada nela, nunca `checkout`/`switch` para ela.
   Todo trabalho nasce em branch própria `palmo-ai/*` e chega ao Carlos
   como **Pull Request**. Quem revisa e mergeia é só ele.
2. **Fluxo de entrega (conduzido pela sessão principal, não pelos
   subagentes):** antes de qualquer edição, criar a branch do lote
   (`git checkout -b palmo-ai/<lote-ou-passo>`); ao final, `git add` +
   commit com mensagem ASCII clara + `git push -u origin <branch>` +
   `gh pr create --base main` com título e corpo contendo o relatório
   (arquivos alterados + testes manuais). Nunca `--force`, nunca merge,
   nunca `gh pr merge`. Subagentes individuais NÃO fazem git: só editam,
   validam e relatam.
3. **NUNCA adicionar atribuição de autoria** (Co-Authored-By, "Generated
   with", etc.) em commits, PRs, código ou comentários. Os commits saem
   com a identidade git local do Carlos, e é assim que devem ficar.
3b. **O dark launch é sagrado:** nunca alterar `lib/feature-flags.ts`,
   nunca definir/alterar `NEXT_PUBLIC_APP_ENABLED` em código, config ou
   Vercel. O app permanece atrás da barreira até o Carlos decidir.
4. **NUNCA tocar em**: `.env*`, `supabase/*.sql` (schema/policies),
   `lib/appraisal-data.ts`, `lib/prices.*`, `lib/pevs.*`,
   `lib/state-advantage.ts`, `lib/vtn.ts`, `scripts/*` — são camadas de
   dados oficiais calibradas manualmente. Se a tarefa parecer exigir isso,
   PARE e pergunte.
5. **NUNCA editar `lib/content.ts`.** Strings novas de UI vão no padrão
   `label` inline do componente (`const label = lang === "en" ? {...} : {...}`,
   via `useLanguage()`), como já fazem `Conversation.tsx` e
   `AccountDashboard.tsx`. Isso evita conflito entre agentes paralelos.
6. **NUNCA inventar números** (preços, faixas, estatísticas). Dados de
   exemplo/seed devem ser plausíveis e claramente marcados como demo.
7. Nada de APIs depreciadas (ex.: Next 16 usa `proxy`, não `middleware`).

## Padrões do projeto
- Telas do app seguem o trio: `page.tsx` (server) + componente client +
  `actions.ts` ("use server", falha graciosa `{ ok, error }`).
- Sempre bilíngue PT/EN via `useLanguage()`; PT é a língua principal.
- Mobile-first: 75% do tráfego é celular. Testar mentalmente em 390px.
- Reusar o que existe: dropdown UF→município (IBGE) do `ListingForm`,
  cards no estilo do hero, `getServerSupabase()` para actions.
- ESLint `react-hooks/set-state-in-effect`: derive estado ou envolva
  `setState` síncrono em `queueMicrotask` (padrão já usado no projeto).

## Validação antes de encerrar qualquer tarefa
```
npx tsc --noEmit
npm run lint
```
Ambos limpos. Depois, relatar: arquivos criados/alterados (caminhos
completos), o que testar manualmente (rota + passos + município de
exemplo), e pendências. **Não commitar, não pushar.**

## Paralelismo, branches e dependências
- **Lote A** (uma branch, um PR): a sessão principal cria
  `palmo-ai/lote-a` e dispara EM PARALELO `passo1-ponte-calculadora`,
  `passo2-home-painel`, `passo3-explorar-filtros` e `passo5-seed-demo`
  (arquivos disjuntos; regra 5 garante isso). Ao final: um commit, um
  push da branch, um PR com o relatório consolidado dos quatro.
- **Revisor de design** (`revisor-design`): roda SEQUENCIALMENTE depois
  dos quatro construtores do Lote A, na MESMA branch, ANTES do commit e
  do PR. Ele audita e corrige só estilo, nunca lógica.
- **Passo 4** (`passo4-confianca-verificado`): SÓ depois do PR do Lote A
  ser mergeado pelo Carlos. Nova branch `palmo-ai/passo4-confianca` a
  partir da `main` atualizada, novo PR — e o revisor-design roda de novo
  antes desse PR também.

## Sistema de design (fonte da verdade visual)
Todo pixel novo obedece a isto. Em dúvida, copie de `components/Hero.tsx`,
`app/app/mensagens/[id]/Conversation.tsx` ou `app/app/conta/AccountDashboard.tsx`.

**Cores** — só as do tema, nunca hex/cores novas:
`deep` (texto/escuro), `primary` (+`primary-dark`), `accent` (+`accent-dark`),
`neutral` (fundos suaves), `white`. Opacidades canônicas: `text-deep/70`
(corpo), `/60` (secundário), `/50` (apagado), `/40` (placeholder),
`border-deep/10` e `/5`, `bg-primary/10`, `bg-accent/20` e `/10`.

**Raios**: `rounded-full` = botões, pills e chips; `rounded-2xl` = cards e
containers; `rounded-xl` = notas, inputs e caixas internas. Nada além.

**Receitas canônicas (copiar literalmente):**
- Botão primário: `rounded-full bg-primary px-6 py-3.5 text-base font-bold
  text-white shadow-sm transition-colors hover:bg-primary-dark`
  (variação compacta: `px-4 py-2 text-sm`).
- Botão secundário: mesmo, com `bg-accent text-deep hover:bg-accent-dark`.
- Botão terciário/ghost: `rounded-full border border-deep/20 px-3 py-1
  text-xs font-bold text-deep`.
- Card: `rounded-2xl border border-deep/10 bg-white p-6 shadow-sm`
  (destaque: `shadow-xl border-deep/5`).
- Chip/selo: `rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold
  text-primary` (selo Verificado inclui `CheckCircle2 h-3.5 w-3.5`).
- Nota/caixa informativa: `rounded-xl bg-white px-4 py-2.5 text-sm
  text-deep/70` (variante destaque: `bg-accent/20 font-semibold text-deep`).
- Rótulo de seção: `text-sm font-bold uppercase tracking-wide text-primary`.
- Títulos: `font-extrabold text-deep` (+`tracking-tight` nos grandes).
- Inputs: reutilizar o `inputCls` compartilhado dos formulários existentes.

**Ícones**: lucide-react, `h-4 w-4` (inline) ou `h-5 w-5` (destaque),
sempre `aria-hidden="true"` quando decorativos. Emojis (🌱⏳🧮💰⚠️💡) só
no padrão já usado pela calculadora, nunca como ícone de botão.

**Layout**: shell `mx-auto max-w-6xl px-6` (páginas largas) ou `max-w-2xl`
(fluxos focados); espaçamentos em `gap-3`/`gap-4`, `p-4`/`p-6`; empilhar
tudo em 390px de largura sem scroll horizontal.

**Proibido**: cores fora do tema, sombras novas, fontes novas, gradientes,
dark mode, animações além de `transition-colors`/`hover:-translate-y-0.5`.

## Como testar localmente
`.env.local` precisa de `NEXT_PUBLIC_APP_ENABLED=true`. Rodar
`npm run dev` e navegar: `/app/explorar`, `/app/anunciar`, `/app/conta`,
`/app/mensagens`, `/app/imovel/[id]`. Build sujo: `rmdir /s /q .next`.
