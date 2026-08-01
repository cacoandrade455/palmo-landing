-- ═══════════ PALMO · MIGRATION: `car_checked_at` PRIVADO NA VIEW PÚBLICA ═══════════
-- Trilha B.1 do lote `palmo-ai/view-e-arquivamento` (ago/2026).
--
-- ⚠️  NÃO FOI APLICADA. Quem roda no SQL Editor é o Carlos, e SÓ depois de
--     rodar o BLOCO 0 abaixo e conferir a saída. Nenhum agente aplicou nada
--     em banco nenhum.
--
-- ⚠️  ARQUIVO SEPARADO de propósito: as migrations anteriores já foram
--     aplicadas e não devem ser editadas.
--
-- ── O VAZAMENTO QUE ESTA MIGRATION FECHA ────────────────────────────────────
-- Medido no teste de fumaça de 30/07/2026: a view `public.public_listings`
-- expõe `car_checked_at` PREENCHIDO mesmo quando `verified = false` e
-- `car_declarado = false`. A view é lida por `anon` via REST, e a expressão
-- corrente (`cv.checked_at` sem condição) devolve a data da checagem para
-- QUALQUER status do veredito — inclusive `divergente_sicar`.
--
-- `checked_at` preenchido com os dois flags falsos permite a inferência
-- "a Palmo conferiu e NÃO confirmou". Isso viola a regra estabelecida na
-- migration de 29/jul: `divergente_sicar` não aparece em público EM NENHUMA
-- FORMA — não vira selo negativo, não vira aviso, e também não pode virar
-- uma data órfã da qual se deduz a acusação. A plataforma não acusa ninguém.
--
-- A correção é uma só: a EXPRESSÃO de `car_checked_at` passa a devolver a
-- data apenas quando o status corrente é um dos dois que a interface pública
-- de fato exibe (`confirmado_sicar` → selo; `formato_ok` → "CAR declarado").
-- Nos demais casos, `null` — indistinguível de "nunca conferido".
--
-- ── IDEMPOTENTE ─────────────────────────────────────────────────────────────
-- `create or replace view` sobre a mesma lista de colunas (mesmos nomes,
-- mesmos tipos, mesma ordem) + `grant` repetível. Rodar duas vezes não
-- estraga nem muda nada.

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 0 — RODAR ANTES, SEPARADO, E CONFERIR A SAÍDA
-- ═══════════════════════════════════════════════════════════════════════════
-- Não é enfeite: `create or replace view` FALHA se a lista de colunas do
-- banco divergir da lista abaixo (renomear/reordenar/remover não é permitido),
-- então é preciso confirmar que a definição em produção é a da migration de
-- 29/jul. Se qualquer nome, tipo ou posição divergir do esperado, PARE e me
-- chame antes de aplicar o resto.
--
--   select viewname from pg_views
--   where schemaname='public' and viewname='public_listings';
--   -- esperado: 1 linha (`public_listings` existe; foi criada em 28/jul e
--   --           redefinida em 29/jul)
--
--   select column_name, data_type, ordinal_position
--   from information_schema.columns
--   where table_schema='public' and table_name='public_listings'
--   order by ordinal_position;
--   -- esperado, NESTA ordem (a mesma do `select` abaixo):
--   --    1 id                 uuid
--   --    2 owner_id           uuid
--   --    3 title              text
--   --    4 state              text
--   --    5 municipality       text
--   --    6 hectares           numeric
--   --    7 purpose            text
--   --    8 crop               text
--   --    9 price_per_ha_year  numeric
--   --   10 description        text
--   --   11 has_water          boolean
--   --   12 verified           boolean
--   --   13 photos             (array/jsonb conforme a base)
--   --   14 created_at         timestamptz
--   --   15 car_declarado      boolean
--   --   16 car_checked_at     timestamptz   ← a coluna desta migration
--   --   17 edited_at          timestamptz
--
--   select count(*) from information_schema.tables
--   where table_schema='public' and table_name='listing_car_verifications';
--   -- esperado: 1 (a migration de 29/jul foi aplicada; a view lê esta tabela)

