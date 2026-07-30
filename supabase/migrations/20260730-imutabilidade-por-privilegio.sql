-- ═══════ PALMO · MIGRATION: IMUTABILIDADE POR PRIVILÉGIO, NÃO POR AUSÊNCIA ═══════
-- Lote `palmo-ai/car-sicar-e-fotos` — Adendo 2 (jul/2026).
--
-- ⚠️  NÃO FOI APLICADA. Quem roda no SQL Editor é o Carlos, e SÓ depois de
--     rodar o BLOCO 0 e conferir a saída. Nenhum agente aplicou nada.
--
-- ⚠️  ARQUIVO SEPARADO de propósito: `20260729-car-sicar-e-fotos.sql` pode já
--     ter sido aplicada e não deve ser editada.
--
-- ── O PROBLEMA QUE ESTA MIGRATION RESOLVE ───────────────────────────────────
-- Hoje a imutabilidade das tabelas de prova depende da AUSÊNCIA de policy de
-- RLS, não de privilégio de tabela. O privilégio está concedido; só não existe
-- policy que permita, então o RLS nega. A proteção inteira depende de ninguém
-- adicionar uma policy achando que falta — e é exatamente o padrão que já
-- falhou várias vezes neste projeto.
--
-- MEDIDO EM PRODUÇÃO em 29/07/2026, via API REST com a anon key, usando um id
-- impossível (`00000000-0000-0000-0000-000000000000`) para não tocar em dado
-- real. No PostgREST, HTTP 204 = privilégio OK e RLS filtrou 0 linhas;
-- HTTP 401 com SQLSTATE 42501 = privilégio NEGADO. O contraste entre as linhas
-- abaixo é a prova:
--
--   DELETE messages            → 204   privilégio CONCEDIDO
--   DELETE conversations       → 204   privilégio CONCEDIDO
--   DELETE offers              → 204   privilégio CONCEDIDO
--   DELETE legal_acceptances   → 204   privilégio CONCEDIDO
--   DELETE listings            → 401 42501   negado (revoke de 28/jul funcionando)
--   PATCH  messages            → 204   privilégio CONCEDIDO
--   PATCH  conversations       → 401 42501   negado (revoke manual funcionando)
--   PATCH  legal_acceptances   → 204   privilégio CONCEDIDO
--
-- ── E POR QUE REVOGAR DELETE É SEGURO ───────────────────────────────────────
-- Varredura no repo inteiro: **`.delete(` não existe em NENHUM arquivo .ts/.tsx**
-- de `app/`, `lib/` e `components/`. Zero ocorrências. Nenhum caminho da
-- aplicação apaga linha de tabela nenhuma. Só existem dois `.upsert(`, ambos em
-- `kyc_profiles`, que não é tocada aqui.

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 0 — RODAR ANTES, SEPARADO, E CONFERIR A SAÍDA
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 0.a) ✅ BLOQUEIO RESOLVIDO — CONFERIDO NO BANCO EM 29/07/2026.
--
-- Duas funções que o código chama não existem em nenhum .sql do repo (foram
-- criadas à mão no SQL Editor):
--   app/app/actions.ts:58              supabase.rpc("unread_conversation_count")
--   app/app/mensagens/actions.ts:57    supabase.rpc("unread_conversation_count")
--   app/app/mensagens/[id]/actions.ts  supabase.rpc("mark_conversation_read")
--
-- Isso era um bloqueio: função SEM security definer roda com os direitos do
-- CHAMADOR e SERIA quebrada por um revoke. Consultado no banco:
--
--   FUNCAO get_counterparty_contact     → SECURITY DEFINER
--   FUNCAO mark_conversation_read       → SECURITY DEFINER
--   FUNCAO unread_conversation_count    → SECURITY DEFINER
--
-- As três são SECURITY DEFINER, portanto rodam com os direitos do dono e NÃO são
-- afetadas por revoke de `anon`/`authenticated`. As revogações abaixo são
-- seguras.
--
-- Confirmado também que existe a tabela `conversation_reads` (é onde o "lido" é
-- persistido — `conversations` não tem coluna de leitura), e ela NÃO está na
-- lista de revogação.
--
-- Consultas usadas, para reconferir quando quiser:
--   select p.proname, p.prosecdef as security_definer
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname='public'
--     and p.proname in ('mark_conversation_read','unread_conversation_count');
--
-- 0.a.2) ⚠️  ESTADO REAL DAS TABELAS EM 29/07/2026 (`select tablename from
-- pg_tables where schemaname='public'`), 12 tabelas:
--
--   contract_approvals, contract_comments, contract_versions, contracts,
--   conversation_reads, conversations, kyc_profiles, legal_acceptances,
--   listings, messages, offers, profiles
--
-- 🔴 `kyc_reviews` e `kyc_notifications` NÃO EXISTEM. A migration
--    `20260729-kyc-triagem.sql` NÃO foi aplicada, apesar de o lote de KYC (PR
--    #28) estar mergeado. O código foi escrito para degradar com elegância
--    (tudo entra na fila manual, sem auto-aprovação), então nada está quebrado —
--    mas a triagem automática não está valendo. Isto é achado, não escopo deste
--    lote: os blocos abaixo que tocam `kyc_reviews` simplesmente não executam,
--    porque cada um roda dentro de um guard de existência.
--
-- 0.a.3) ANTES dos privilégios, medido (`information_schema.role_table_grants`,
-- só anon e authenticated, agrupado):
--
--   conversations      | anon          | DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE
--   conversations      | authenticated | DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE
--   kyc_profiles       | anon          | DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
--   kyc_profiles       | authenticated | DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
--   legal_acceptances  | anon          | DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
--   legal_acceptances  | authenticated | DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
--   listings           | anon          | DELETE,INSERT,REFERENCES,TRIGGER,TRUNCATE,UPDATE
--   listings           | authenticated | DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
--   messages           | anon          | DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
--   messages           | authenticated | DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
--   offers             | anon          | DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
--   offers             | authenticated | DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
--
-- Leitura desse quadro:
--   • `conversations` SEM UPDATE de tabela → o seu revoke manual PEGOU. ✅
--     (o `grant update (updated_at)` é privilégio de COLUNA e por isso não
--     aparece aqui; aparece em `information_schema.column_privileges`)
--   • `offers` COM UPDATE de tabela → o seu revoke manual NÃO pegou. ❌
--     Ver o bloco vermelho logo abaixo.
--   • `listings` com DELETE nos dois papéis → o BLOCO 4 da migration anterior
--     (`revoke delete on listings`) ainda não foi aplicado. E note que anon está
--     sem SELECT: esse é o `revoke select` de 28/jul, que pegou.
--   • `messages` e `legal_acceptances` com UPDATE e DELETE → é o que esta
--     migration fecha.
--
-- 0.b) Estado atual dos privilégios das tabelas desta migration:
--
--   select table_name, grantee, privilege_type
--   from information_schema.role_table_grants
--   where table_schema = 'public'
--     and grantee in ('anon','authenticated')
--     and table_name in ('messages','conversations','offers','legal_acceptances',
--                        'kyc_reviews','listing_changes','listing_car_verifications')
--   order by table_name, grantee, privilege_type;
--
-- 0.c) Privilégio de COLUNA em conversations e offers (o que precisa SOBREVIVER):
--
--   select table_name, grantee, privilege_type, column_name
--   from information_schema.column_privileges
--   where table_schema='public' and table_name in ('conversations','offers')
--     and grantee in ('anon','authenticated')
--   order by table_name, grantee, column_name;
--
-- 0.d) Existem as tabelas da migration anterior? (se 0, ela não foi aplicada)
--
--   select count(*) from information_schema.tables
--   where table_schema='public'
--     and table_name in ('listing_changes','listing_car_verifications');

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔴 PENDÊNCIA QUE **NÃO** ESTÁ NESTA MIGRATION, E PRECISA DA SUA MÃO
-- ═══════════════════════════════════════════════════════════════════════════
-- O Adendo 1 informou que estes quatro comandos já haviam sido aplicados à mão,
-- e me instruiu a NÃO repeti-los aqui. Eu não os repeti — este bloco está
-- COMENTADO e não executa nada.
--
-- MAS A MEDIÇÃO DIZ QUE, EM `offers`, ELES NÃO ESTÃO EM EFEITO — e agora está
-- confirmado das duas formas: pela sonda externa (abaixo) E pelo
-- `information_schema.role_table_grants` do item 0.a.3, que mostra UPDATE de
-- tabela em `offers` para `anon` E para `authenticated`, enquanto
-- `conversations` aparece corretamente sem UPDATE.
--
-- Sonda externa, como `anon`, em 29/07/2026:
--
--   PATCH offers {"price_per_ha_year":1} → HTTP 204   privilégio CONCEDIDO
--   PATCH offers {"status":"accepted"}   → HTTP 204   privilégio CONCEDIDO
--   PATCH offers {"term_years":1}        → HTTP 204   privilégio CONCEDIDO
--   PATCH offers {"message":"x"}         → HTTP 204   privilégio CONCEDIDO
--   PATCH conversations {...}            → HTTP 401 42501   negado  ✅
--
-- Controle que valida o método: `{"coluna_que_nao_existe":1}` devolve 400
-- PGRST204 nas duas tabelas, provando que a requisição chega ao Postgres e que
-- o 401 de `conversations` vem da checagem de privilégio, não do PostgREST.
--
-- Ou seja: o par de `conversations` pegou, o par de `offers` não. Enquanto isso,
-- `offers.price_per_ha_year` — a base de cálculo da multa da Cláusula 3.4.1 —
-- segue gravável por quem tiver privilégio de participante.
--
-- Abaixo está a SUA redação original, verbatim, sem uma vírgula mudada, porque
-- reescrever isso é justamente como se reabre uma brecha. Rode você:
--
--   revoke update on public.conversations from anon, authenticated;
--   grant  update (updated_at) on public.conversations to authenticated;
--
--   revoke update on public.offers from anon, authenticated;
--   grant  update (status) on public.offers to authenticated;
--
-- ⚠️  As duas GRANTs de coluna são OBRIGATÓRIAS e não podem ser esquecidas:
--   • `offers.status`        → sem ela ninguém aceita/recusa proposta
--     (app/app/mensagens/[id]/actions.ts:167, sessão do usuário). E como o
--     fechamento exige proposta aceita, nenhum negócio fecharia, o contato nunca
--     seria revelado e a Taxa nunca seria cobrada.
--   • `conversations.updated_at` → sem ela a inbox para de reordenar, EM
--     SILÊNCIO (app/app/mensagens/[id]/actions.ts:128 descarta o erro, e
--     app/app/mensagens/actions.ts:28 ordena por updated_at).

