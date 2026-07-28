-- ═══════════════ PALMO · MIGRATION: ACEITES LEGAIS (jul/2026) ═══════════════
-- Rodar UMA vez no Supabase → SQL Editor → New query → Run.
-- (Escrita pelo lote palmo-ai/home-e-marketplace; NÃO foi aplicada no banco.)
--
-- OBJETIVO: guardar a PROVA dos aceites, em CAMADAS, no momento em que cada
-- regra passa a valer para o usuário:
--   'termos' + 'privacidade' → cadastro / primeiro acesso (sem contexto)
--   'anuncio'      → ao publicar um anúncio (proprietário) · contexto: listing
--   'proposta'     → ao enviar proposta formal (produtor)  · contexto: negócio
--   'taxa_sucesso' → no fechamento (proprietário, parte pagante) · negócio
--
-- ENQUANTO ESTA MIGRATION NÃO FOR APLICADA:
--   O app detecta a ausência da tabela e NÃO exibe o gate de aceite (fail
--   open). A alternativa — tratar "tabela ausente" como "não aceitou" —
--   trancaria todo mundo para fora do app sem nenhuma forma de aceitar,
--   porque o INSERT do aceite também falharia. Aplicada a migration, o gate
--   passa a valer sozinho, sem deploy.

begin;

create table if not exists public.legal_acceptances (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  -- lib/legal.ts → LEGAL_DOCS
  documento   text not null check (
    documento in ('termos','privacidade','anuncio','proposta','taxa_sucesso')
  ),
  -- versão aceita (lib/legal.ts → LEGAL_VERSION). Subir a versão faz o app
  -- pedir novo aceite, sem apagar o histórico do aceite anterior.
  versao      text not null,
  aceito_em   timestamptz not null default now(),
  -- Prova do aceite. Declarados na Política de Privacidade, seção 2.
  -- `text` (e não `inet`) porque o IP chega de um header de proxy que pode
  -- vir malformado: guardar o que veio é melhor do que quebrar o aceite.
  ip          text,
  user_agent  text,
  -- CONTEXTO do aceite — no máximo um dos dois é preenchido:
  --   listing_id      → aceite feito ao publicar aquele anúncio
  --   conversation_id → aceite feito dentro daquele negócio
  -- Os documentos gerais (termos/privacidade) não têm contexto.
  listing_id      uuid references public.listings (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete cascade,
  constraint legal_acceptances_um_contexto
    check (listing_id is null or conversation_id is null)
);

-- Um aceite por (usuário, documento, versão) para os documentos gerais...
create unique index if not exists legal_acceptances_doc_uniq
  on public.legal_acceptances (user_id, documento, versao)
  where listing_id is null and conversation_id is null;

-- ...um por anúncio...
create unique index if not exists legal_acceptances_listing_uniq
  on public.legal_acceptances (user_id, documento, versao, listing_id)
  where listing_id is not null;

-- ...e um por negócio. Índices parciais em vez de `unique nulls not
-- distinct` para funcionar em qualquer versão do Postgres.
create unique index if not exists legal_acceptances_deal_uniq
  on public.legal_acceptances (user_id, documento, versao, conversation_id)
  where conversation_id is not null;

create index if not exists legal_acceptances_user_idx
  on public.legal_acceptances (user_id);

alter table public.legal_acceptances enable row level security;

-- RLS: cada um só enxerga e cria os PRÓPRIOS aceites.
drop policy if exists legal_acceptances_select on public.legal_acceptances;
drop policy if exists legal_acceptances_insert on public.legal_acceptances;

create policy legal_acceptances_select on public.legal_acceptances
  for select to authenticated
  using (user_id = auth.uid());

create policy legal_acceptances_insert on public.legal_acceptances
  for insert to authenticated
  with check (user_id = auth.uid());

-- SEM policy de UPDATE e SEM policy de DELETE: o registro é imutável e não
-- pode ser apagado pelo cliente — é prova. O apagamento acontece só em
-- cascata, quando o próprio perfil é excluído.

commit;