begin;

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCO 1 — A VIEW, com `car_checked_at` calado fora do selo
-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠️  `create or replace view` NÃO consegue renomear, reordenar nem remover
--     coluna. Esta redefinição muda APENAS a EXPRESSÃO de `car_checked_at`
--     (nome e tipo mantidos, mesma posição). Todas as outras colunas estão
--     copiadas IDÊNTICAS da definição de 29/jul.
--
-- `security_invoker = off` MANTIDO e explícito: a view roda com os direitos
-- do dono (postgres, que ignora RLS). É isso que permite ela ler
-- `listing_car_verifications` sem dar grant de leitura para anon — e o
-- `where status = 'active'` continua sendo o contrato público inteiro.
-- ⚠️  Se alguém trocar para `security_invoker = on`, anon deixa de ver
--     QUALQUER COISA, porque anon levou `revoke select` na tabela base em
--     28/jul. Não trocar.
--
-- Continua FORA da view: car_number cru, matricula, geometria do imóvel — e
-- agora também qualquer rastro público de checagem que não sustente selo.

create or replace view public.public_listings
  with (security_invoker = off) as
  select
    l.id,
    l.owner_id,        -- uuid opaco: habilita "isOwner" e o display_name
                       -- público via public_profiles; não é dado de contato
    l.title,
    l.state,
    l.municipality,
    l.hectares,
    l.purpose,
    l.crop,
    l.price_per_ha_year,
    l.description,
    l.has_water,

    -- ── O SELO (inalterado desde 29/jul) ──────────────────────────────────
    -- Só confirmação real na base do SICAR vira selo.
    coalesce(cv.status = 'confirmado_sicar', false) as verified,

    l.photos,
    l.created_at,

    -- Estado intermediário honesto (inalterado desde 29/jul). A copy que
    -- acompanha é "CAR declarado pelo proprietário", NUNCA "verificado".
    coalesce(cv.status = 'formato_ok', false) as car_declarado,

    -- ── A CORREÇÃO DESTA MIGRATION ────────────────────────────────────────
    -- ANTES: `cv.checked_at` sem condição → a data saía preenchida para
    --        QUALQUER veredito, inclusive `divergente_sicar`. Com
    --        `verified=false` e `car_declarado=false`, uma data preenchida
    --        permitia inferir "conferimos e não confirmou" — acusação por
    --        omissão, em página pública, via REST anônimo.
    -- AGORA: a data só sai quando existe algo público que ela lastreia — o
    --        selo (`confirmado_sicar`) ou o "CAR declarado" (`formato_ok`).
    --        Nos demais casos (`divergente_sicar`, `formato_invalido`,
    --        `nao_informado`, ou nenhuma verificação), `null`:
    --        indistinguível de "nunca conferido". É a regra "não acusa em
    --        público" da migration de 29/jul, aplicada também à data.
    case
      when cv.status in ('confirmado_sicar', 'formato_ok') then cv.checked_at
      else null
    end as car_checked_at,

    -- "anúncio editado em [data]" (inalterado desde 29/jul).
    l.edited_at
  from public.listings l
  -- O veredito MAIS RECENTE. `left join lateral` porque anúncio sem
  -- verificação nenhuma tem que continuar aparecendo (só sem selo).
  left join lateral (
    select v.status, v.checked_at
    from public.listing_car_verifications v
    where v.listing_id = l.id
    order by v.created_at desc
    limit 1
  ) cv on true
  where l.status = 'active';

-- Refeito porque `create or replace view` não preserva grant em toda versão.
grant select on public.public_listings to anon, authenticated;

-- `divergente_sicar` segue SEM aparecer aqui, em nenhuma forma — nem como
-- status, nem como data. É sinal interno para o Carlos (consulta de
-- visibilidade interna no fim da migration de 29/jul).

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (rodar DEPOIS de aplicar, e conferir o resultado)
-- ═══════════════════════════════════════════════════════════════════════════
-- O vazamento medido em 30/jul era: `car_checked_at` preenchido com
-- `verified=false` e `car_declarado=false`. Depois desta migration, isso não
-- pode existir em NENHUMA linha:
--
--   select id, car_declarado, verified, car_checked_at
--   from public.public_listings
--   order by created_at desc;
--   -- esperado: `car_checked_at` NULL sempre que `verified=false` e
--   --           `car_declarado=false`. Preenchido só quando um dos dois é true.
--
-- A mesma conferência, reduzida a um número (0 = fechado):
--
--   select count(*) from public.public_listings
--   where car_checked_at is not null
--     and verified = false
--     and car_declarado = false;
--   -- esperado: 0
--
-- E que anon continua lendo a view (o grant foi refeito):
--
--   select grantee, privilege_type from information_schema.role_table_grants
--   where table_schema='public' and table_name='public_listings'
--     and grantee in ('anon','authenticated');
--   -- esperado: SELECT para os dois papéis