begin;

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 1 — IMUTABILIDADE POR PRIVILÉGIO
-- ═══════════════════════════════════════════════════════════════════════════
-- Cada revoke roda dentro de um guard de existência: a migration anterior pode
-- não ter sido aplicada, e `revoke` em tabela inexistente aborta a transação
-- inteira. Idempotente: rodar duas vezes não estraga nada.

do $$
begin
  -- ── messages: INSERT permanece, UPDATE e DELETE saem ─────────────────────
  -- A aplicação só faz SELECT (mensagens[id]/actions.ts:69) e INSERT (:122).
  -- Mensagem enviada não se edita nem se apaga: é isso que a torna prova do que
  -- foi combinado, e a Cláusula 3.4.2 depende disso.
  if exists (select 1 from pg_tables where schemaname='public' and tablename='messages') then
    revoke update, delete on public.messages from anon, authenticated;
  end if;

  -- ── conversations: SÓ DELETE ──────────────────────────────────────────────
  -- ⚠️  NÃO revogar UPDATE aqui: `grant update (updated_at) to authenticated`
  --     precisa sobreviver, senão a inbox para de reordenar em silêncio.
  if exists (select 1 from pg_tables where schemaname='public' and tablename='conversations') then
    revoke delete on public.conversations from anon, authenticated;
  end if;

  -- ── offers: SÓ DELETE ─────────────────────────────────────────────────────
  -- ⚠️  NÃO revogar UPDATE aqui: `grant update (status) to authenticated`
  --     precisa sobreviver, senão ninguém aceita proposta e nada fecha.
  --     A restrição de UPDATE de `offers` é o bloco comentado acima, seu.
  if exists (select 1 from pg_tables where schemaname='public' and tablename='offers') then
    revoke delete on public.offers from anon, authenticated;
  end if;

  -- ── legal_acceptances: INSERT permanece, UPDATE e DELETE saem ─────────────
  -- O app INSERE com a sessão do usuário (é o próprio aceite dele), então
  -- INSERT fica. Mas aceite registrado não se altera nem se apaga: a tabela
  -- guarda ip, user_agent e versão, e é isso que a torna prova.
  if exists (select 1 from pg_tables where schemaname='public' and tablename='legal_acceptances') then
    revoke update, delete on public.legal_acceptances from anon, authenticated;
  end if;

  -- ── kyc_reviews: nem INSERT ───────────────────────────────────────────────
  -- A migration do KYC fez `revoke all ... from anon` e `grant select ... to
  -- authenticated` — o revoke cobriu SÓ anon. `authenticated` nunca perdeu
  -- INSERT/UPDATE/DELETE. Só a service role escreve auditoria de KYC.
  if exists (select 1 from pg_tables where schemaname='public' and tablename='kyc_reviews') then
    revoke insert, update, delete on public.kyc_reviews from anon, authenticated;
  end if;

  -- ── kyc_notifications: reafirmado ─────────────────────────────────────────
  -- Já estava correto (`revoke all ... from anon, authenticated`). Repetido por
  -- idempotência, para o conjunto ficar completo num lugar só.
  if exists (select 1 from pg_tables where schemaname='public' and tablename='kyc_notifications') then
    revoke all on public.kyc_notifications from anon, authenticated;
  end if;

  -- ── as duas tabelas de prova do lote anterior ─────────────────────────────
  -- Já revogadas em 20260729-car-sicar-e-fotos.sql. Reafirmadas aqui porque
  -- aquela migration pode não ter sido aplicada quando esta rodar, e porque o
  -- conjunto completo precisa caber numa única leitura.
  if exists (select 1 from pg_tables where schemaname='public' and tablename='listing_changes') then
    revoke insert, update, delete on public.listing_changes from anon, authenticated;
  end if;
  if exists (select 1 from pg_tables where schemaname='public' and tablename='listing_car_verifications') then
    revoke insert, update, delete on public.listing_car_verifications from anon, authenticated;
  end if;
