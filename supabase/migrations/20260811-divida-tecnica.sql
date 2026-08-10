-- ═══════ PALMO · MIGRATION: DIVIDA TECNICA (ago/2026) ═══════
-- Lote `palmo-ai/divida-tecnica` (Partes C.1, C.5 e D).
--
-- ⚠️  NAO FOI APLICADA. Quem roda no SQL Editor e o Carlos, e SO depois de
--     rodar o BLOCO 0 abaixo e conferir a saida. Nenhum agente aplicou nada
--     em banco nenhum.
--
-- ⚠️  ARQUIVO SEPARADO de proposito: as migrations anteriores (ate
--     20260801-*) ja foram aplicadas e nao devem ser editadas. Os revokes
--     manuais de conversations/offers e a 20260730 tambem ja estao em
--     efeito e NAO sao repetidos aqui.
--
-- TRES BLOCOS, cada um independente e idempotente:
--   BLOCO 1 (C.1)  kyc_profiles.status protegido por PRIVILEGIO de coluna,
--                  nao so pela enumeracao do with_check da policy.
--   BLOCO 2 (D)    tabela nova region_interests (interesse por regiao,
--                  semente do motor de liquidez). So INSERT/SELECT proprio.
--   BLOCO 3 (C.5)  higiene: TRUNCATE/TRIGGER/REFERENCES fora de anon e
--                  authenticated em todo o schema public. Defesa em
--                  profundidade, NAO emergencia: nao ha caminho alcancavel
--                  hoje, mas TRUNCATE escapa do RLS e nenhum dos tres serve
--                  ao PostgREST.
--
-- ── C.1: A VARREDURA QUE SUSTENTA AS LISTAS DE COLUNAS ──────────────────────
-- Varrido no codigo em 10/08/2026 (todos os caminhos que escrevem em
-- kyc_profiles com a SESSAO DO USUARIO, anon key + RLS):
--
--   app/app/verificacao/actions.ts:140-151  .upsert({ user_id, tier,
--     status: 'pending', country: 'BR', data, doc_paths, updated_at })
--   app/global/kyc/actions.ts:107-118       .upsert({ user_id, tier,
--     status: 'pending', country, data, doc_paths, updated_at })
--   lib/kyc-triage.ts:261-273  .update(...) — SO cai na sessao do usuario
--     quando SUPABASE_SERVICE_ROLE_KEY nao existe (fallback); com a chave
--     presente (producao), roda como service role e nao depende de grant.
--
-- Upsert no Postgres e INSERT ... ON CONFLICT DO UPDATE: a resubmissao de
-- KYC (apos rejeicao, por exemplo) atualiza a MESMA linha, reescrevendo
-- status para 'pending'. Ou seja: O CLIENTE ESCREVE status LEGITIMAMENTE,
-- no INSERT e no UPDATE. Por isso `status` PERMANECE nas duas listas de
-- grant abaixo — remove-lo do UPDATE quebraria a resubmissao (a linha
-- rejeitada nunca voltaria para a fila). Quem continua impedindo o valor
-- 'approved'/'rejected' vindo do cliente e o with_check das policies
-- kyc_insert/kyc_update (status in ('pending','in_review'), versao da
-- migration 20260729). O ganho REAL deste bloco e outro: as colunas de
-- veredito e triagem (checks, decided_by, decided_by_user_id,
-- decision_reason, reviewed_at, risk_notes, notify_email, submitted_at,
-- doc_purged_at, created_at) SAEM do alcance do cliente. Hoje qualquer
-- sessao pode forjar `checks` ou `decided_by` na propria linha pendente e
-- enganar o admin que decide olhando esses campos. Depois deste bloco, 42501.
--
-- Efeito colateral aceito e documentado: o fallback SEM service role de
-- lib/kyc-triage.ts (que gravaria checks/submitted_at/notify_email e
-- status 'in_review' com a sessao do usuario) passa a falhar no UPDATE e
-- gravarResultado devolve false — a submissao continua funcionando e tudo
-- entra como 'pending' na fila manual (degradacao ja prevista e documentada
-- em kyc-triage.ts:241-249). Producao tem service role e nao passa por ai.
--
-- DELETE tambem e revogado: nenhum `.delete(` existe no repo (auditoria da
-- 20260730), nenhuma policy de DELETE existe em kyc_profiles, e documento
-- de identidade nao e coisa que se apaga por REST com anon key.

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 0 — RODAR ANTES, SEPARADO, E CONFERIR A SAIDA
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 0.a) Privilegios de TABELA atuais de kyc_profiles (esperado, pela medicao
--      de 29/07: anon E authenticated com DELETE, INSERT, REFERENCES,
--      SELECT, TRIGGER, TRUNCATE, UPDATE — o estado escancarado que este
--      bloco fecha):
--
--   select grantee, string_agg(privilege_type, ', ' order by privilege_type)
--   from information_schema.role_table_grants
--   where table_schema='public' and table_name='kyc_profiles'
--     and grantee in ('anon','authenticated')
--   group by grantee order by grantee;
--
-- 0.b) Privilegios de COLUNA atuais de kyc_profiles (esperado: 0 linhas;
--      hoje tudo e grant de tabela):
--
--   select grantee, privilege_type, column_name
--   from information_schema.column_privileges
--   where table_schema='public' and table_name='kyc_profiles'
--     and grantee in ('anon','authenticated')
--   order by grantee, privilege_type, column_name;
--
-- 0.c) Policies vigentes de kyc_profiles (esperado: kyc_select; kyc_insert
--      COM `status in ('pending','in_review')` no with_check; kyc_update
--      idem — as versoes da migration 20260729, que o Carlos reportou como
--      aplicada). ⚠️  Se kyc_insert aparecer SEM a trava de status (versao
--      do lote B), a 20260729 NAO foi aplicada: PARE e me chame antes de
--      seguir, porque a policy e quem segura o VALOR de status.
--
--   select policyname, cmd, qual, with_check
--   from pg_policies
--   where schemaname='public' and tablename='kyc_profiles'
--   order by policyname;
--
-- 0.d) As colunas da triagem existem? (esperado: 7 linhas — checks,
--      decided_by, decided_by_user_id, decision_reason, notify_email,
--      submitted_at, doc_purged_at; se vier 0, a 20260729 nao foi aplicada,
--      mesmo alerta do 0.c)
--
--   select column_name from information_schema.columns
--   where table_schema='public' and table_name='kyc_profiles'
--     and column_name in ('checks','decided_by','decided_by_user_id',
--                         'decision_reason','notify_email','submitted_at',
--                         'doc_purged_at')
--   order by column_name;
--
-- 0.e) Estado atual de TRUNCATE/TRIGGER/REFERENCES no schema public
--      (esperado: presentes na maioria das tabelas para os dois papeis;
--      e o que o BLOCO 3 zera):
--
--   select table_name, grantee,
--          string_agg(privilege_type, ', ' order by privilege_type)
--   from information_schema.role_table_grants
--   where table_schema='public' and grantee in ('anon','authenticated')
--     and privilege_type in ('TRUNCATE','TRIGGER','REFERENCES')
--   group by table_name, grantee order by table_name, grantee;
--
-- 0.f) region_interests ainda nao existe (esperado: 0):
--
--   select count(*) from information_schema.tables
--   where table_schema='public' and table_name='region_interests';

