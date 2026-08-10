-- ═══════ PALMO · RECONSTRUCAO DOCUMENTAL: conversation_reads (ago/2026) ═══════
-- Lote `palmo-ai/divida-tecnica` (Parte C.2).
--
-- ⚠️  NAO E PARA APLICAR AGORA. Os tres objetos abaixo JA EXISTEM em
--     producao: foram criados a mao no SQL Editor numa sessao antiga e nunca
--     entraram em nenhum .sql do repo. Este arquivo fecha a deriva de schema
--     (se o banco for recriado a partir do repo, o inbox deixaria de
--     quebrar), e por isso e uma RECONSTRUCAO DOCUMENTAL: escrita a partir
--     do CODIGO QUE CONSOME os objetos, nao extraida do banco (esta sessao
--     nao tem acesso ao banco).
--
-- ⚠️  ATENCAO ESPECIAL: os `create or replace function` abaixo SOBRESCREVEM
--     as definicoes de producao se forem rodados. So rodar em banco NOVO
--     (recriacao a partir do repo) ou depois de conferir no BLOCO 0 que a
--     reconstrucao bate com o que esta la — e, se divergir, quem manda e o
--     banco: me avise e eu ajusto ESTE arquivo, nunca o contrario.
--
-- ── O QUE E FATO MEDIDO vs O QUE E INFERENCIA ───────────────────────────────
-- FATOS (medidos em producao em 29/07/2026, registrados na migration
-- 20260730-imutabilidade-por-privilegio.sql, linhas 44-76):
--   • a tabela public.conversation_reads existe (e onde o "lido" persiste;
--     conversations nao tem coluna de leitura);
--   • as funcoes mark_conversation_read e unread_conversation_count existem
--     e sao SECURITY DEFINER;
--   • o parametro da primeira chama-se `conv_id` (o codigo passa
--     `{ conv_id }` por nome: app/app/mensagens/[id]/actions.ts:284-288);
--   • a segunda e chamada SEM argumentos e devolve um escalar numerico
--     (app/app/mensagens/actions.ts:54-60 exige typeof data === "number";
--     app/app/actions.ts:58 idem).
-- INFERENCIAS (necessidade funcional; nomes de coluna nao aparecem em
-- nenhum codigo do repo porque todo acesso passa pelas duas funcoes):
--   • colunas (conversation_id, user_id, last_read_at) com PK composta;
--   • semantica do contador: conversas do usuario com mensagem DE OUTREM
--     mais nova que o last_read dele (HomeDashboard rotula "n nao lidas"
--     contando CONVERSAS; mensagem propria nao pode contar; conversa sem
--     linha de leitura conta se tiver qualquer mensagem alheia).

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 0 — AS CONSULTAS DE CONFERENCIA (rodar em PRODUCAO e comparar)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 0.a) Colunas reais da tabela:
--
--   select column_name, data_type, is_nullable
--   from information_schema.columns
--   where table_schema='public' and table_name='conversation_reads'
--   order by ordinal_position;
--   -- esperado (reconstrucao):
--   --   conversation_id | uuid                     | NO
--   --   user_id         | uuid                     | NO
--   --   last_read_at    | timestamp with time zone | NO
--   -- Divergencias plausiveis e inofensivas: nome `read_at` em vez de
--   -- `last_read_at`; uma coluna extra `created_at`. Se divergir, reportar
--   -- a saida real que eu ajusto este arquivo.
--
-- 0.b) Definicao real das funcoes (comparar SEMANTICA, nao texto literal):
--
--   select p.proname, pg_get_functiondef(p.oid)
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname='public'
--     and p.proname in ('mark_conversation_read','unread_conversation_count');
--   -- esperado: mark_conversation_read(conv_id uuid) SECURITY DEFINER que
--   --   (1) confere que auth.uid() participa da conversa e (2) faz upsert
--   --   do carimbo de leitura; unread_conversation_count() SECURITY DEFINER
--   --   devolvendo int com a contagem de conversas com nao lidas.
--
-- 0.c) RLS e privilegios da tabela (a reconstrucao assume o padrao da casa:
--      RLS ligada sem policy nenhuma + revoke, porque todo acesso e via
--      SECURITY DEFINER; conferir o estado real):
--
--   select relrowsecurity from pg_class
--   where oid = 'public.conversation_reads'::regclass;
--   select grantee, privilege_type from information_schema.role_table_grants
--   where table_schema='public' and table_name='conversation_reads'
--     and grantee in ('anon','authenticated');
--   -- Se houver grants/policies em producao, reportar: o arquivo passa a
--   -- documentar o que existe, nao o ideal.

-- ═══════════════════════════════════════════════════════════════════════════
-- OS OBJETOS (reconstrucao; rodar apenas em banco novo — ver cabecalho)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.conversation_reads (
  -- O carimbo "li ate aqui" de UM usuario em UMA conversa.
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- Padrao da casa: RLS ligada e NENHUMA policy + revoke = cliente nao toca a
-- tabela diretamente em hipotese alguma; o unico caminho sao as duas funcoes
-- SECURITY DEFINER abaixo, que validam participacao por conta propria.
alter table public.conversation_reads enable row level security;
revoke all on public.conversation_reads from anon, authenticated;

-- Marca a conversa como lida ATE AGORA para o usuario logado. Chamada ao
-- abrir a conversa (app/app/mensagens/[id]/Conversation.tsx:53-60), que em
-- seguida dispara o evento que faz o Header rebuscar o contador.
create or replace function public.mark_conversation_read(conv_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    return;
  end if;
  -- SECURITY DEFINER ignora RLS, entao a validacao de participacao e daqui:
  -- so participante carimba leitura na conversa.
  if not exists (
    select 1 from conversations c
    where c.id = conv_id and (c.owner_id = me or c.developer_id = me)
  ) then
    return;
  end if;
  insert into conversation_reads (conversation_id, user_id, last_read_at)
  values (conv_id, me, now())
  on conflict (conversation_id, user_id)
    do update set last_read_at = now();
end;
$$;

-- Quantas CONVERSAS (nao mensagens) do usuario logado tem pelo menos uma
-- mensagem da contraparte mais nova que o last_read dele. Conversa sem
-- carimbo conta como nao lida se tiver qualquer mensagem alheia (coalesce
-- para -infinity): o par (conversa, usuario) so nasce no primeiro mark.
create or replace function public.unread_conversation_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from conversations c
  where (c.owner_id = auth.uid() or c.developer_id = auth.uid())
    and exists (
      select 1 from messages m
      where m.conversation_id = c.id
        and m.sender_id <> auth.uid()
        and m.created_at > coalesce(
          (select r.last_read_at
             from conversation_reads r
            where r.conversation_id = c.id and r.user_id = auth.uid()),
          '-infinity'::timestamptz)
    );
$$;

-- Funcoes em Postgres nascem com EXECUTE para PUBLIC por default, e e assim
-- que a producao funciona hoje (o app as chama com a sessao do usuario).
-- Explicitado aqui só para o leitor nao procurar o grant que "falta":
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.unread_conversation_count() to authenticated;