end $$;

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO DEPOIS DE APLICAR
-- ═══════════════════════════════════════════════════════════════════════════
-- Esperado: para anon e authenticated, `messages` só com SELECT e INSERT;
-- `conversations` e `offers` sem DELETE; `legal_acceptances` só com SELECT e
-- INSERT; `kyc_reviews` só com SELECT; as duas tabelas do lote anterior só com
-- SELECT (e anon sem nada).
--
--   select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type)
--   from information_schema.role_table_grants
--   where table_schema='public' and grantee in ('anon','authenticated')
--     and table_name in ('messages','conversations','offers','legal_acceptances',
--                        'kyc_reviews','listing_changes','listing_car_verifications')
--   group by table_name, grantee order by table_name, grantee;
--
-- Repetir a sonda segura de fora (id impossível, não toca dado real). Depois
-- desta migration, DELETE em messages/conversations/offers/legal_acceptances
-- deve devolver 401 com 42501 em vez de 204:
--
--   curl -s -o /dev/null -w "%{http_code}\n" -X DELETE \
--     "$SUPABASE_URL/rest/v1/messages?id=eq.00000000-0000-0000-0000-000000000000" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $ANON"

-- ═══════════════════════════════════════════════════════════════════════════
-- DETECÇÃO DE NEGÓCIO FECHADO POR FORA (rodar quando quiser; não é view)
-- ═══════════════════════════════════════════════════════════════════════════
-- A assinatura no banco é: proposta ACEITA, conversa que nunca virou 'closed',
-- e o anúncio saindo do ar. Cada passo é individualmente legítimo — o que
-- interessa é a sequência. Esta é a lista de CANDIDATOS A OLHAR, não de
-- culpados: a plataforma não acusa ninguém, e nada disto aparece em público.
--
--   select c.id                                as conversa,
--          l.id                                as anuncio,
--          l.title,
--          l.state, l.municipality,
--          l.status                            as status_do_anuncio,
--          c.deal_status,
--          o.price_per_ha_year, o.term_years,
--          o.created_at                        as proposta_aceita_em,
--          (current_date - o.created_at::date) as dias_desde_a_aceitacao,
--          -- o registro alto gravado por lib/listing-status.ts quando o anúncio
--          -- sai do ar existindo proposta aceita
--          (select max(lc.created_at) from public.listing_changes lc
--            where lc.listing_id = l.id
--              and lc.field = 'status_com_proposta_aceita') as saiu_do_ar_em
--     from public.offers o
--     join public.conversations c on c.id = o.conversation_id
--     join public.listings      l on l.id = o.listing_id
--    where o.status = 'accepted'
--      and c.deal_status <> 'closed'
--    order by dias_desde_a_aceitacao desc;
--
-- Refinamento: só os que JÁ saíram do ar (o sinal mais forte) — acrescente
--      and l.status in ('paused','archived')
--
-- E o histórico completo de um anúncio suspeito:
--
--   select field, old_value, new_value, categoria, actor_id, created_at
--     from public.listing_changes
--    where listing_id = '<uuid>'
--    order by created_at desc;

-- ═══════════════════════════════════════════════════════════════════════════
-- FORA DE ESCOPO, REGISTRADO
-- ═══════════════════════════════════════════════════════════════════════════
-- Selo temporal externo (OpenTimestamps) sobre a trilha de conversa: torna a
-- prova verificável por terceiro sem depender da nossa palavra. Subsistema novo,
-- NÃO construído neste lote.
--
-- Exclusão de conta destruindo prova em cascata: ver a seção B.2 do PR. Cadeia
-- confirmada, correção NÃO feita — trocar CASCADE por RESTRICT colide com
-- direito de eliminação da LGPD, e a decisão é jurídica, não técnica.