begin;

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 1 (C.1) — kyc_profiles: privilegio de coluna, nao so policy
-- ═══════════════════════════════════════════════════════════════════════════
-- Padrao da casa (mesmo desenho de conversations/offers): revoke amplo de
-- tabela, grant estreito de coluna. As policies existentes (kyc_insert,
-- kyc_update, kyc_select) FICAM COMO ESTAO: linha continua sendo delas,
-- coluna passa a ser do privilegio. Idempotente: revoke/grant repetidos
-- nao mudam nada.

revoke insert, update, delete on public.kyc_profiles from anon, authenticated;

-- INSERT: exatamente o que os dois upserts de submissao enviam.
-- (id nao existe; a PK e user_id. created_at/checks nascem por default.)
grant insert (user_id, tier, status, country, data, doc_paths, updated_at)
  on public.kyc_profiles to authenticated;

-- UPDATE: o ramo ON CONFLICT dos mesmos upserts (resubmissao). `status`
-- permanece pelo motivo do cabecalho (resubmissao reescreve para 'pending';
-- o valor continua travado pelo with_check da policy). As colunas de
-- triagem/veredito ficam DE FORA: so a service role as escreve.
grant update (tier, status, country, data, doc_paths, updated_at)
  on public.kyc_profiles to authenticated;

-- SELECT nao e tocado: continua o grant de tabela existente, com a policy
-- kyc_select limitando cada um a propria linha. `anon` nao recebe grant
-- novo nenhum: perdeu INSERT/UPDATE/DELETE e fica so com o SELECT
-- historico (que o RLS ja filtra para zero linhas).

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 2 (D) — region_interests: interesse por regiao
-- ═══════════════════════════════════════════════════════════════════════════
-- Produtor que busca e nao encontra deixa o interesse registrado com os
-- filtros da busca. EXIGE login (usuario logado ja tem contato); nenhum
-- envio automatico nasce aqui — o aviso continua manual.

create table if not exists public.region_interests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  state        text not null,
  municipality text,
  purpose      text,
  created_at   timestamptz not null default now()
);

alter table public.region_interests enable row level security;

drop policy if exists region_interests_insert on public.region_interests;
create policy region_interests_insert on public.region_interests
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists region_interests_select on public.region_interests;
create policy region_interests_select on public.region_interests
  for select to authenticated
  using (user_id = auth.uid());

-- Sem policy de UPDATE/DELETE (interesse registrado nao se edita pelo
-- cliente) — e, no padrao endurecido da casa, sem privilegio tambem:
revoke all on public.region_interests from anon, authenticated;
grant select on public.region_interests to authenticated;
grant insert (user_id, state, municipality, purpose)
  on public.region_interests to authenticated;

-- Clicar duas vezes nao vira duas linhas: unicidade por (user, regiao,
-- finalidade), com coalesce para os opcionais.
create unique index if not exists region_interests_unicidade_idx
  on public.region_interests (user_id, state,
                              coalesce(municipality, ''),
                              coalesce(purpose, ''));

-- A consulta que interessa (agrupado por regiao):
create index if not exists region_interests_regiao_idx
  on public.region_interests (state, municipality);

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 3 (C.5) — HIGIENE: TRUNCATE/TRIGGER/REFERENCES fora dos papeis REST
-- ═══════════════════════════════════════════════════════════════════════════
-- Nota de calibragem: NAO ha caminho alcancavel hoje — o PostgREST nao emite
-- TRUNCATE, nao cria trigger e nao cria FK. Isto e defesa em profundidade,
-- nao emergencia. Mas TRUNCATE ESCAPA DO RLS (nao passa por policy) e os
-- tres privilegios vieram apenas do default da plataforma. Zerar custa nada.
-- Roda por ultimo de proposito: cobre tambem a region_interests recem-criada
-- (embora o `revoke all` do BLOCO 2 ja a tenha limpado; idempotencia).

revoke truncate, trigger, references on all tables in schema public
  from anon, authenticated;

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACAO (rodar DEPOIS de aplicar, e conferir o resultado)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 1) kyc_profiles por papel (esperado: anon so SELECT; authenticated so
--    SELECT como privilegio de tabela):
--
--   select grantee, string_agg(privilege_type, ', ' order by privilege_type)
--   from information_schema.role_table_grants
--   where table_schema='public' and table_name='kyc_profiles'
--     and grantee in ('anon','authenticated')
--   group by grantee order by grantee;
--
-- 2) kyc_profiles por coluna (esperado: authenticated com INSERT em 7
--    colunas e UPDATE em 6; anon com nada):
--
--   select grantee, privilege_type,
--          string_agg(column_name, ', ' order by column_name)
--   from information_schema.column_privileges
--   where table_schema='public' and table_name='kyc_profiles'
--     and grantee in ('anon','authenticated')
--   group by grantee, privilege_type order by grantee, privilege_type;
--
-- 3) Sonda REST de fora (id impossivel, nao toca dado real). ANTES desta
--    migration, medido em 10/08/2026: HTTP 204 (privilegio concedido, RLS
--    filtrou 0 linhas). DEPOIS, esperado: HTTP 401 com SQLSTATE 42501
--    (permission denied — privilegio, nao policy):
--
--   curl -s -w "%{http_code}\n" -X PATCH \
--     "$SUPABASE_URL/rest/v1/kyc_profiles?user_id=eq.00000000-0000-0000-0000-000000000000" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
--     -H "Content-Type: application/json" -d '{"status":"approved"}'
--
-- 4) TRUNCATE/TRIGGER/REFERENCES zerados (esperado: 0 linhas):
--
--   select table_name, grantee, privilege_type
--   from information_schema.role_table_grants
--   where table_schema='public' and grantee in ('anon','authenticated')
--     and privilege_type in ('TRUNCATE','TRIGGER','REFERENCES');
--
-- 5) region_interests (esperado: authenticated com SELECT de tabela e
--    INSERT nas 4 colunas; anon com nada; RLS ligada com as 2 policies):
--
--   select grantee, privilege_type from information_schema.role_table_grants
--   where table_schema='public' and table_name='region_interests'
--     and grantee in ('anon','authenticated');
--   select policyname, cmd from pg_policies
--   where schemaname='public' and tablename='region_interests';
--
-- ═══════════════════════════════════════════════════════════════════════════
-- A CONSULTA DO CARLOS — interesses agrupados por regiao (rodar quando quiser)
-- ═══════════════════════════════════════════════════════════════════════════
--
--   select ri.state                                   as uf,
--          coalesce(ri.municipality, '(estado todo)') as municipio,
--          count(*)                                   as interesses,
--          count(distinct ri.user_id)                 as usuarios,
--          array_agg(distinct ri.purpose)
--            filter (where ri.purpose is not null)    as finalidades,
--          max(ri.created_at)                         as mais_recente
--   from public.region_interests ri
--   group by ri.state, coalesce(ri.municipality, '(estado todo)')
--   order by interesses desc, uf, municipio;
